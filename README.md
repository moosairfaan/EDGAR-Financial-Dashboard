# EDGAR Financial Dashboard

A full-stack ETL pipeline that ingests SEC EDGAR filings, parses XBRL financial data, and serves it through a REST API with an interactive React dashboard.

# Live URL
https://edgarfinancial.vercel.app

## What it does

- Pulls annual financial filings directly from the SEC EDGAR public API (no API key needed)
- Parses XBRL data to extract key metrics: revenue, net income, operating income, R&D expense, long-term debt, and EPS
- Stores structured financials in a SQLite database
- Serves data through a FastAPI REST API
- Visualizes trends in an interactive React dashboard with a financial screener

## Tech Stack

- **Backend:** Python, FastAPI, SQLAlchemy, SQLite
- **Data Source:** SEC EDGAR XBRL API (public, free)
- **Frontend:** React, Recharts

## Architecture
SEC EDGAR API → parser.py → database.py → api.py → React Dashboard

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /companies` | List all ingested companies |
| `GET /company/{cik}/financials` | Full annual financials for a company |
| `GET /screen?fiscal_year=2024&min_revenue=100000000000` | Screen companies by financial metrics |

## Running Locally

### Backend

```bash
# Install dependencies
pip install fastapi uvicorn sqlalchemy httpx

# Ingest data from SEC EDGAR
python ingest.py

# Start the API
uvicorn api:app --reload
```

API runs at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

### Frontend

```bash
cd dashboard
npm install
npm start
```

Dashboard runs at `http://localhost:3000`

## Key Engineering Decisions

**Why XBRL over scraping?**
SEC EDGAR exposes structured XBRL data via a public REST API — no scraping, no legal gray areas, no brittle HTML parsing. The data is the same source financial terminals use.

**Why filter for `fp == "FY"` and `form == "10-K"`?**
Each metric appears dozens of times across quarterly and annual filings. Filtering to annual 10-K filings with `fp == "FY"` ensures one clean data point per fiscal year per company.

**Why `INSERT OR IGNORE` with a `UNIQUE` constraint?**
Makes ingestion idempotent — re-running the pipeline never corrupts existing data.

**Why fallback XBRL keys?**
Companies don't all use the same XBRL tags for the same metric. The parser tries multiple keys per metric to maximize coverage across companies.

## Companies Supported

Apple, Microsoft, Alphabet, Meta, Netflix — easily extensible by adding CIKs to `ingest.py`
