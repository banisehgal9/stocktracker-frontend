export default function DiscoverCard({ data, isAdded, onAdd }) {
  const dayPositive = (data.change_day || 0) >= 0;

  function formatPrice(val) {
    if (val == null) return "—";
    return val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Build sparkline SVG from 30-day history
  function renderSparkline() {
    const points = data.history_30d || [];
    if (points.length < 2) return null;

    const closes = points.map((p) => p.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const range = max - min || 1;

    const width = 600;
    const height = 60;
    const padding = 2;

    const coords = closes.map((c, i) => {
      const x = (i / (closes.length - 1)) * width;
      const y = height - padding - ((c - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    });

    const trending = closes[closes.length - 1] >= closes[0];
    const color = trending ? "#00ff88" : "#ff4466";

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="sparkline">
        <polyline
          points={coords.join(" ")}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Determine reason tag style
  function reasonStyle(type) {
    switch (type) {
      case "sector": return "reason-sector";
      case "trending": return "reason-trending";
      case "momentum": return "reason-momentum";
      case "analyst": return "reason-analyst";
      default: return "";
    }
  }

  return (
    <div className="discover-card">
      {/* Reason tag */}
      <div className="discover-card-top">
        <span className={`reason-tag ${reasonStyle(data.reason_type)}`}>
          {data.reason}
        </span>
      </div>

      {/* Ticker + price */}
      <div className="discover-card-main">
        <div className="discover-left">
          <span className="discover-symbol">{data.symbol}</span>
        </div>
        <div className="discover-right">
          <span className="discover-price">${formatPrice(data.price)}</span>
          <span className={`discover-change ${dayPositive ? "positive" : "negative"}`}>
            {dayPositive ? "+" : ""}
            {data.change_day_pct != null ? `${data.change_day_pct.toFixed(2)}%` : "—"}
          </span>
        </div>
      </div>

      {/* Sparkline */}
      {renderSparkline()}

      {/* AI insight line */}
      {data.reddit && (
        <p className="discover-insight">{data.reddit}</p>
      )}

      {/* Action buttons */}
      <div className="discover-actions">
        <button
          className={`btn-watchlist ${isAdded ? "btn-added" : ""}`}
          onClick={onAdd}
          disabled={isAdded}
        >
          {isAdded ? "Added ✓" : "+ Add to watchlist"}
        </button>
      </div>
    </div>
  );
}
