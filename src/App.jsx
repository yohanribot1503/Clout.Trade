import { useEffect, useMemo, useState } from "react";

const INITIAL_CASH = 15000;
const UPDATE_MS = 1600;

const STARTING_COINS = [
  {
    id: "mrbeast",
    symbol: "BEAST",
    name: "MrBeast",
    price: 52,
    volatility: 0.07,
    bias: 0.004,
    color: "#7bb2ff",
    metrics: { reach: 99, engagement: 93, growth: 88, sentiment: 76, activity: 92 },
  },
  {
    id: "ishowspeed",
    symbol: "SPEED",
    name: "IShowSpeed",
    price: 44,
    volatility: 0.11,
    bias: 0.003,
    color: "#ffd167",
    metrics: { reach: 92, engagement: 91, growth: 90, sentiment: 66, activity: 95 },
  },
  {
    id: "kaicenat",
    symbol: "KAI",
    name: "Kai Cenat",
    price: 38,
    volatility: 0.09,
    bias: 0.004,
    color: "#83f0c1",
    metrics: { reach: 90, engagement: 94, growth: 89, sentiment: 80, activity: 94 },
  },
  {
    id: "cristianoronaldo",
    symbol: "CR7",
    name: "Cristiano Ronaldo",
    price: 28,
    volatility: 0.06,
    bias: 0.002,
    color: "#f694ff",
    metrics: { reach: 98, engagement: 85, growth: 74, sentiment: 84, activity: 86 },
  },
  {
    id: "nickiminaj",
    symbol: "NICKI",
    name: "Nicki Minaj",
    price: 26,
    volatility: 0.1,
    bias: 0.002,
    color: "#8ce8ff",
    metrics: { reach: 86, engagement: 88, growth: 71, sentiment: 79, activity: 78 },
  },
  {
    id: "kyliejenner",
    symbol: "KYLIE",
    name: "Kylie Jenner",
    price: 14,
    volatility: 0.08,
    bias: 0.001,
    color: "#ff9f9f",
    metrics: { reach: 93, engagement: 82, growth: 70, sentiment: 77, activity: 68 },
  },
  {
    id: "adinross",
    symbol: "ADIN",
    name: "Adin Ross",
    price: 9,
    volatility: 0.13,
    bias: 0.002,
    color: "#f8b36d",
    metrics: { reach: 78, engagement: 87, growth: 84, sentiment: 61, activity: 93 },
  },
  {
    id: "charlidamelio",
    symbol: "CHARLI",
    name: "Charli D'Amelio",
    price: 8,
    volatility: 0.12,
    bias: 0.003,
    color: "#b2c6ff",
    metrics: { reach: 85, engagement: 80, growth: 72, sentiment: 82, activity: 74 },
  },
];

const DRAMA_EVENTS = [
  { type: "cancellation", text: "Faces a cancellation wave across social media.", shock: -0.4 },
  { type: "viral moment", text: "Has a viral breakout moment dominating the timeline.", shock: 0.3 },
  { type: "platform ban", text: "Gets hit with a major platform ban notice.", shock: -0.6 },
  { type: "brand deal", text: "Signs a massive global brand deal.", shock: 0.15 },
];

const SCORE_WEIGHTS = {
  reach: 0.25,
  engagement: 0.3,
  growth: 0.2,
  sentiment: 0.15,
  activity: 0.1,
};

const USERS_KEY = "clouttrade_users_v1";
const SESSION_KEY = "clouttrade_session_v1";
const PORTFOLIO_PREFIX = "clouttrade_portfolio_v1_";
const GLOBAL_EVENT_KEY = "clouttrade_global_admin_event_v1";
const ADMIN_EMAILS = new Set(["yohanribot1503@gmail.com", "diegonanton@gmail.com"]);

const randomBetween = (min, max) => Math.random() * (max - min) + min;

const formatUsd = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function getPortfolioKey(email) {
  return `${PORTFOLIO_PREFIX}${email}`;
}

function isAdminEmail(email) {
  return ADMIN_EMAILS.has((email || "").toLowerCase());
}

function computeCloutScore(metrics) {
  const weighted =
    metrics.reach * SCORE_WEIGHTS.reach +
    metrics.engagement * SCORE_WEIGHTS.engagement +
    metrics.growth * SCORE_WEIGHTS.growth +
    metrics.sentiment * SCORE_WEIGHTS.sentiment +
    metrics.activity * SCORE_WEIGHTS.activity;
  return Number(weighted.toFixed(1));
}

