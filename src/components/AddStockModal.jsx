import { useState, useRef, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function AddStockModal({ onAdd, onClose, existingSymbols }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [status, setStatus] = useState("Start typing to search...");
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleType(value) {
    setQuery(value);

    // Debounce search by 300ms
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!value.trim()) {
      setResults([]);
      setStatus("Start typing to search...");
      return;
    }

    timerRef.current = setTimeout(() => {
      doSearch(value.trim());
    }, 300);
  }

  async function doSearch(q) {
    setSearching(true);
    setStatus("Searching...");
    try {
      const res = await fetch(`${API}/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        if (data.length === 0) {
          setStatus("No results — try the exact ticker (e.g. GOOGL)");
        } else {
          setStatus(`${data.length} result(s) — click to add`);
        }
      }
    } catch (err) {
      setStatus("Search failed. Try again.");
    } finally {
      setSearching(false);
    }
  }

  function handleSelect(symbol) {
    if (existingSymbols.includes(symbol)) {
      setStatus(`${symbol} is already in your watchlist`);
      return;
    }
    onAdd(symbol);
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") onClose();
    if (e.key === "Enter" && query.trim() && results.length === 0) {
      // Allow adding raw ticker if no search results
      handleSelect(query.trim().toUpperCase());
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Add Stock</h3>

        <div className="modal-search">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleType(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by name or ticker..."
            className="modal-input"
          />
        </div>

        <p className="modal-status">{status}</p>

        <div className="modal-results">
          {results.map((r, i) => (
            <button
              key={i}
              className="result-row"
              onClick={() => handleSelect(r.symbol)}
            >
              <span className="result-symbol">{r.symbol}</span>
              <span className="result-name">{r.name}</span>
              {r.exchange && <span className="result-exchange">[{r.exchange}]</span>}
            </button>
          ))}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
