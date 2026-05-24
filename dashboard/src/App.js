import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const API = "https://edgar-financial-dashboard-production.up.railway.app";

const COLORS = {
  revenue: "#6366f1",
  net: "#22c55e",
  operating: "#f59e0b",
};

const COMPANY_COLORS = [
  "#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6"
];

const fmt = (val) => {
  if (!val) return "N/A";
  if (val >= 1e12) return `$${(val / 1e12).toFixed(1)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  return `$${val}`;
};

const StatCard = ({ label, value, color }) => (
  <div style={{ background: "#1e293b", borderRadius: 12, padding: "16px 20px", flex: 1, borderTop: `3px solid ${color}` }}>
    <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
  </div>
);

function CompanyChart({ cik, name, color }) {
  const [data, setData] = useState([]);
  const [latest, setLatest] = useState(null);

  useEffect(() => {
    fetch(`${API}/company/${cik}/financials`)
      .then(r => r.json())
      .then(d => {
        const rows = d.financials
          .filter(f => f.revenue)
          .map(f => ({
            year: f.fiscal_year,
            Revenue: +(f.revenue / 1e9).toFixed(1),
            "Net Income": f.net_income ? +(f.net_income / 1e9).toFixed(1) : null,
            "Operating Inc.": f.operating_income ? +(f.operating_income / 1e9).toFixed(1) : null,
          }));
        setData(rows);
        const last = d.financials.filter(f => f.revenue).at(-1);
        setLatest(last);
      });
  }, [cik]);

  return (
    <div style={{ background: "#1e293b", borderRadius: 16, padding: 24, marginBottom: 24, borderLeft: `4px solid ${color}` }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color, marginBottom: 20 }}>{name}</h2>

      {latest && (
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <StatCard label="Revenue" value={fmt(latest.revenue)} color={COLORS.revenue} />
          <StatCard label="Net Income" value={fmt(latest.net_income)} color={COLORS.net} />
          <StatCard label="Operating Inc." value={fmt(latest.operating_income)} color={COLORS.operating} />
          <StatCard label="EPS" value={latest.eps ? `$${latest.eps}` : "N/A"} color="#ec4899" />
        </div>
      )}

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <XAxis dataKey="year" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} unit="B" />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
            labelStyle={{ color: "#f1f5f9" }}
            formatter={v => [`$${v}B`]}
          />
          <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 13 }} />
          <Line type="monotone" dataKey="Revenue" stroke={COLORS.revenue} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="Net Income" stroke={COLORS.net} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="Operating Inc." stroke={COLORS.operating} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, []);

  return (
    <div style={{ background: "#1e293b", borderRadius: 16, padding: 24, marginBottom: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", marginBottom: 20 }}>📊 Stock Screener</h2>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          style={inputStyle}
          type="number"
          placeholder="Min revenue (billions)"
          value={minRev}
          onChange={e => setMinRev(e.target.value)}
        />
        <input
          style={inputStyle}
          type="number"
          placeholder="Fiscal year"
          value={year}
          onChange={e => setYear(e.target.value)}
        />
        <button style={btnStyle} onClick={run}>Screen</button>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["Company", "Revenue", "Net Income", "EPS"].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #334155", color: "#6366f1", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={r.cik} style={{ background: i % 2 === 0 ? "transparent" : "#0f172a22" }}>
              <td style={tdStyle}><span style={{ color: COMPANY_COLORS[i % COMPANY_COLORS.length], fontWeight: 600 }}>{r.company}</span></td>
              <td style={tdStyle}>{fmt(r.revenue)}</td>
              <td style={tdStyle}>{fmt(r.net_income)}</td>
              <td style={tdStyle}>{r.eps ? `$${r.eps}` : "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(`${API}/companies`)
      .then(r => r.json())
      .then(data => {
        setCompanies(data);
        setSelected(data[0]);
      });
  }, []);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 24, fontFamily: "'Inter', sans-serif", background: "#0f172a", minHeight: "100vh", color: "#f1f5f9" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, background: "linear-gradient(90deg, #6366f1, #22c55e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 4 }}>
          EDGAR Financial Dashboard
        </h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>Real SEC filing data — powered by EDGAR XBRL API</p>
      </div>

      {/* Company tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
        {companies.map((c, i) => (
          <button
            key={c.cik}
            onClick={() => setSelected(c)}
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              border: `2px solid ${selected?.cik === c.cik ? COMPANY_COLORS[i % COMPANY_COLORS.length] : "#1e293b"}`,
              background: selected?.cik === c.cik ? COMPANY_COLORS[i % COMPANY_COLORS.length] + "22" : "#1e293b",
              color: selected?.cik === c.cik ? COMPANY_COLORS[i % COMPANY_COLORS.length] : "#94a3b8",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              transition: "all 0.2s",
            }}
          >
            {c.name.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Selected company chart */}
      {selected && (
        <CompanyChart
          key={selected.cik}
          cik={selected.cik}
          name={selected.name}
          color={COMPANY_COLORS[companies.findIndex(c => c.cik === selected.cik) % COMPANY_COLORS.length]}
        />
      )}

      {/* Screener */}
      <Screener />

      <div style={{ textAlign: "center", color: "#334155", fontSize: 12, marginTop: 16 }}>
        Data sourced from SEC EDGAR public API · Built with FastAPI + React
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "10px 14px", borderRadius: 8, border: "1px solid #334155",
  background: "#0f172a", color: "#f1f5f9", fontSize: 14, outline: "none"
};

const btnStyle = {
  padding: "10px 20px", borderRadius: 8, border: "none",
  background: "#6366f1", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600
};

const tdStyle = {
  padding: "12px", borderBottom: "1px solid #1e293b", fontSize: 14, color: "#e2e8f0"
};