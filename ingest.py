from parser import parse_company
from database import init_db, insert_company, insert_financials

# Companies to ingest: (name, CIK)
COMPANIES = [
    ("Apple",     "320193"),
    ("Microsoft", "789019"),
    ("Google",    "1652044"),
    ("Meta",      "1326801"),
    ("Netflix",   "1065280"),
]

def ingest(cik: str, name: str):
    print(f"Ingesting {name}...")
    data = parse_company(cik)

    company_id = insert_company(cik, data["company"])

    financials = data["financials"]

    # Get all fiscal years across all metrics
    all_years = set()
    for values in financials.values():
        all_years.update(values.keys())

    for year in sorted(all_years):
        metrics = {
            metric: values.get(year)
            for metric, values in financials.items()
        }
        insert_financials(company_id, year, metrics)
        print(f"  {year}: revenue={metrics.get('revenue'):,}" if metrics.get('revenue') else f"  {year}: (partial data)")

    print(f"Done — {len(all_years)} years stored for {name}\n")

if __name__ == "__main__":
    init_db()
    for name, cik in COMPANIES:
        ingest(cik, name)
    print("All companies ingested.")