from sqlalchemy import create_engine, text

engine = create_engine("sqlite:///edgar.db", echo=False)

def init_db():
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS companies (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                cik       TEXT UNIQUE NOT NULL,
                name      TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS financials (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id       INTEGER NOT NULL REFERENCES companies(id),
                fiscal_year      INTEGER NOT NULL,
                revenue          INTEGER,
                net_income       INTEGER,
                operating_income INTEGER,
                rd_expense       INTEGER,
                long_term_debt   INTEGER,
                eps              REAL,
                created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(company_id, fiscal_year)
            )
        """))
        conn.commit()

def insert_company(cik: str, name: str) -> int:
    """Insert company if not exists, return its id."""
    with engine.connect() as conn:
        conn.execute(text("""
            INSERT OR IGNORE INTO companies (cik, name) VALUES (:cik, :name)
        """), {"cik": cik, "name": name})
        conn.commit()
        row = conn.execute(text(
            "SELECT id FROM companies WHERE cik = :cik"
        ), {"cik": cik}).fetchone()
        return row[0]

def insert_financials(company_id: int, fiscal_year: int, metrics: dict):
    """Insert one year of financials, skip if already exists."""
    with engine.connect() as conn:
        conn.execute(text("""
            INSERT OR IGNORE INTO financials
                (company_id, fiscal_year, revenue, net_income,
                 operating_income, rd_expense, long_term_debt, eps)
            VALUES
                (:company_id, :fiscal_year, :revenue, :net_income,
                 :operating_income, :rd_expense, :long_term_debt, :eps)
        """), {
            "company_id":       company_id,
            "fiscal_year":      fiscal_year,
            "revenue":          metrics.get("revenue"),
            "net_income":       metrics.get("net_income"),
            "operating_income": metrics.get("operating_income"),
            "rd_expense":       metrics.get("rd_expense"),
            "long_term_debt":   metrics.get("long_term_debt"),
            "eps":              metrics.get("eps"),
        })
        conn.commit()

if __name__ == "__main__":
    init_db()
    print("Database initialized — edgar.db created.")