import { useState, useEffect } from "react";
import DiscoverCard from "../components/DiscoverCard";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "sector", label: "Similar to yours" },
  { id: "trending", label: "Trending on Reddit" },
  { id: "analyst", label: "Analyst upgrades" },
  { id: "momentum", label: "High momentum" },
];

export default function Discover({ session, watchlist, addStock }) {
  const [recommendations, setRecommendations] = useState([]);
  const [breakdown, setBreakdown] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [addedSymbols, setAddedSymbols] = useState(new Set());

  useEffect(() => {
    fetchDiscover();
  }, []);

  async function fetchDiscover() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/discover`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
        setBreakdown(data.portfolio_breakdown || {});
      }
    } catch (err) {
      console.error("Failed to fetch discover:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleAddToWatchlist(symbol) {
    addStock(symbol);
    setAddedSymbols((prev) => new Set([...prev, symbol]));
  }

  // Filter recommendations
  const filtered =
    activeFilter === "all"
      ? recommendations
      : recommendations.filter((r) => r.reason_type === activeFilter);

  // Build breakdown string
  const breakdownStr = Object.entries(breakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([sector, pct]) => `${pct}% ${sector}`)
    .join(" · ");

  return (
    <div className="discover">
      {/* Personalization banner */}
      {breakdownStr && (
        <div className="discover-banner">
          <span className="banner-sparkle">✦</span>
          Based on your portfolio: {breakdownStr}
        </div>
      )}

      {/* Filter chips */}
      <div className="filter-chips">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`chip ${activeFilter === f.id ? "chip-active" : ""}`}
            onClick={() => setActiveFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="discover-feed">
        {loading ? (
          <div className="discover-loading">
            <div className="loading-spinner" />
            <p>Finding stocks for you...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>No recommendations for this filter. Try "All" instead.</p>
          </div>
        ) : (
          filtered.map((rec) => (
            <DiscoverCard
              key={rec.symbol}
              data={rec}
              isAdded={addedSymbols.has(rec.symbol) || watchlist.symbols.includes(rec.symbol)}
              onAdd={() => handleAddToWatchlist(rec.symbol)}
            />
          ))
        )}
      </div>
    </div>
  );
}
