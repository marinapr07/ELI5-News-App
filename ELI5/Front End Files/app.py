from flask import Flask, render_template, jsonify, request
from datetime import datetime, timezone
import requests
import os

app = Flask(__name__)

# ─────────────────────────────────────────
# API KEYS — set these as environment variables
# ─────────────────────────────────────────
NEWSAPI_KEY      = os.getenv("NEWSAPI_KEY", "")
NYTIMES_KEY      = os.getenv("NYTIMES_KEY", "")
GUARDIAN_KEY     = os.getenv("GUARDIAN_KEY", "")
ANTHROPIC_KEY    = os.getenv("ANTHROPIC_KEY", "")

# ─────────────────────────────────────────
# CATEGORY MAPPING
# Maps source category strings → ELI5 internal tags
# ─────────────────────────────────────────
TAG_MAP = {
    "technology": "tech",   "tech": "tech",
    "business":  "business","finance": "business", "economy": "business",
    "entertainment": "ent", "arts": "ent",
    "world": "world",       "politics": "world",   "international": "world",
    "us": "us",             "national": "us",      "u.s.": "us",
    "fashion": "culture",   "art": "culture",      "culture": "culture",
}

TAG_LABELS = {
    "tech":     "Tech",
    "business": "Business",
    "ent":      "Entertainment",
    "world":    "World News / Politics",
    "us":       "US News",
    "culture":  "Art, Culture & Fashion",
}

def resolve_tag(category: str) -> str:
    return TAG_MAP.get(category.lower().strip(), "world")

def time_ago(date_str: str) -> str:
    if not date_str:
        return "just now"
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        diff = int((datetime.now(timezone.utc) - dt).total_seconds())
        if diff < 60:   return "just now"
        if diff < 3600: return f"{diff // 60} min ago"
        if diff < 86400:return f"{diff // 3600} hr ago"
        return f"{diff // 86400} days ago"
    except Exception:
        return "recently"


# ─────────────────────────────────────────
# ELI5 SUMMARISER  (Claude Haiku via RAG)
# Replace this stub with your actual pipeline call
# Expected return shape:
# {
#   "eli5_summary":   str,   # short one-liner for card
#   "eli5_lede":      str,   # opening sentence for article view
#   "eli5_body":      str,   # 2-3 paragraph ELI5 explanation
#   "eli5_pullquote": str,   # punchy quote
#   "eli5_stats":     list,  # [{"l": label, "v": value, "d": delta, "c": "up|down|"}]
#   "eli5_chart_title": str,
#   "eli5_chart":     list,  # [{"l": label, "p": int 0-100, "col": hex}]
# }
# ─────────────────────────────────────────
def generate_eli5(article: dict) -> dict:
    """
    Stub — replace with your RAG + Claude Haiku pipeline.
    For now returns the raw description as a fallback.
    """
    return {
        "eli5_summary":     article.get("description", ""),
        "eli5_lede":        article.get("description", ""),
        "eli5_body":        article.get("content", article.get("description", "")),
        "eli5_pullquote":   "",
        "eli5_stats":       [],
        "eli5_chart_title": "",
        "eli5_chart":       [],
    }


# ─────────────────────────────────────────
# ARTICLE NORMALISER
# Converts any raw API article → unified ELI5 shape
# ─────────────────────────────────────────
def normalise(raw: dict) -> dict:
    category = (
        raw.get("category")
        or raw.get("section")
        or raw.get("subsection")
        or raw.get("sectionName")
        or ""
    )
    tc = resolve_tag(category)

    eli5 = generate_eli5(raw)

    return {
        # display fields
        "tc":        tc,
        "tl":        TAG_LABELS.get(tc, "World News / Politics"),
        "time":      time_ago(
                        raw.get("publishedAt")
                        or raw.get("pub_date")
                        or raw.get("webPublicationDate")
                     ),
        "hk":        tc,                                          # hero illustration key
        "imageUrl":  (
                        raw.get("urlToImage")
                        or (raw.get("multimedia") or [{}])[0].get("url")
                        or (raw.get("fields") or {}).get("thumbnail")
                     ),
        "hl":        (
                        raw.get("title")
                        or (raw.get("headline") or {}).get("main")
                        or raw.get("webTitle")
                        or "Untitled"
                     ),
        "sm":        eli5["eli5_summary"],
        "ld":        eli5["eli5_lede"],
        "bd":        eli5["eli5_body"],
        "pq":        eli5["eli5_pullquote"],
        "stats":     eli5["eli5_stats"],
        "chartTitle":eli5["eli5_chart_title"],
        "chartBars": eli5["eli5_chart"],
        "src":       (
                        (raw.get("source") or {}).get("name")
                        or raw.get("source")
                        or raw.get("sectionName")
                        or "News"
                     ),
        "url":       raw.get("url") or raw.get("web_url") or raw.get("webUrl") or "#",
    }


