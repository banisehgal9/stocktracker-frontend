import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Discover from "./pages/Discover";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [watchlist, setWatchlist] = useState({ symbols: [], currency: "CAD" });

  // Listen for auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Fetch watchlist when logged in
  useEffect(() => {
    if (!session) return;
    fetchWatchlist();
  }, [session]);

  async function fetchWatchlist() {
    try {
      const res = await fetch(`${API}/api/watchlist`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWatchlist({ symbols: data.symbols || [], currency: data.currency || "CAD" });
      }
    } catch (err) {
      console.error("Failed to fetch watchlist:", err);
    }
  }

  async function addStock(symbol) {
    try {
      const res = await fetch(`${API}/api/watchlist/add/${symbol}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWatchlist((prev) => ({ ...prev, symbols: data.symbols }));
      }
    } catch (err) {
      console.error("Failed to add stock:", err);
    }
  }

  async function removeStock(symbol) {
    try {
      const res = await fetch(`${API}/api/watchlist/remove/${symbol}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWatchlist((prev) => ({ ...prev, symbols: data.symbols }));
      }
    } catch (err) {
      console.error("Failed to remove stock:", err);
    }
  }

  async function updateCurrency(currency) {
    setWatchlist((prev) => ({ ...prev, currency }));
    try {
      await fetch(`${API}/api/watchlist`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symbols: watchlist.symbols, currency }),
      });
    } catch (err) {
      console.error("Failed to update currency:", err);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setWatchlist({ symbols: [], currency: "CAD" });
  }

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Loading StockTracker...</p>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div className="app">
      {/* Top nav */}
      <nav className="topnav">
        <div className="topnav-left">
          <h1 className="app-title">StockTracker</h1>
        </div>
        <div className="topnav-right">
          <div className="user-menu">
            <button className="user-btn" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
      </nav>

      {/* Tab bar */}
      <div className="tab-bar">
        <button
          className={`tab ${page === "dashboard" ? "tab-active" : ""}`}
          onClick={() => setPage("dashboard")}
        >
          My Stocks
        </button>
        <button
          className={`tab ${page === "discover" ? "tab-active" : ""}`}
          onClick={() => setPage("discover")}
        >
          Discover
        </button>
      </div>

      {/* Page content */}
      {page === "dashboard" ? (
        <Dashboard
          session={session}
          watchlist={watchlist}
          addStock={addStock}
          removeStock={removeStock}
          updateCurrency={updateCurrency}
        />
      ) : (
        <Discover session={session} watchlist={watchlist} addStock={addStock} />
      )}

      {/* Footer */}
      <footer className="app-footer">
        Data: Yahoo Finance · Google News · Reddit &nbsp;|&nbsp; Prices refresh
        every 15s
      </footer>
    </div>
  );
}