function evolveCoin(coin, impulse = 0) {
  const noise = randomBetween(-coin.volatility, coin.volatility);
  const nextChange = coin.bias + noise + impulse;
  const nextPrice = Math.max(0.35, coin.price * (1 + nextChange));
  const history = [...coin.history.slice(-23), nextPrice];
  return {
    ...coin,
    price: Number(nextPrice.toFixed(2)),
    change24h: Number((((nextPrice - history[0]) / history[0]) * 100).toFixed(2)),
    history,
  };
}

function makeInitialState() {
  return STARTING_COINS.map((coin) => {
    const baseHistory = Array.from({ length: 24 }, () => coin.price * randomBetween(0.9, 1.08)).map((x) =>
      Number(x.toFixed(2))
    );
    const history = [...baseHistory.slice(0, -1), coin.price];
    return {
      ...coin,
      history,
      change24h: Number((((coin.price - history[0]) / history[0]) * 100).toFixed(2)),
      cloutScore: computeCloutScore(coin.metrics),
    };
  });
}

function Sparkline({ points, up }) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 120;
  const height = 34;
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * height;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`}>
      <path
        d={path}
        fill="none"
        stroke={up ? "#2cd495" : "#f25367"}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function App() {
  const [authMode, setAuthMode] = useState("login");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem(SESSION_KEY) || "");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCoinId, setAdminCoinId] = useState("mrbeast");
  const [adminEventType, setAdminEventType] = useState(DRAMA_EVENTS[0].type);
  const [lastGlobalEventId, setLastGlobalEventId] = useState("");

  const [activeTab, setActiveTab] = useState("market");
  const [coins, setCoins] = useState(makeInitialState);
  const [cash, setCash] = useState(INITIAL_CASH);
  const [holdings, setHoldings] = useState({});
  const [selectedCoinId, setSelectedCoinId] = useState("mrbeast");
  const [amount, setAmount] = useState("10");
  const [tradeMsg, setTradeMsg] = useState("");
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    const users = readJSON(USERS_KEY, {});
    if (!users[currentUser]) {
      setCurrentUser("");
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    setIsAdmin(Boolean(users[currentUser].isAdmin || isAdminEmail(currentUser)));

    const portfolio = readJSON(getPortfolioKey(currentUser), {
      cash: INITIAL_CASH,
      holdings: {},
    });
    setCash(typeof portfolio.cash === "number" ? portfolio.cash : INITIAL_CASH);
    setHoldings(portfolio.holdings && typeof portfolio.holdings === "object" ? portfolio.holdings : {});
    setTradeMsg("");
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    localStorage.setItem(
      getPortfolioKey(currentUser),
      JSON.stringify({
        cash,
        holdings,
      })
    );
  }, [currentUser, cash, holdings]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCoins((prevCoins) => {
        const impulseMap = {};

        const globalEvent = readJSON(GLOBAL_EVENT_KEY, null);
        if (globalEvent && globalEvent.id && globalEvent.id !== lastGlobalEventId) {
          impulseMap[globalEvent.coinId] = globalEvent.shock;
          const coin = prevCoins.find((c) => c.id === globalEvent.coinId);
          if (coin) {
            setFeed((prev) =>
              [
                {
                  id: globalEvent.id,
                  coinId: coin.id,
                  coinSymbol: coin.symbol,
                  title: coin.name,
                  text: globalEvent.text,
                  impulse: globalEvent.shock,
                  eventType: `${globalEvent.type} (admin)`,
                  ts: new Date(globalEvent.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  }),
                },
                ...prev,
              ].slice(0, 12)
            );
          }
          setLastGlobalEventId(globalEvent.id);
        }

        if (Math.random() < 0.35) {
          const pickedCoin = prevCoins[Math.floor(Math.random() * prevCoins.length)];
          const pickedEvent = DRAMA_EVENTS[Math.floor(Math.random() * DRAMA_EVENTS.length)];
          const shock = pickedEvent.shock;
          impulseMap[pickedCoin.id] = shock;

          const item = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            coinId: pickedCoin.id,
            coinSymbol: pickedCoin.symbol,
            title: pickedCoin.name,
            text: pickedEvent.text,
            impulse: shock,
            eventType: pickedEvent.type,
            ts: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          };
          setFeed((prev) => [item, ...prev].slice(0, 12));
        }

        return prevCoins.map((c) => evolveCoin(c, impulseMap[c.id] || 0));
      });
    }, UPDATE_MS);

    return () => clearInterval(timer);
  }, []);

  const selectedCoin = useMemo(() => coins.find((c) => c.id === selectedCoinId) || coins[0], [coins, selectedCoinId]);

  const holdingsValue = useMemo(
    () =>
      Object.entries(holdings).reduce((sum, [coinId, qty]) => {
        const coin = coins.find((c) => c.id === coinId);
        return sum + (coin ? coin.price * qty : 0);
      }, 0),
    [holdings, coins]
  );

  const accountValue = cash + holdingsValue;

  const handleSignUp = () => {
    const email = emailInput.trim().toLowerCase();
    const password = passwordInput.trim();
    if (!email || !email.includes("@")) {
      setAuthError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }

    const users = readJSON(USERS_KEY, {});
    if (users[email]) {
      setAuthError("This email already has an account. Log in instead.");
      return;
    }

    users[email] = { password, isAdmin: isAdminEmail(email) };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(
      getPortfolioKey(email),
      JSON.stringify({
        cash: INITIAL_CASH,
        holdings: {},
      })
    );
    localStorage.setItem(SESSION_KEY, email);
    setCurrentUser(email);
    setAuthError("");
    setPasswordInput("");
  };

  const handleLogin = () => {
    const email = emailInput.trim().toLowerCase();
    const password = passwordInput.trim();
    const users = readJSON(USERS_KEY, {});
    if (!users[email] || users[email].password !== password) {
      setAuthError("Invalid email or password.");
      return;
    }
    localStorage.setItem(SESSION_KEY, email);
    setCurrentUser(email);
    setAuthError("");
    setPasswordInput("");
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser("");
    setCash(INITIAL_CASH);
    setHoldings({});
    setFeed([]);
    setTradeMsg("");
    setIsAdmin(false);
  };

  const triggerAdminEvent = () => {
    const event = DRAMA_EVENTS.find((item) => item.type === adminEventType);
    if (!event) return;
    const payload = {
      id: `admin-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      coinId: adminCoinId,
      type: event.type,
      shock: event.shock,
      text: event.text,
      createdAt: Date.now(),
      createdBy: currentUser,
    };
    localStorage.setItem(GLOBAL_EVENT_KEY, JSON.stringify(payload));
    setTradeMsg(
      `Admin event sent: ${event.type} ${event.shock > 0 ? "+" : ""}${Math.round(event.shock * 100)}% on ${
        coins.find((c) => c.id === adminCoinId)?.symbol || adminCoinId
      }.`
    );
  };

  if (!currentUser) {
    return (
      <div className="auth-wrap">
        <section className="auth-card panel">
          <div className="brand" style={{ marginBottom: 12 }}>
            <div className="logo" />
            <div>
              <div className="title">Clout.Trade</div>
              <div className="subtle">Fantasy influencer coin exchange</div>
            </div>
          </div>

          <div className="tabs" style={{ marginBottom: 10 }}>
            <button className={`tab ${authMode === "login" ? "active" : ""}`} onClick={() => setAuthMode("login")}>
              Log In
            </button>
            <button className={`tab ${authMode === "signup" ? "active" : ""}`} onClick={() => setAuthMode("signup")}>
              Sign Up
            </button>
          </div>

          <div className="auth-form">
            <label className="subtle small" htmlFor="auth-email">
              Email
            </label>
            <input
              id="auth-email"
              className="trade-input"
              type="email"
              autoComplete="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="you@example.com"
            />

            <label className="subtle small" htmlFor="auth-password">
              Password
            </label>
            <input
              id="auth-password"
              className="trade-input"
              type="password"
              autoComplete={authMode === "login" ? "current-password" : "new-password"}
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Minimum 6 characters"
            />

            <button className="btn auth-btn" onClick={authMode === "login" ? handleLogin : handleSignUp}>
              {authMode === "login" ? "Enter Trading Terminal" : "Create Account"}
            </button>

            <div className={`subtle small ${authError ? "auth-error" : ""}`}>
              {authError ||
                (authMode === "signup"
                  ? "New accounts start with $15,000 fantasy balance."
                  : "Log in to continue your portfolio.")}
            </div>
            <div className="subtle small">Admin emails get moderator access and admin badge automatically.</div>
          </div>
        </section>
      </div>
    );
  }

  const executeTrade = (side) => {
    const quantity = Number(amount);
    if (!selectedCoin || Number.isNaN(quantity) || quantity <= 0) {
      setTradeMsg("Enter a valid amount of coins.");
      return;
    }

    const notional = quantity * selectedCoin.price;
    if (side === "buy") {
      if (notional > cash) {
        setTradeMsg("Not enough USD balance for this buy.");
        return;
      }
      setCash((x) => Number((x - notional).toFixed(2)));
      setHoldings((prev) => ({ ...prev, [selectedCoin.id]: Number(((prev[selectedCoin.id] || 0) + quantity).toFixed(4)) }));
      setTradeMsg(`Bought ${quantity} ${selectedCoin.symbol} for ${formatUsd(notional)}.`);
      return;
    }

    const owned = holdings[selectedCoin.id] || 0;
    if (quantity > owned) {
      setTradeMsg(`You only have ${owned.toFixed(4)} ${selectedCoin.symbol}.`);
      return;
    }

    const nextQty = Number((owned - quantity).toFixed(4));
    setHoldings((prev) => ({ ...prev, [selectedCoin.id]: nextQty }));
    setCash((x) => Number((x + notional).toFixed(2)));
    setTradeMsg(`Sold ${quantity} ${selectedCoin.symbol} for ${formatUsd(notional)}.`);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="logo" />
          <div>
            <div className="title">Clout.Trade</div>
            <div className="subtle">Influencer coin trading simulator</div>
          </div>
          {isAdmin && <span className="admin-badge">Admin</span>}
        </div>
        <div className="row" style={{ gap: 10 }}>
          <div className="subtle">Auto-refreshing market every {UPDATE_MS / 1000}s</div>
          <button className="tab" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {isAdmin && (
        <section className="panel admin-panel">
          <div className="row">
            <strong>Admin Panel</strong>
            <span className="subtle small">Manual global drama triggers (all sessions)</span>
          </div>
          <div className="admin-grid">
            <select className="trade-select" value={adminCoinId} onChange={(e) => setAdminCoinId(e.target.value)}>
              {coins.map((coin) => (
                <option value={coin.id} key={coin.id}>
                  {coin.symbol} - {coin.name}
                </option>
              ))}
            </select>
            <select className="trade-select" value={adminEventType} onChange={(e) => setAdminEventType(e.target.value)}>
              {DRAMA_EVENTS.map((event) => (
                <option value={event.type} key={event.type}>
                  {event.type} ({event.shock > 0 ? "+" : ""}
                  {Math.round(event.shock * 100)}%)
                </option>
              ))}
            </select>
            <button className="btn auth-btn" onClick={triggerAdminEvent}>
              Trigger Event
            </button>
          </div>
        </section>
      )}

      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="tabs">
          <button className={`tab ${activeTab === "market" ? "active" : ""}`} onClick={() => setActiveTab("market")}>
            Market
          </button>
          <button className={`tab ${activeTab === "feed" ? "active" : ""}`} onClick={() => setActiveTab("feed")}>
            Live Feed
          </button>
          <button className={`tab ${activeTab === "portfolio" ? "active" : ""}`} onClick={() => setActiveTab("portfolio")}>
            Portfolio
          </button>
        </div>

        <div className="stat-row">
          <div className="stat">
            <div className="subtle">Account Value</div>
            <div className="stat-value">{formatUsd(accountValue)}</div>
          </div>
          <div className="stat">
            <div className="subtle">Cash</div>
            <div className="stat-value">{formatUsd(cash)}</div>
          </div>
          <div className="stat">
            <div className="subtle">Holdings</div>
            <div className="stat-value">{formatUsd(holdingsValue)}</div>
          </div>
        </div>
      </section>

      <div className="grid top-grid">
        <section className="panel">
          {activeTab === "market" && (
            <table className="market-table">
              <thead>
                <tr>
                  <th>Coin</th>
                  <th>Price</th>
                  <th>24h</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {coins
                  .slice()
                  .sort((a, b) => b.price - a.price)
                  .map((coin) => (
                    <tr key={coin.id}>
                      <td>
                        <div className="coin-cell">
                          <div className="coin-avatar" style={{ background: coin.color }}>
                            {coin.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <div>{coin.name}</div>
                            <div className="subtle small">{coin.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td>{formatUsd(coin.price)}</td>
                      <td className={coin.change24h >= 0 ? "positive" : "negative"}>
                        {coin.change24h >= 0 ? "+" : ""}
                        {coin.change24h}%
                      </td>
                      <td>
                        <Sparkline points={coin.history} up={coin.change24h >= 0} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {activeTab === "feed" && (
            <div className="feed-list">
              {feed.length === 0 ? (
                <div className="empty">Waiting for influencer drama to hit the wire...</div>
              ) : (
                feed.map((item) => (
                  <div className="feed-item" key={item.id}>
                    <div className="feed-top">
                      <strong>
                        {item.title} ({item.coinSymbol})
                      </strong>
                      <span className={`impact-badge ${item.impulse >= 0 ? "up" : "down"}`}>
                        {item.eventType}: {item.impulse > 0 ? "+" : ""}
                        {Math.round(item.impulse * 100)}%
                      </span>
                    </div>
                    <div style={{ margin: "7px 0 6px" }}>{item.text}</div>
                    <div className="subtle small">{item.ts}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "portfolio" && (
            <div className="holdings">
              {Object.entries(holdings)
                .filter(([, qty]) => qty > 0)
                .map(([coinId, qty]) => {
                  const coin = coins.find((c) => c.id === coinId);
                  if (!coin) return null;
                  const value = qty * coin.price;
                  return (
                    <div className="holding" key={coinId}>
                      <div className="row">
                        <strong>
                          {coin.name} ({coin.symbol})
                        </strong>
                        <span>{formatUsd(value)}</span>
                      </div>
                      <div className="subtle small">{qty.toFixed(4)} coins</div>
                    </div>
                  );
                })}
              {Object.values(holdings).every((qty) => qty <= 0) && (
                <div className="empty">No positions yet. Buy a coin to start your portfolio.</div>
              )}
            </div>
          )}
        </section>

        <aside className="panel trade-box">
          <div>
            <strong>Quick Trade</strong>
            <div className="subtle">Simulated fills at live mid-price</div>
          </div>

          <div className="holding">
            <div className="row">
              <span className="subtle small">Clout Score</span>
              <strong>{selectedCoin ? selectedCoin.cloutScore : "--"}</strong>
            </div>
            <div className="subtle small">
              Reach 25% · Engagement 30% · Growth 20% · Sentiment 15% · Activity 10%
            </div>
          </div>

          <label className="subtle small" htmlFor="coin-select">
            Coin
          </label>
          <select
            id="coin-select"
            className="trade-select"
            value={selectedCoinId}
            onChange={(e) => setSelectedCoinId(e.target.value)}
          >
            {coins.map((coin) => (
              <option value={coin.id} key={coin.id}>
                {coin.symbol} - {coin.name}
              </option>
            ))}
          </select>

          <div className="row">
            <span className="subtle small">Live Price</span>
            <strong>{selectedCoin ? formatUsd(selectedCoin.price) : "--"}</strong>
          </div>

          <label className="subtle small" htmlFor="amount-input">
            Amount (coins)
          </label>
          <input
            id="amount-input"
            className="trade-input"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <div className="row subtle small">
            <span>Order Notional</span>
            <span>{selectedCoin && Number(amount) > 0 ? formatUsd(Number(amount) * selectedCoin.price) : "--"}</span>
          </div>

          <div className="trade-actions">
            <button className="btn buy" onClick={() => executeTrade("buy")} disabled={!selectedCoin}>
              Buy
            </button>
            <button className="btn sell" onClick={() => executeTrade("sell")} disabled={!selectedCoin}>
              Sell
            </button>
          </div>

          <div className="subtle small">{tradeMsg || "Trade confirmations show here."}</div>

          <div className="row subtle small">
            <span>Owned</span>
            <strong>{selectedCoin ? (holdings[selectedCoin.id] || 0).toFixed(4) : "0.0000"}</strong>
          </div>
        </aside>
      </div>
    </div>
  );
}
