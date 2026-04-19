const CURRENCY_SYMBOLS = {
  USD: "$", CAD: "C$", EUR: "€", GBP: "£",
  AUD: "A$", INR: "₹", JPY: "¥", CHF: "Fr",
};

export default function StockCard({ symbol, data, currency, fxRates = { USD: 1.0 }, onRemove }) {
  if (!data) {
    return (
      <div className="stock-card">
        <div className="card-top">
          <span className="card-symbol">{symbol}</span>
          <button className="card-remove" onClick={onRemove}>✕</button>
        </div>
        <div className="card-loading">
          <div className="loading-spinner small" />
          <span>Fetching data...</span>
        </div>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="stock-card">
        <div className="card-top">
          <span className="card-symbol">{symbol}</span>
          <button className="card-remove" onClick={onRemove}>✕</button>
        </div>
        <p className="card-error">Error loading data</p>
      </div>
    );
  }

  const dayPositive = (data.change_day || 0) >= 0;
  const weekPositive = (data.change_week || 0) >= 0;

  const rate = fxRates[currency] ?? 1.0;
  const sym = CURRENCY_SYMBOLS[currency] ?? "$";

  function convert(usdVal) {
    return usdVal == null ? null : usdVal * rate;
  }

  function formatPrice(val) {
    if (val == null) return "—";
    return val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatChange(val, pct) {
    if (val == null || pct == null) return "—";
    const sign = val >= 0 ? "+" : "";
    return `${sign}${sym}${formatPrice(Math.abs(convert(val)))} (${sign}${pct.toFixed(2)}%)`;
  }

  function consensusClass(c) {
    const cl = (c || "").toLowerCase();
    if (cl.includes("strong buy")) return "consensus-strong-buy";
    if (cl.includes("buy")) return "consensus-buy";
    if (cl.includes("hold")) return "consensus-hold";
    if (cl.includes("sell") || cl.includes("underperform")) return "consensus-sell";
    return "";
  }

  return (
    <div className="stock-card">
      {/* Top row: symbol + price */}
      <div className="card-top">
        <span className="card-symbol">{symbol}</span>
        <button className="card-remove" onClick={onRemove}>✕</button>
        <span className="card-price">{sym}{formatPrice(convert(data.price))}</span>
      </div>

      {/* Metrics row */}
      <div className="card-metrics">
        <div className="metric">
          <span className="metric-label">DAY</span>
          <span className={`metric-value ${dayPositive ? "positive" : "negative"}`}>
            {formatChange(data.change_day, data.change_day_pct)}
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">WEEK</span>
          <span className={`metric-value ${weekPositive ? "positive" : "negative"}`}>
            {formatChange(data.change_week, data.change_week_pct)}
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">CONSENSUS</span>
          <span className={`metric-value ${consensusClass(data.consensus)}`}>
            {data.consensus || "N/A"}
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">UPDATED</span>
          <span className="metric-value muted">
            {data.last_updated ? new Date(data.last_updated).toLocaleTimeString() : "—"}
          </span>
        </div>
      </div>

      {/* News */}
      <div className="card-section">
        <h4 className="section-label">LATEST NEWS</h4>
        {data.news && data.news.length > 0 ? (
          data.news.slice(0, 3).map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="news-link"
            >
              ▸ {item.source && <span className="news-source">[{item.source}]</span>}{" "}
              {item.title}
            </a>
          ))
        ) : (
          <span className="no-data">No recent news</span>
        )}
      </div>

      {/* Reddit buzz */}
      <div className="card-section">
        <h4 className="section-label">REDDIT BUZZ</h4>
        <p className="reddit-text">{data.reddit || "No Reddit data"}</p>
      </div>
    </div>
  );
}
