# EDGAR Financial Dashboard

A full-stack ETL pipeline that ingests SEC EDGAR filings, parses XBRL financial data, and serves it through a REST API with an interactive React dashboard.

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