# ─────────────────────────────────────────
# DATA FETCHERS — one per news source
# ─────────────────────────────────────────
def fetch_newsapi(category: str = "general", page_size: int = 20) -> list:
    if not NEWSAPI_KEY:
        return []
    url = "https://newsapi.org/v2/top-headlines"
    params = {"apiKey": NEWSAPI_KEY, "language": "en", "pageSize": page_size}
    if category != "all":
        params["category"] = category
    try:
        r = requests.get(url, params=params, timeout=8)
        r.raise_for_status()
        articles = r.json().get("articles", [])
        for a in articles:
            a["category"] = category
        return articles
    except Exception as e:
        print(f"NewsAPI error: {e}")
        return []


def fetch_nytimes(section: str = "home") -> list:
    if not NYTIMES_KEY:
        return []
    url = f"https://api.nytimes.com/svc/topstories/v2/{section}.json"
    try:
        r = requests.get(url, params={"api-key": NYTIMES_KEY}, timeout=8)
        r.raise_for_status()
        results = r.json().get("results", [])
        for a in results:
            a["source"] = {"name": "NYT"}
            a["title"] = a.get("title")
            a["description"] = a.get("abstract")
            a["url"] = a.get("url")
            a["publishedAt"] = a.get("published_date")
            a["urlToImage"] = (a.get("multimedia") or [{}])[0].get("url")
            a["category"] = a.get("section", section)
        return results
    except Exception as e:
        print(f"NYT error: {e}")
        return []


def fetch_guardian(section: str = "news") -> list:
    if not GUARDIAN_KEY:
        return []
    url = "https://content.guardianapis.com/search"
    params = {
        "api-key":    GUARDIAN_KEY,
        "section":    section,
        "show-fields":"thumbnail,trailText",
        "page-size":  20,
        "order-by":   "newest",
    }
    try:
        r = requests.get(url, params=params, timeout=8)
        r.raise_for_status()
        results = r.json().get("response", {}).get("results", [])
        for a in results:
            a["source"] = {"name": "The Guardian"}
            a["title"] = a.get("webTitle")
            a["description"] = (a.get("fields") or {}).get("trailText", "")
            a["url"] = a.get("webUrl")
            a["publishedAt"] = a.get("webPublicationDate")
            a["urlToImage"] = (a.get("fields") or {}).get("thumbnail")
            a["category"] = a.get("sectionName", section)
        return results
    except Exception as e:
        print(f"Guardian error: {e}")
        return []


