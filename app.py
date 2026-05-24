from fastapi import FastAPI, HTTPException
from sqlalchemy import text
from database import engine, init_db

app = FastAPI(title="EDGAR Financial API")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()
    # Ingest data if database is empty
    from sqlalchemy import text
    with engine.connect() as conn:
        count = conn.execute(text("SELECT COUNT(*) FROM companies")).scalar()
    if count == 0:
        print("Empty database — ingesting from EDGAR...")
        from ingest import ingest, COMPANIES
        for name, cik in COMPANIES:
            ingest(cik, name)
        print("Ingestion complete.")

@app.get("/companies")
def list_companies():
    """List all ingested companies."""
    with engine.connect() as conn:
        rows = conn.execute(text(
            "SELECT cik, name FROM companies ORDER BY name"
        )).fetchall()
    return [{"cik": r[0], "name": r[1]} for r in rows]

@app.get("/company/{cik}/financials")
def get_financials(cik: str):
    """Get all annual financials for a company by CIK."""
    with engine.connect() as conn:
        company = conn.execute(text(
            "SELECT id, name FROM companies WHERE cik = :cik"
        ), {"cik": cik}).fetchone()

        if not company:
            raise HTTPException(status_code=404, detail="Company not found")

        rows = conn.execute(text("""
            SELECT fiscal_year, revenue, net_income, operating_income,
                   rd_expense, long_term_debt, eps
            FROM financials
            WHERE company_id = :id
            ORDER BY fiscal_year
        """), {"id": company[0]}).fetchall()

    return {
        "company": company[1],
        "cik": cik,
        "financials": [
            {
                "fiscal_year":      r[0],
                "revenue":          r[1],
                "net_income":       r[2],
                "operating_income": r[3],
                "rd_expense":       r[4],
                "long_term_debt":   r[5],
                "eps":              r[6],
            }
            for r in rows
        ]
    }

@app.get("/screen")
def screen(
    min_revenue: int = None,
    min_net_income: int = None,
    fiscal_year: int = 2024
):
    """Screen companies by financial metrics for a given year."""
    query = """
        SELECT c.name, c.cik, f.revenue, f.net_income, f.eps
        FROM financials f
        JOIN companies c ON c.id = f.company_id
        WHERE f.fiscal_year = :year
    """
    params = {"year": fiscal_year}

    if min_revenue:
        query += " AND f.revenue >= :min_revenue"
        params["min_revenue"] = min_revenue

    if min_net_income:
        query += " AND f.net_income >= :min_net_income"
        params["min_net_income"] = min_net_income

    query += " ORDER BY f.revenue DESC"

    with engine.connect() as conn:
        rows = conn.execute(text(query), params).fetchall()

    return [
        {
            "company":    r[0],
            "cik":        r[1],
            "revenue":    r[2],
            "net_income": r[3],
            "eps":        r[4],
        }
        for r in rows
    ]