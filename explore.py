import httpx
import json

headers = {"User-Agent": "moosairfaan03@egmail.com"}  # SEC requires this

url = "https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json"
r = httpx.get(url, headers=headers)
data = r.json()

# What keys exist at the top level?
print(data.keys())

# What financial concepts are available?
facts = data["facts"]["us-gaap"]
print(list(facts.keys())[:20])  # first 20 metrics

revenue = facts.get("RevenueFromContractWithCustomerExcludingAssessedTax")
if revenue is None:
    revenue = facts.get("Revenues")  # older tag some filers use
print(json.dumps(revenue, indent=2))