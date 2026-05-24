import httpx
import json

HEADERS = {"User-Agent": "moosairfaan03@gmail.com"}

REVENUE_KEYS = [
    "RevenueFromContractWithCustomerExcludingAssessedTax",
    "Revenues",
    "SalesRevenueNet",
]

USD_METRICS = {
    "NetIncomeLoss":                 "net_income",
    "OperatingIncomeLoss":           "operating_income",
    "ResearchAndDevelopmentExpense": "rd_expense",
    "LongTermDebtNoncurrent":        "long_term_debt",
}

SHARE_METRICS = {
    "EarningsPerShareBasic": "eps",
}

def fetch_company_facts(cik: str) -> dict:
    padded = cik.zfill(10)
    url = f"https://data.sec.gov/api/xbrl/companyfacts/CIK{padded}.json"
    r = httpx.get(url, headers=HEADERS)
    r.raise_for_status()
    return r.json()

def extract_annual(facts: dict, xbrl_key: str, unit: str = "USD") -> dict:
    """Extract one value per fiscal year from 10-K filings."""
    try:
        entries = facts["facts"]["us-gaap"][xbrl_key]["units"][unit]
    except KeyError:
        return {}

    seen = {}
    for entry in entries:
        if entry.get("form") == "10-K" and entry.get("fp") == "FY":
            fy = entry["fy"]
            if fy not in seen:
                seen[fy] = entry["val"]
    return seen

def extract_revenue(facts: dict) -> dict:
    """Try multiple keys for revenue, return first one that has data."""
    for key in REVENUE_KEYS:
        data = extract_annual(facts, key)
        if data:
            return data
    return {}

def parse_company(cik: str) -> dict:
    raw = fetch_company_facts(cik)
    name = raw["entityName"]
    result = {"company": name, "cik": cik, "financials": {}}

    result["financials"]["revenue"] = extract_revenue(raw)

    for xbrl_key, label in USD_METRICS.items():
        result["financials"][label] = extract_annual(raw, xbrl_key, "USD")

    for xbrl_key, label in SHARE_METRICS.items():
        result["financials"][label] = extract_annual(raw, xbrl_key, "USD/shares")

    return result

if __name__ == "__main__":
    for name, cik in [("Apple", "320193"), ("Microsoft", "789019"), ("Netflix", "1065280")]:
        data = parse_company(cik)
        print(f"\n=== {name} ===")
        for metric, values in data["financials"].items():
            if values:
                latest_year = max(values.keys())
                print(f"  {metric}: {values[latest_year]:,} ({latest_year})")