import { useState, useEffect, useRef } from "react";
import StockCard from "../components/StockCard";
import AddStockModal from "../components/AddStockModal";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const CURRENCIES = [
  { code: "USD", symbol: "$",  flag: "🇺🇸" },
  { code: "CAD", symbol: "C$", flag: "🇨🇦" },
  { code: "EUR", symbol: "€",  flag: "🇪🇺" },
  { code: "GBP", symbol: "£",  flag: "🇬🇧" },
  { code: "AUD", symbol: "A$", flag: "🇦🇺" },
  { code: "INR", symbol: "₹",  flag: "🇮🇳" },
  { code: "JPY", symbol: "¥",  flag: "🇯🇵" },
  { code: "CHF", symbol: "Fr", flag: "🇨🇭" },
];

export default function Dashboard({ session, watchlist, addStock, removeStock, updateCurrency }) {
  const [stockData, setStockData] = useState({});
  const [lastRefresh, setLastRefresh] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fxRates, setFxRates] = useState({ USD: 1.0 });
  const intervalRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/api/fx-rates`)
      .then((r) => r.json())
      .then((rates) => setFxRates(rates))
      .catch(() => {});
  }, []);

  // Fetch data for all stocks
  async function fetchAllStocks() {
    setRefreshing(true);
    const promises = watchlist.symbols.map(async (symbol) => {
      try {
        const res = await fetch(`${API}/api/stock/${symbol}`);
        if (res.ok) {
          const data = await res.json();
          return [symbol, data];
        }
      } catch (err) {
        console.error(`Failed to fetch ${symbol}:`, err);
      }
      return null;
    });

    const results = await Promise.all(promises);
    const newData = {};
    results.forEach((r) => {
      if (r) newData[r[0]] = r[1];
    });

    setStockData((prev) => ({ ...prev, ...newData }));
    setLastRefresh(new Date().toLocaleTimeString());
    setRefreshing(false);
  }

  // Fetch on mount and when watchlist changes
  useEffect(() => {
    if (watchlist.symbols.length > 0) {
      fetchAllStocks();
    }
  }, [watchlist.symbols.join(",")]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (watchlist.symbols.length > 0) {
        fetchAllStocks();
      }
    }, 15000);

    return () => clearInterval(intervalRef.current);
  }, [watchlist.symbols.join(",")]);

  function handleManualRefresh() {
    fetchAllStocks();
  }

  function handleAddStock(symbol) {
    addStock(symbol);
    setShowAddModal(false);
  }

  function handleRemoveStock(symbol) {
    if (window.confirm(`Remove ${symbol} from your watchlist?`)) {
      removeStock(symbol);
      setStockData((prev) => {
        const next = { ...prev };
        delete next[symbol];
        return next;
      });
    }
  }

  const currentCurrency = CURRENCIES.find((c) => c.code === watchlist.currency) || CURRENCIES[0];

  return (
    <div className="dashboard">
      {/* Controls bar */}
      <div className="controls-bar">
        <div className="controls-left">
          <button className="btn-add" onClick={() => setShowAddModal(true)}>
            + Add Stock
          </button>
          <button
            className="btn-refresh"
            onClick={handleManualRefresh}
            disabled={refreshing}
          >
            {refreshing ? "⟳ Refreshing..." : "⟳ Refresh"}
          </button>
          {lastRefresh && (
            <span className="last-refresh">Last refresh: {lastRefresh}</span>
          )}
        </div>
        <div className="controls-right">
          <label className="currency-label">Currency:</label>
          <select
            className="currency-select"
            value={watchlist.currency}
            onChange={(e) => updateCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} {c.flag} {c.symbol}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stock cards */}
      <div className="cards-container">
        {watchlist.symbols.length === 0 ? (
          <div className="empty-state">
            <p>No stocks in your watchlist yet.</p>
            <button className="btn-add" onClick={() => setShowAddModal(true)}>
              + Add your first stock
            </button>
          </div>
        ) : (
          watchlist.symbols.map((symbol) => (
            <StockCard
              key={symbol}
              symbol={symbol}
              data={stockData[symbol]}
              currency={watchlist.currency}
              fxRates={fxRates}
              onRemove={() => handleRemoveStock(symbol)}
            />
          ))
        )}
      </div>

      {/* Add stock modal */}
      {showAddModal && (
        <AddStockModal
          onAdd={handleAddStock}
          onClose={() => setShowAddModal(false)}
          existingSymbols={watchlist.symbols}
        />
      )}
    </div>
  );
}
