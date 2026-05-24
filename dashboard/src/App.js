import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const API = "https://edgar-financial-dashboard-production.up.railway.app";

const fmt = (val) => {
  if (!val) return "N/A";
  if (val >= 1e12) return `$${(val / 1e12).toFixed(1)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  return `$${val}`;
};

// ── Screener ──────────────────────────────────────────────
function Screener() {
  const [year, setYear] = useState(2024);
  const [minRev, setMinRev] = useState("");
  const [results, setResults] = useState([]);

  const run = async () => {
    let url = `${API}/screen?fiscal_year=${year}`;
    if (minRev) url += `&min_revenue=${Number(minRev) * 1e9}`;
    const res = await fetch(url);
    setResults(await res.json());
  };

  useEffect(() => { run(); }, []);

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Stock Screener</h2>
      <div style={styles.row}>
        <input
          style={styles.input}
          type="number"
          placeholder="Min revenue (billions)"
          value={minRev}
          onChange={e => setMinRev(e.target.value)}
        />
        <input
          style={styles.input}
          type="number"
          placeholder="Fiscal year"
          value={year}
          onChange={e => setYear(e.target.value)}
        />
        <button style={styles.button} onClick={run}>Screen</button>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            {["Company", "Revenue", "Net Income", "EPS"].map(h => (
              <th key={h} style={styles.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map(r => (
            <tr key={r.cik}>
              <td style={styles.td}>{r.company}</td>
              <td style={styles.td}>{fmt(r.revenue)}</td>
              <td style={styles.td}>{fmt(r.net_income)}</td>
              <td style={styles.td}>{r.eps ?? "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Company Chart ─────────────────────────────────────────
function CompanyChart({ cik, name }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch(`${API}/company/${cik}/financials`)
      .then(r => r.json())
      .then(d => {
        const rows = d.financials
          .filter(f => f.revenue)
          .map(f => ({
            year: f.fiscal_year,
            Revenue: +(f.revenue / 1e9).toFixed(1),
            "Net Income": +(f.net_income / 1e9).toFixed(1),
            "Operating Inc.": +(f.operating_income / 1e9).toFixed(1),
          }));
        setData(rows);
      });
  }, [cik]);

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>{name} — Annual Financials ($ Billions)</h2>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip formatter={v => `$${v}B`} />
          <Legend />
          <Line type="monotone" dataKey="Revenue" stroke="#6366f1" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Net Income" stroke="#22c55e" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Operating Inc." stroke="#f59e0b" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────
export default function App() {
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(`${API}/companies`)
      .then(r => r.json())
      .then(setCompanies);
  }, []);

  return (
    <div style={styles.root}>
      <h1 style={styles.title}>EDGAR Financial Dashboard</h1>

      {/* Company selector */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Companies</h2>
        <div style={styles.row}>
          {companies.map(c => (
            <button
              key={c.cik}
              style={{
                ...styles.button,
                background: selected?.cik === c.cik ? "#6366f1" : "#1e293b"
              }}
              onClick={() => setSelected(c)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chart for selected company */}
      {selected && <CompanyChart cik={selected.cik} name={selected.name} />}

      {/* Screener */}
      <Screener />
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────
const styles = {
  root: { maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "sans-serif", background: "#0f172a", minHeight: "100vh", color: "#f1f5f9" },
  title: { fontSize: 28, fontWeight: 700, marginBottom: 24, color: "#6366f1" },
  card: { background: "#1e293b", borderRadius: 12, padding: 24, marginBottom: 24 },
  cardTitle: { fontSize: 18, fontWeight: 600, marginBottom: 16, color: "#f1f5f9" },
  row: { display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 },
  button: { padding: "8px 16px", borderRadius: 8, border: "none", background: "#1e293b", color: "#f1f5f9", cursor: "pointer", fontSize: 14 },
  input: { padding: "8px 12px", borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9", fontSize: 14 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #334155", color: "#94a3b8", fontSize: 13 },
  td: { padding: "10px 12px", borderBottom: "1px solid #1e293b", fontSize: 14 },
};