# ─────────────────────────────────────────
# SEED DATA — used when no API keys are set
# ─────────────────────────────────────────
SEED_ARTICLES = [
    {"title": "AI taking over more jobs fr", "description": "robots are literally eating everyone's lunch and nobody's doing anything about it.", "category": "technology", "publishedAt": "2026-04-14T14:00:00Z", "source": {"name": "The Guardian"}, "url": "https://www.theguardian.com/technology", "urlToImage": None, "eli5_summary": "robots are literally eating everyone's lunch and nobody's doing anything about it.", "eli5_lede": "companies big and small are quietly swapping out entire teams for AI tools.", "eli5_body": "we're talking customer service, copywriting, even coding. 'efficiency gains' in the boardroom and 'wait what happened to my job' everywhere else.", "eli5_pullquote": "it's not that AI is smarter — it's cheaper, faster, and never asks for PTO.", "eli5_stats": [{"l": "Jobs at risk", "v": "14%", "d": "+2%", "c": "down"}, {"l": "Sectors hit", "v": "38", "d": "this yr", "c": ""}, {"l": "Avg loss", "v": "$12k", "d": "median", "c": "down"}], "eli5_chart_title": "industries affected (%)", "eli5_chart": [{"l": "Data entry", "p": 82, "col": "#5b5ef4"}, {"l": "Customer svc", "p": 71, "col": "#5b5ef4"}, {"l": "Accounting", "p": 58, "col": "#7b7ef8"}]},
    {"title": "Rent prices up AGAIN. it's so over", "description": "landlords are charging even more and the housing market is in its villain era.", "category": "business", "publishedAt": "2026-04-14T13:30:00Z", "source": {"name": "NYT"}, "url": "https://www.nytimes.com/section/realestate", "urlToImage": None, "eli5_summary": "landlords are charging even more and nobody can afford it.", "eli5_lede": "median rent in major US cities ticked up again.", "eli5_body": "the math simply does not math. not enough units were built in the 2010s and zoning laws make building more a nightmare.", "eli5_pullquote": "the rent is too damn high — and nobody's even making a meme about it anymore.", "eli5_stats": [{"l": "Avg rent NYC", "v": "$3.8k", "d": "+9% YoY", "c": "down"}, {"l": "% income", "v": "38%", "d": "+5pts", "c": "down"}, {"l": "Vacancy", "v": "1.4%", "d": "record low", "c": "down"}], "eli5_chart_title": "rent increase YoY (%)", "eli5_chart": [{"l": "NYC", "p": 91, "col": "#f59e0b"}, {"l": "Miami", "p": 78, "col": "#f59e0b"}, {"l": "LA", "p": 65, "col": "#fbbf24"}]},
    {"title": "Big geopolitical drama happening rn", "description": "multiple countries are in their beef era, diplomats are scrambling.", "category": "world", "publishedAt": "2026-04-14T11:00:00Z", "source": {"name": "The Guardian"}, "url": "https://www.theguardian.com/world", "urlToImage": None, "eli5_summary": "multiple countries are beefing and diplomats are scrambling.", "eli5_lede": "several major powers in a standoff while back-channels work overtime.", "eli5_body": "classic game theory: both sides know escalation is bad but neither wants to look weak.", "eli5_pullquote": "every diplomat is trying to de-escalate while their boss posts about it online.", "eli5_stats": [{"l": "Countries", "v": "7", "d": "+ 3 new", "c": "down"}, {"l": "Trade", "v": "$2.1T", "d": "at stake", "c": ""}, {"l": "Days", "v": "43", "d": "escalating", "c": "down"}], "eli5_chart_title": "tension index", "eli5_chart": [{"l": "E. Asia", "p": 88, "col": "#1d9e75"}, {"l": "E. Europe", "p": 74, "col": "#1d9e75"}, {"l": "Mid. East", "p": 69, "col": "#2db887"}]},
    {"title": "Congress did a thing and everyone's mad", "description": "another bill that somehow pleases nobody.", "category": "us", "publishedAt": "2026-04-14T10:15:00Z", "source": {"name": "NYT"}, "url": "https://www.nytimes.com/section/politics", "urlToImage": None, "eli5_summary": "another bill that somehow pleases nobody. both sides are beefing.", "eli5_lede": "a bill meant to be bipartisan somehow made both parties angrier.", "eli5_body": "the left thinks it didn't go far enough. the right thinks it went too far. moderates getting ratio'd by their own base.", "eli5_pullquote": "the only thing both parties agree on is that the other party ruined it.", "eli5_stats": [{"l": "Votes for", "v": "218", "d": "bare maj.", "c": ""}, {"l": "Approval", "v": "31%", "d": "-12pts", "c": "down"}], "eli5_chart_title": "approval by party (%)", "eli5_chart": [{"l": "Overall", "p": 31, "col": "#e24b4a"}, {"l": "Democrats", "p": 44, "col": "#e24b4a"}, {"l": "Republicans", "p": 22, "col": "#f09595"}]},
    {"title": "Met Gala looks already leaking and it's a lot", "description": "somebody's stylist said let's go full avant-garde.", "category": "culture", "publishedAt": "2026-04-14T09:00:00Z", "source": {"name": "The Guardian"}, "url": "https://www.theguardian.com/fashion", "urlToImage": None, "eli5_summary": "somebody's stylist said let's go full avant-garde and we respect the vision.", "eli5_lede": "carpet hasn't officially opened and paparazzi shots are already everywhere.", "eli5_body": "some understood the assignment. others attempted it. Anna Wintour remains the final boss.", "eli5_pullquote": "fashion is the only industry where spending $40k to look uncomfortable is a power move.", "eli5_stats": [{"l": "Looks", "v": "450+", "d": "expected", "c": ""}, {"l": "Avg cost", "v": "$35k", "d": "per outfit", "c": ""}, {"l": "Mentions", "v": "12M", "d": "first 2hrs", "c": "up"}], "eli5_chart_title": "engagement by look (M)", "eli5_chart": [{"l": "Look #1", "p": 95, "col": "#9b59d0"}, {"l": "Look #2", "p": 81, "col": "#9b59d0"}, {"l": "Look #3", "p": 67, "col": "#b07de0"}]},
]


# ─────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/articles")
def get_articles():
    """
    Returns normalised articles for the front-end.
    Query params:
      ?category=all|tech|business|ent|world|us|culture
      ?source=newsapi|nyt|guardian|all  (default: all)
    Falls back to seed data if no API keys configured.
    """
    category = request.args.get("category", "all")
    source   = request.args.get("source", "all")

    raw = []

    if NEWSAPI_KEY or NYTIMES_KEY or GUARDIAN_KEY:
        if source in ("newsapi", "all") and NEWSAPI_KEY:
            raw += fetch_newsapi(category if category != "all" else "general")
        if source in ("nyt", "all") and NYTIMES_KEY:
            raw += fetch_nytimes()
        if source in ("guardian", "all") and GUARDIAN_KEY:
            raw += fetch_guardian()
    else:
        raw = SEED_ARTICLES

    articles = [normalise(a) for a in raw]

    if category != "all":
        articles = [a for a in articles if a["tc"] == category]

    return jsonify(articles)


@app.route("/api/articles/<int:article_id>/reaction/<reaction>", methods=["POST"])
def react(article_id, reaction):
    """
    Placeholder reaction endpoint.
    Wire to your database to persist likes/comments/shares.
    """
    return jsonify({"status": "ok", "article_id": article_id, "reaction": reaction})


if __name__ == "__main__":
    app.run(debug=True)
