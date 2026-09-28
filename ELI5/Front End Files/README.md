# ELI5 — News App

Mobile-first swipe news feed with ELI5-style summaries, powered by Flask.

---

## Setup

```bash
pip install -r requirements.txt
```

Create a `.env` file in the project root (optional — app runs on seed data without it):

```
NEWSAPI_KEY=your_key_here
NYTIMES_KEY=your_key_here
GUARDIAN_KEY=your_key_here
ANTHROPIC_KEY=your_key_here
```

Then run:

```bash
python app.py
```

Open `http://localhost:5000` in your browser.

---

## Project Structure

```
eli5/
├── app.py                  # Flask routes + data fetching + article normaliser
├── requirements.txt
├── .env                    # API keys (not committed)
├── templates/
│   └── index.html          # Single-page app shell
└── static/
    ├── css/style.css       # All styles
    └── js/app.js           # Swipe logic, card rendering, article view
```

---

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Serves the app |
| `/api/articles?category=all` | GET | Returns normalised articles |
| `/api/articles/<id>/reaction/<type>` | POST | Records a like/comment/share |

### Category values
`all` · `tech` · `business` · `ent` · `world` · `us` · `culture`

---

## Article Data Shape

The front-end expects articles in this shape from `/api/articles`:

```json
{
  "tc":        "tech",
  "tl":        "Tech",
  "time":      "2 min ago",
  "hk":        "tech",
  "imageUrl":  "https://...",
  "hl":        "Headline here",
  "sm":        "Short ELI5 one-liner for the card",
  "ld":        "Opening sentence for article view",
  "bd":        "<p>Full ELI5 body paragraphs</p>",
  "pq":        "Memorable pull quote",
  "src":       "The Guardian",
  "url":       "https://...",
  "stats": [
    { "l": "Label", "v": "Value", "d": "Delta", "c": "up|down|" }
  ],
  "chartTitle": "Chart heading",
  "chartBars": [
    { "l": "Bar label", "p": 75, "col": "#5b5ef4" }
  ]
}
```

The `eli5_*` fields (`sm`, `ld`, `bd`, `pq`, `stats`, `chartBars`) are generated
by your RAG + Claude Haiku pipeline in `generate_eli5()` inside `app.py`.

---

## Wiring Up Your Pipeline

In `app.py`, replace the `generate_eli5()` stub with your actual pipeline call:

```python
def generate_eli5(article: dict) -> dict:
    # Call your RAG + Claude Haiku pipeline here
    # Return the eli5_* fields as a dict
    ...
```

---

## News API Keys

| Source | Sign up |
|---|---|
| NewsAPI | https://newsapi.org |
| NY Times | https://developer.nytimes.com |
| The Guardian | https://open-platform.theguardian.com |
| Anthropic (Claude Haiku) | https://console.anthropic.com |
