import { useEffect, useMemo, useRef, useState } from "react";

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
    bio: "YouTube philanthropist and stunt creator. Massive global reach with high-converting brand ecosystems.",
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
    bio: "High-energy streamer with cult-like live audience and constant viral moments.",
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
    bio: "Twitch powerhouse known for marathon streams and record-breaking sub events.",
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
    bio: "Global sports icon with elite brand equity across lifestyle and performance verticals.",
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
    bio: "Chart-topping rapper with a fiercely loyal fanbase and recurring viral moments.",
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
    bio: "Beauty and lifestyle mogul with premium consumer reach across social commerce.",
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
    bio: "Kick and streaming personality known for headline collabs and volatile sentiment swings.",
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
    bio: "TikTok-native creator with mainstream crossover and consistent platform activity.",
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
const SOCIAL_POSTS_KEY = "clouttrade_social_posts_v2";
const ADMIN_EMAILS = new Set(["yohanribot1503@gmail.com", "diegonanton@gmail.com"]);

const WEEKLY_TOP_TRADES = [
  { user: "moonboy_eth", win: 8420, coin: "SPEED", label: "Long SPEED into viral" },
  { user: "cloutqueen", win: 6120, coin: "KAI", label: "KAI subathon squeeze" },
  { user: "paperhands_pete", win: 4890, coin: "BEAST", label: "BEAST brand deal rip" },
  { user: "whale_alert", win: 12050, coin: "CR7", label: "CR7 World Cup narrative" },
  { user: "degen_dana", win: 3340, coin: "ADIN", label: "ADIN stream pump" },
];

const BOT_TRADERS = [
  { id: "b1", handle: "moonboy_eth", profit: 124200, heldIds: ["mrbeast", "kaicenat", "ishowspeed"] },
  { id: "b2", handle: "whale_alert", profit: 98200, heldIds: ["cristianoronaldo", "mrbeast"] },
  { id: "b3", handle: "cloutqueen", profit: 76400, heldIds: ["nickiminaj", "kyliejenner"] },
  { id: "b4", handle: "stream_snip3r", profit: 52100, heldIds: ["ishowspeed", "adinross"] },
  { id: "b5", handle: "tiktok_theta", profit: 41800, heldIds: ["charlidamelio", "kyliejenner"] },
  { id: "b6", handle: "riskit_rick", profit: 28900, heldIds: ["adinross", "ishowspeed", "kaicenat"] },
];

const randomBetween = (min, max) => Math.random() * (max - min) + min;

const formatUsd = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);

const formatCompact = (n) => {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return formatUsd(n);
};

function maskUsd(reveal, value) {
  if (reveal) return formatUsd(value);
  return "$****";
}

function maskTradeLine(reveal, t) {
  if (reveal) {
    return `${t.side.toUpperCase()} ${t.symbol} · ${t.qty} @ ${formatUsd(t.price)}`;
  }
  return `${t.side.toUpperCase()} ${t.symbol} · **** @ $****`;
}

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

function influencerPhotoUrl(coin) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(coin.name)}&size=128&background=171717&color=ffffff&bold=true`;
}

function usernameFromEmail(email) {
  if (!email) return "trader";
  const local = email.split("@")[0] || "trader";
  return local.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 18) || "trader";
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
  const history = [...coin.history.slice(-119), nextPrice];
  return {
    ...coin,
    price: Number(nextPrice.toFixed(2)),
    change24h: Number((((nextPrice - history[0]) / history[0]) * 100).toFixed(2)),
    history,
  };
}

function makeInitialState() {
  return STARTING_COINS.map((coin) => {
    const baseHistory = Array.from({ length: 48 }, () => coin.price * randomBetween(0.92, 1.06)).map((x) =>
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

function closesToOHLC(closes, maxCandles = 32) {
  if (!closes.length) return [];
  const n = closes.length;
  const segments = Math.min(maxCandles, Math.max(8, Math.floor(n / 3)));
  const segSize = Math.max(1, Math.floor(n / segments));
  const candles = [];
  for (let i = 0; i < segments; i++) {
    const slice = closes.slice(i * segSize, (i + 1) * segSize);
    if (!slice.length) break;
    const o = slice[0];
    const c = slice[slice.length - 1];
    const h = Math.max(...slice);
    const l = Math.min(...slice);
    candles.push({ o, h, l, c });
  }
  return candles;
}

function tfToCandles(closes, tf) {
  const len = closes.length;
  if (tf === "LIVE") {
    const tail = closes.slice(-32);
    return tail.map((p) => ({ o: p, h: p, l: p, c: p }));
  }
  const map = { "1H": 24, "4H": 18, "1D": 28, "7D": 32, ALL: 40 };
  const max = map[tf] || 28;
  return closesToOHLC(closes.slice(-Math.min(len, 120)), max);
}

const CHART_GREEN = "#22C55E";
const CHART_RED = "#EF4444";

function CandlestickChart({ candles, width = 320, height = 168 }) {
  if (!candles.length) return <div className="empty-state chart-loading">Loading chart…</div>;
  const padX = 2;
  const padY = 4;
  const highs = candles.map((c) => c.h);
  const lows = candles.map((c) => c.l);
  const maxP = Math.max(...highs);
  const minP = Math.min(...lows);
  const range = maxP - minP || 1;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const cw = innerW / candles.length;
  const bodyW = Math.max(1, Math.min(cw * 0.38, 3.5));

  return (
    <svg
      className="chart-svg"
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      shapeRendering="geometricPrecision"
    >
      {candles.map((c, i) => {
        const x = padX + i * cw + cw / 2;
        const y = (p) => padY + innerH - ((p - minP) / range) * innerH;
        const up = c.c >= c.o;
        const color = up ? CHART_GREEN : CHART_RED;
        const yO = y(c.o);
        const yC = y(c.c);
        const top = Math.min(yO, yC);
        const bot = Math.max(yO, yC);
        const bodyH = Math.max(1, bot - top);
        const wickTop = y(c.h);
        const wickBot = y(c.l);
        return (
          <g key={i}>
            <line
              x1={x}
              y1={wickTop}
              x2={x}
              y2={wickBot}
              stroke={color}
              strokeWidth={1}
              strokeLinecap="butt"
            />
            <rect
              x={x - bodyW / 2}
              y={top}
              width={bodyW}
              height={bodyH}
              fill={color}
              stroke="none"
            />
          </g>
        );
      })}
    </svg>
  );
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function normalizePortfolio(raw) {
  const cash = typeof raw?.cash === "number" ? raw.cash : INITIAL_CASH;
  const holdings = raw?.holdings && typeof raw.holdings === "object" ? raw.holdings : {};
  const avgCost = raw?.avgCost && typeof raw.avgCost === "object" ? raw.avgCost : {};
  const tradeHistory = Array.isArray(raw?.tradeHistory) ? raw.tradeHistory : [];
  const equitySnapshots = Array.isArray(raw?.equitySnapshots) ? raw.equitySnapshots : [];
  const dayStartEquity = typeof raw?.dayStartEquity === "number" ? raw.dayStartEquity : INITIAL_CASH;
  const dayStartKey = typeof raw?.dayStartKey === "string" ? raw.dayStartKey : "";
  return { cash, holdings, avgCost, tradeHistory, equitySnapshots, dayStartEquity, dayStartKey };
}

function buildEquitySeries(snapshots, currentEquity) {
  if (snapshots.length >= 2) return snapshots;
  const target = currentEquity;
  const n = 36;
  return Array.from({ length: n }, (_, i) => ({
    ts: Date.now() - (n - 1 - i) * 120000,
    value: Number((INITIAL_CASH + ((target - INITIAL_CASH) * i) / (n - 1 || 1)).toFixed(2)),
  }));
}

function EquityAreaChart({ points, width = 340, height = 120 }) {
  if (!points.length) return <div className="empty-state chart-loading">No data yet</div>;
  const vals = points.map((p) => p.value);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const pad = 4;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const range = maxV - minV || 1;
  const step = w / (points.length - 1 || 1);
  const linePath = points
    .map((p, i) => {
      const x = pad + i * step;
      const y = pad + h - ((p.value - minV) / range) * h;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
  const lastX = pad + (points.length - 1) * step;
  const firstY = pad + h - ((points[0].value - minV) / range) * h;
  const areaPath = `${linePath} L${lastX},${pad + h} L${pad},${pad + h} Z`;

  return (
    <svg className="chart-svg equity-area-svg" width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22C55E" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#equityFill)" />
      <path d={linePath} fill="none" stroke="#22C55E" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function computeCoinPriceProjection(price, cloutScore, growthMetric) {
  const scoreN = Math.min(1, cloutScore / 95);
  const growthN = growthMetric / 100;
  const dailyOpt = 0.0018 + scoreN * 0.0055 + growthN * 0.0038;
  const dailyNeu = dailyOpt * 0.38;
  const dailyPess = -Math.abs(dailyOpt) * 0.62;
  const horizons = [7, 30, 90];
  return horizons.map((days) => ({
    days,
    opt: Number((price * Math.pow(1 + dailyOpt, days)).toFixed(2)),
    neu: Number((price * Math.pow(1 + dailyNeu, days)).toFixed(2)),
    pess: Number((price * Math.pow(1 + dailyPess, days)).toFixed(2)),
  }));
}

function projectionInvestOutcomes(price, rows, invest = 500) {
  const shares = invest / price;
  return rows.map((r) => ({
    days: r.days,
    opt: Number((shares * r.opt).toFixed(2)),
    neu: Number((shares * r.neu).toFixed(2)),
    pess: Number((shares * r.pess).toFixed(2)),
  }));
}

function computePortfolioPotential(accountValue) {
  const annual = 0.072;
  const monthsList = [3, 6, 12, 36];
  return monthsList.map((m) => {
    const monthly = Math.pow(1 + annual / 12, m);
    const projected = Number((accountValue * monthly).toFixed(2));
    const returnPart = Math.max(0, projected - accountValue);
    return { months: m, label: m === 3 ? "3 mo" : m === 6 ? "6 mo" : m === 12 ? "1 yr" : "3 yr", projected, returnPart, principal: accountValue };
  });
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
  const lastGlobalEventIdRef = useRef("");

  const [navTab, setNavTab] = useState("home");
  const [coinDetailId, setCoinDetailId] = useState(null);
  const [homeFilter, setHomeFilter] = useState("trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [chartTf, setChartTf] = useState("LIVE");
  const [coinDetailTab, setCoinDetailTab] = useState("holders");
  const [tradeSheetOpen, setTradeSheetOpen] = useState(false);
  const [amount, setAmount] = useState("10");

  const [coins, setCoins] = useState(makeInitialState);
  const [cash, setCash] = useState(INITIAL_CASH);
  const [holdings, setHoldings] = useState({});
  const [avgCost, setAvgCost] = useState({});
  const [tradeHistory, setTradeHistory] = useState([]);
  const [equitySnapshots, setEquitySnapshots] = useState([]);
  const [dayStartEquity, setDayStartEquity] = useState(INITIAL_CASH);
  const [dayStartKey, setDayStartKey] = useState("");
  const [balanceReveal, setBalanceReveal] = useState(false);
  const [tradeSheetMode, setTradeSheetMode] = useState("buy");
  const [potentialBarIndex, setPotentialBarIndex] = useState(null);
  const [dramaFeed, setDramaFeed] = useState([]);
  const [socialPosts, setSocialPosts] = useState(() => readJSON(SOCIAL_POSTS_KEY, []));
  const [composeCoinId, setComposeCoinId] = useState("mrbeast");
  const [composeText, setComposeText] = useState("");
  const [toast, setToast] = useState("");

  const accountValueRef = useRef(0);
  const displayName = useMemo(() => usernameFromEmail(currentUser), [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const users = readJSON(USERS_KEY, {});
    if (!users[currentUser]) {
      setCurrentUser("");
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    setIsAdmin(Boolean(users[currentUser].isAdmin || isAdminEmail(currentUser)));

    const portfolio = normalizePortfolio(readJSON(getPortfolioKey(currentUser), {}));
    setCash(portfolio.cash);
    setHoldings(portfolio.holdings);
    setAvgCost(portfolio.avgCost);
    setTradeHistory(portfolio.tradeHistory);
    const tk = todayKey();
    const openEquity =
      portfolio.cash +
      Object.entries(portfolio.holdings).reduce((s, [id, q]) => {
        const c = STARTING_COINS.find((x) => x.id === id);
        return s + (c && q > 0 ? q * c.price : 0);
      }, 0);
    if (!portfolio.dayStartKey || portfolio.dayStartKey !== tk) {
      setDayStartKey(tk);
      setDayStartEquity(openEquity);
    } else {
      setDayStartKey(portfolio.dayStartKey);
      setDayStartEquity(portfolio.dayStartEquity);
    }
    if (portfolio.equitySnapshots.length >= 2) {
      setEquitySnapshots(portfolio.equitySnapshots);
    } else {
      const seed = openEquity;
      setEquitySnapshots([{ ts: Date.now() - 3600000, value: INITIAL_CASH }, { ts: Date.now(), value: seed }]);
    }
    setBalanceReveal(readJSON(`clouttrade_balance_visible_${currentUser}`, false));
    setToast("");
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    localStorage.setItem(
      getPortfolioKey(currentUser),
      JSON.stringify({
        cash,
        holdings,
        avgCost,
        tradeHistory,
        equitySnapshots,
        dayStartEquity,
        dayStartKey,
      })
    );
  }, [currentUser, cash, holdings, avgCost, tradeHistory, equitySnapshots, dayStartEquity, dayStartKey]);

  useEffect(() => {
    if (!currentUser) return;
    localStorage.setItem(`clouttrade_balance_visible_${currentUser}`, JSON.stringify(balanceReveal));
  }, [balanceReveal, currentUser]);

  useEffect(() => {
    localStorage.setItem(SOCIAL_POSTS_KEY, JSON.stringify(socialPosts));
  }, [socialPosts]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCoins((prevCoins) => {
        const impulseMap = {};

        const globalEvent = readJSON(GLOBAL_EVENT_KEY, null);
        if (globalEvent?.id && globalEvent.id !== lastGlobalEventIdRef.current) {
          impulseMap[globalEvent.coinId] = globalEvent.shock;
          const coin = prevCoins.find((c) => c.id === globalEvent.coinId);
          if (coin) {
            setDramaFeed((prev) =>
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
              ].slice(0, 20)
            );
          }
          lastGlobalEventIdRef.current = globalEvent.id;
        }

        if (Math.random() < 0.32) {
          const pickedCoin = prevCoins[Math.floor(Math.random() * prevCoins.length)];
          const pickedEvent = DRAMA_EVENTS[Math.floor(Math.random() * DRAMA_EVENTS.length)];
          const shock = pickedEvent.shock;
          impulseMap[pickedCoin.id] = shock;
          setDramaFeed((prev) =>
            [
              {
                id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
                coinId: pickedCoin.id,
                coinSymbol: pickedCoin.symbol,
                title: pickedCoin.name,
                text: pickedEvent.text,
                impulse: shock,
                eventType: pickedEvent.type,
                ts: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
              },
              ...prev,
            ].slice(0, 20)
          );
        }

        return prevCoins.map((c) => evolveCoin(c, impulseMap[c.id] || 0));
      });
    }, UPDATE_MS);

    return () => clearInterval(timer);
  }, []);

  const detailCoin = useMemo(() => coins.find((c) => c.id === coinDetailId) || null, [coins, coinDetailId]);

  const holdingsValue = useMemo(
    () =>
      Object.entries(holdings).reduce((sum, [coinId, qty]) => {
        const coin = coins.find((c) => c.id === coinId);
        return sum + (coin && qty > 0 ? coin.price * qty : 0);
      }, 0),
    [holdings, coins]
  );

  const accountValue = cash + holdingsValue;
  const totalPnL = accountValue - INITIAL_CASH;
  accountValueRef.current = accountValue;

  useEffect(() => {
    if (!currentUser) return;
    const id = setInterval(() => {
      const v = accountValueRef.current;
      setEquitySnapshots((prev) => [...prev, { ts: Date.now(), value: v }].slice(-160));
    }, 4500);
    return () => clearInterval(id);
  }, [currentUser]);

  const sortedHomeCoins = useMemo(() => {
    let list = [...coins];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q) || c.id.includes(q)
      );
    }
    if (navTab === "home") {
      if (homeFilter === "gainers") list.sort((a, b) => b.change24h - a.change24h);
      else if (homeFilter === "losers") list.sort((a, b) => a.change24h - b.change24h);
      else if (homeFilter === "held") {
        list.sort((a, b) => (holdings[b.id] || 0) * b.price - (holdings[a.id] || 0) * a.price);
      } else {
        list.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
      }
    } else if (navTab === "search") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [coins, homeFilter, holdings, navTab, searchQuery]);

  const leaderboardRows = useMemo(() => {
    const users = readJSON(USERS_KEY, {});
    const rows = [];
    Object.keys(users).forEach((email) => {
      const p = normalizePortfolio(readJSON(getPortfolioKey(email), {}));
      let hv = 0;
      coins.forEach((c) => {
        const q = p.holdings[c.id] || 0;
        if (q > 0) hv += q * c.price;
      });
      const equity = p.cash + hv;
      rows.push({
        id: email,
        handle: usernameFromEmail(email),
        profit: equity - INITIAL_CASH,
        heldIds: Object.keys(p.holdings).filter((k) => (p.holdings[k] || 0) > 0),
        isYou: email === currentUser,
      });
    });
    BOT_TRADERS.forEach((b) => {
      rows.push({
        id: b.id,
        handle: b.handle,
        profit: b.profit,
        heldIds: b.heldIds,
        isYou: false,
      });
    });
    rows.sort((a, b) => b.profit - a.profit);
    return rows.map((r, i) => ({ ...r, rank: i + 1 }));
  }, [coins, currentUser]);

  const yourRank = useMemo(() => leaderboardRows.find((r) => r.isYou)?.rank ?? "—", [leaderboardRows]);

  const coinPosts = useMemo(
    () => socialPosts.filter((p) => p.coinId === coinDetailId).sort((a, b) => b.createdAt - a.createdAt),
    [socialPosts, coinDetailId]
  );

  const equitySeries = useMemo(() => buildEquitySeries(equitySnapshots, accountValue), [equitySnapshots, accountValue]);

  const todayPct = useMemo(() => {
    if (!dayStartEquity || dayStartEquity <= 0) return 0;
    return Number((((accountValue - dayStartEquity) / dayStartEquity) * 100).toFixed(2));
  }, [accountValue, dayStartEquity]);

  const potentialHorizons = useMemo(() => computePortfolioPotential(accountValue), [accountValue]);

  const coinProjectionPack = useMemo(() => {
    if (!detailCoin) return { rows: [], dollars: [] };
    const rows = computeCoinPriceProjection(detailCoin.price, detailCoin.cloutScore, detailCoin.metrics.growth);
    const dollars = projectionInvestOutcomes(detailCoin.price, rows, 500);
    return { rows, dollars };
  }, [detailCoin]);

  const executeTrade = (side, coinOverride) => {
    const coin = coinOverride || detailCoin;
    if (!coin) return;
    const quantity = Number(amount);
    if (Number.isNaN(quantity) || quantity <= 0) {
      setToast("Enter a valid amount.");
      return;
    }

    const notional = quantity * coin.price;
    if (side === "buy") {
      if (notional > cash) {
        setToast("Not enough balance.");
        return;
      }
      const prevQty = holdings[coin.id] || 0;
      const prevAvg = avgCost[coin.id] ?? coin.price;
      const nextQty = prevQty + quantity;
      const nextAvg = (prevQty * prevAvg + quantity * coin.price) / nextQty;
      setCash((x) => Number((x - notional).toFixed(2)));
      setHoldings((prev) => ({ ...prev, [coin.id]: Number(nextQty.toFixed(4)) }));
      setAvgCost((prev) => ({ ...prev, [coin.id]: Number(nextAvg.toFixed(4)) }));
      setTradeHistory((h) => [
        {
          side: "buy",
          coinId: coin.id,
          symbol: coin.symbol,
          qty: quantity,
          price: coin.price,
          createdAt: Date.now(),
        },
        ...h,
      ].slice(0, 80));
      setToast(`Bought ${quantity} ${coin.symbol}`);
      setTradeSheetOpen(false);
      return;
    }

    const owned = holdings[coin.id] || 0;
    if (quantity > owned) {
      setToast(`Max sell: ${owned.toFixed(4)}`);
      return;
    }
    const ac = avgCost[coin.id] ?? coin.price;
    const realized = (coin.price - ac) * quantity;
    setCash((x) => Number((x + notional).toFixed(2)));
    setHoldings((prev) => {
      const next = Number((owned - quantity).toFixed(4));
      const copy = { ...prev, [coin.id]: next };
      if (next <= 0) {
        delete copy[coin.id];
      }
      return copy;
    });
    if (owned - quantity <= 0) {
      setAvgCost((prev) => {
        const copy = { ...prev };
        delete copy[coin.id];
        return copy;
      });
    }
    setTradeHistory((h) => [
      {
        side: "sell",
        coinId: coin.id,
        symbol: coin.symbol,
        qty: quantity,
        price: coin.price,
        realized: Number(realized.toFixed(2)),
        createdAt: Date.now(),
      },
      ...h,
    ].slice(0, 80));
    setToast(`Sold ${quantity} ${coin.symbol}`);
    setTradeSheetOpen(false);
  };

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
      setAuthError("Account exists. Log in.");
      return;
    }
    users[email] = { password, isAdmin: isAdminEmail(email) };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(
      getPortfolioKey(email),
      JSON.stringify({
        cash: INITIAL_CASH,
        holdings: {},
        avgCost: {},
        tradeHistory: [],
        equitySnapshots: [
          { ts: Date.now() - 60000, value: INITIAL_CASH },
          { ts: Date.now(), value: INITIAL_CASH },
        ],
        dayStartEquity: INITIAL_CASH,
        dayStartKey: todayKey(),
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
    setAvgCost({});
    setTradeHistory([]);
    setDramaFeed([]);
    setToast("");
    setIsAdmin(false);
    setCoinDetailId(null);
    setNavTab("home");
    setEquitySnapshots([]);
    setDayStartEquity(INITIAL_CASH);
    setDayStartKey("");
    setPotentialBarIndex(null);
    setTradeSheetOpen(false);
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
    setToast(`Admin: ${event.type} on ${coins.find((c) => c.id === adminCoinId)?.symbol}`);
  };

  const handleDeposit = () => {
    setCash((c) => Number((c + 1000).toFixed(2)));
    setToast("Demo deposit +$1,000");
  };

  const submitSocialPost = () => {
    const qty = holdings[composeCoinId] || 0;
    if (qty <= 0) {
      setToast("Hold the coin to post.");
      return;
    }
    const text = composeText.trim();
    if (!text) {
      setToast("Write your thesis.");
      return;
    }
    const coin = coins.find((c) => c.id === composeCoinId);
    if (!coin) return;
    const ac = avgCost[composeCoinId] ?? coin.price;
    const positionValue = qty * coin.price;
    const unrealizedPnL = (coin.price - ac) * qty;
    setSocialPosts((prev) =>
      [
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
          userId: currentUser,
          userLabel: displayName,
          coinId: composeCoinId,
          coinSymbol: coin.symbol,
          text,
          qty,
          positionValue,
          unrealizedPnL,
          createdAt: Date.now(),
        },
        ...prev,
      ].slice(0, 100)
    );
    setComposeText("");
    setToast("Posted to feed");
  };

  const syntheticHolders = (coin) => {
    const base = [
      { handle: "whale_alert", qty: 4200, pnlPct: 18.2 },
      { handle: "moonboy_eth", qty: 3100, pnlPct: 12.4 },
      { handle: "cloutqueen", qty: 2800, pnlPct: -4.1 },
      { handle: "stream_snip3r", qty: 1500, pnlPct: 6.7 },
    ];
    return base.map((h, i) => ({
      ...h,
      qty: h.qty + i * 120,
      pnlPct: h.pnlPct + (coin.change24h > 0 ? 2 : -2),
    }));
  };

  if (!currentUser) {
    return (
      <div className="auth-wrap">
        <section className="auth-card">
          <div className="brand" style={{ marginBottom: 8 }}>
            <div className="logo" />
            <div>
              <div className="title">Clout.Trade</div>
              <div className="subtle">Fantasy influencer coins</div>
            </div>
          </div>
          <div className="tabs-inline">
            <button className={`tab-inline ${authMode === "login" ? "active" : ""}`} onClick={() => setAuthMode("login")}>
              Log In
            </button>
            <button className={`tab-inline ${authMode === "signup" ? "active" : ""}`} onClick={() => setAuthMode("signup")}>
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
              placeholder="6+ characters"
            />
            <button className="auth-btn" onClick={authMode === "login" ? handleLogin : handleSignUp}>
              {authMode === "login" ? "Enter" : "Create account"}
            </button>
            <div className={`subtle small ${authError ? "auth-error" : ""}`}>
              {authError || (authMode === "signup" ? "Start with $15,000 fantasy cash." : "Welcome back.")}
            </div>
          </div>
        </section>
      </div>
    );
  }

  const candles = useMemo(() => {
    if (!detailCoin) return [];
    return tfToCandles(detailCoin.history, chartTf);
  }, [detailCoin, chartTf]);

  return (
    <div className="app-shell">
      {toast && (
        <div className="toast-banner">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast("")} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      <div className="app-main">
        {!coinDetailId && (
          <header className="top-bar">
            <div className="brand">
              <div className="logo" />
              <div>
                <div className="title">
                  Clout.Trade
                </div>
                <div className="subtle">{navTab === "profile" ? displayName : "Live markets"}</div>
              </div>
            </div>
            <div className="top-bar-actions">
              {isAdmin && <span className="admin-badge">Admin</span>}
              <button type="button" className="icon-btn" onClick={handleLogout}>
                Out
              </button>
            </div>
          </header>
        )}

        {isAdmin && !coinDetailId && (
          <section className="admin-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <strong className="small">Admin</strong>
              <span className="subtle small">Global drama</span>
            </div>
            <div className="admin-grid">
              <select className="trade-select" value={adminCoinId} onChange={(e) => setAdminCoinId(e.target.value)}>
                {coins.map((coin) => (
                  <option value={coin.id} key={coin.id}>
                    {coin.symbol}
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
              <button type="button" className="auth-btn" onClick={triggerAdminEvent}>
                Trigger
              </button>
            </div>
          </section>
        )}

        {!coinDetailId && navTab === "home" && (
          <>
            <div className="balance-block">
              <div className="balance-label">Portfolio</div>
              <div className="balance-amount">{formatUsd(accountValue)}</div>
              <div className={`balance-sub ${totalPnL >= 0 ? "positive" : "negative"}`}>
                {totalPnL >= 0 ? "+" : ""}
                {formatUsd(totalPnL)} all-time
              </div>
              <button type="button" className="deposit-btn" onClick={handleDeposit}>
                Deposit
              </button>
            </div>

            <div className="section-label">Weekly top trades</div>
            <div className="carousel">
              {WEEKLY_TOP_TRADES.map((w, i) => (
                <div className="carousel-card" key={i}>
                  <div className="carousel-user">{w.user}</div>
                  <div className="win">+{formatCompact(w.win)}</div>
                  <div className="carousel-meta">
                    {w.coin} · {w.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="chip-row">
              {[
                { id: "trending", label: "Trending" },
                { id: "held", label: "Most held" },
                { id: "gainers", label: "Gainers" },
                { id: "losers", label: "Losers" },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`chip ${homeFilter === c.id ? "active" : ""}`}
                  onClick={() => setHomeFilter(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="section-label" style={{ marginTop: 8 }}>
              Markets
            </div>
            <div className="coin-list">
              {sortedHomeCoins.map((coin) => (
                <button
                  type="button"
                  key={coin.id}
                  className="coin-row"
                  onClick={() => {
                    setCoinDetailId(coin.id);
                    setChartTf("LIVE");
                    setCoinDetailTab("holders");
                  }}
                >
                  <img className="coin-photo" src={influencerPhotoUrl(coin)} alt="" width={48} height={48} />
                  <div className="coin-row-mid">
                    <div className="coin-row-name">{coin.name}</div>
                    <div className="coin-row-ticker">{coin.symbol}</div>
                  </div>
                  <div className="coin-row-right">
                    <div className="coin-row-price">{formatUsd(coin.price)}</div>
                    <div className={`coin-row-pct ${coin.change24h >= 0 ? "up" : "down"}`}>
                      {coin.change24h >= 0 ? "+" : ""}
                      {coin.change24h.toFixed(2)}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {!coinDetailId && navTab === "search" && (
          <>
            <input
              className="search-input"
              placeholder="Search coins…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="coin-list">
              {sortedHomeCoins.map((coin) => (
                <button
                  type="button"
                  key={coin.id}
                  className="coin-row"
                  onClick={() => {
                    setCoinDetailId(coin.id);
                    setChartTf("LIVE");
                  }}
                >
                  <img className="coin-photo" src={influencerPhotoUrl(coin)} alt="" />
                  <div className="coin-row-mid">
                    <div className="coin-row-name">{coin.name}</div>
                    <div className="coin-row-ticker">{coin.symbol}</div>
                  </div>
                  <div className="coin-row-right">
                    <div className="coin-row-price">{formatUsd(coin.price)}</div>
                    <div className={`coin-row-pct ${coin.change24h >= 0 ? "up" : "down"}`}>
                      {coin.change24h >= 0 ? "+" : ""}
                      {coin.change24h.toFixed(2)}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {!coinDetailId && navTab === "feed" && (
          <>
            <div className="section-label">Your thesis</div>
            <div className="compose-card">
              <select className="trade-select" value={composeCoinId} onChange={(e) => setComposeCoinId(e.target.value)}>
                {coins.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.symbol} — position {(holdings[c.id] || 0).toFixed(2)} coins
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Post your thesis (must hold the coin)…"
                value={composeText}
                onChange={(e) => setComposeText(e.target.value)}
              />
              <button type="button" className="post-btn" onClick={submitSocialPost}>
                Post
              </button>
            </div>

            <div className="section-label">Feed</div>
            {socialPosts.length === 0 ? (
              <div className="empty-state">No posts yet.</div>
            ) : (
              socialPosts.map((p) => {
                const c = coins.find((x) => x.id === p.coinId);
                const livePnL =
                  p.userId === currentUser && c
                    ? (c.price - (avgCost[p.coinId] ?? c.price)) * (holdings[p.coinId] || 0)
                    : p.unrealizedPnL;
                const liveNotional = c ? (holdings[p.coinId] || p.qty) * c.price : p.positionValue;
                const up = livePnL >= 0;
                return (
                  <div className="post-card" key={p.id}>
                    <div className="post-header">
                      <div>
                        <div className="post-user">{p.userLabel}</div>
                        <div className="post-coin">
                          {c?.name} ({p.coinSymbol})
                        </div>
                      </div>
                      <div className={`post-pnl ${up ? "up" : "down"}`}>
                        {up ? "+" : ""}
                        {formatUsd(livePnL)}
                      </div>
                    </div>
                    <div className="post-position">
                      {(p.userId === currentUser ? holdings[p.coinId] || p.qty : p.qty).toFixed(2)} coins ·{" "}
                      {formatUsd(liveNotional)} notional
                    </div>
                    <div className="post-body">{p.text}</div>
                    <div className="post-time">{new Date(p.createdAt).toLocaleString()}</div>
                  </div>
                );
              })
            )}

            <div className="section-label" style={{ marginTop: 24 }}>
              Live wire (drama)
            </div>
            {dramaFeed.length === 0 ? (
              <div className="empty-state">Quiet… for now.</div>
            ) : (
              dramaFeed.map((item) => (
                <div className="post-card" key={item.id}>
                  <div className="post-header">
                    <div>
                      <div className="post-user">
                        {item.title} ({item.coinSymbol})
                      </div>
                      <div className="post-coin">{item.eventType}</div>
                    </div>
                    <div className={`post-pnl ${item.impulse >= 0 ? "up" : "down"}`}>
                      {item.impulse > 0 ? "+" : ""}
                      {Math.round(item.impulse * 100)}%
                    </div>
                  </div>
                  <div className="post-body">{item.text}</div>
                  <div className="post-time">{item.ts}</div>
                </div>
              ))
            )}
          </>
        )}

        {!coinDetailId && navTab === "leaderboard" && (
          <>
            <div className="rank-banner">
              <div className="subtle small">Your rank</div>
              <div className="big">#{yourRank}</div>
              <div className={`${totalPnL >= 0 ? "positive" : "negative"}`} style={{ fontWeight: 800, marginTop: 8 }}>
                {totalPnL >= 0 ? "+" : ""}
                {formatUsd(totalPnL)} P&amp;L
              </div>
            </div>
            <div className="section-label">Top traders</div>
            {leaderboardRows.slice(0, 25).map((row) => (
              <div className="lb-row" key={row.id}>
                <div className="lb-rank">#{row.rank}</div>
                <div className="lb-avatar">{row.handle.slice(0, 2).toUpperCase()}</div>
                <div className="lb-mid">
                  <div className="lb-name">
                    {row.handle}
                    {row.isYou ? " · you" : ""}
                  </div>
                  <div className={`lb-profit ${row.profit >= 0 ? "up" : "down"}`}>
                    {row.profit >= 0 ? "+" : ""}
                    {formatUsd(row.profit)}
                  </div>
                </div>
                <div className="lb-icons">
                  {row.heldIds.slice(0, 5).map((id) => {
                    const co = STARTING_COINS.find((c) => c.id === id);
                    if (!co) return null;
                    return <img key={id} className="lb-mini" src={influencerPhotoUrl(co)} alt="" />;
                  })}
                </div>
              </div>
            ))}
          </>
        )}

        {!coinDetailId && navTab === "profile" && (
          <>
            <div className="profile-etoro-header">
              <div className="profile-welcome-row">
                <div>
                  <div className="profile-welcome">Welcome back, {displayName}</div>
                  <div className="subtle small">{currentUser}</div>
                </div>
                <button
                  type="button"
                  className="balance-eye-btn"
                  onClick={() => setBalanceReveal((v) => !v)}
                  aria-label={balanceReveal ? "Hide balances" : "Show balances"}
                >
                  {balanceReveal ? "🙈" : "👁"}
                </button>
              </div>
              <div className="profile-equity-row">
                <span className="subtle small">Portfolio value</span>
                <span className="profile-equity-num num">{maskUsd(balanceReveal, accountValue)}</span>
              </div>
            </div>

            <div className="section-label">Performance</div>
            <div className="profile-chart-card">
              <EquityAreaChart points={equitySeries} width={340} height={110} />
              <div className="profile-today-row">
                <span className="subtle small">Today</span>
                <span className={`profile-today-pct num ${todayPct >= 0 ? "positive" : "negative"}`}>
                  {todayPct >= 0 ? "+" : ""}
                  {todayPct.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="section-label">Your potential</div>
            <div className="potential-card">
              <div className="potential-legend">
                <span>
                  <span className="dot dot-inv" /> Principal
                </span>
                <span>
                  <span className="dot dot-ret" /> Projected return
                </span>
              </div>
              <svg className="potential-svg" viewBox="0 0 320 120" preserveAspectRatio="xMidYMid meet">
                {(() => {
                  const maxV = Math.max(...potentialHorizons.map((p) => p.projected), accountValue * 1.05);
                  const h = 88;
                  const baseY = 100;
                  const barW = 36;
                  const gap = 18;
                  const startX = 24;
                  return potentialHorizons.map((ph, i) => {
                    const x = startX + i * (barW + gap);
                    const totalH = (ph.projected / maxV) * h;
                    const retH = (ph.returnPart / maxV) * h;
                    const invH = Math.max(2, totalH - retH);
                    const sel = potentialBarIndex === i;
                    return (
                      <g key={ph.label}>
                        <rect
                          x={x}
                          y={baseY - totalH}
                          width={barW}
                          height={totalH}
                          rx={4}
                          fill="transparent"
                          className="potential-hit"
                          style={{ cursor: "pointer" }}
                          onClick={() => setPotentialBarIndex(potentialBarIndex === i ? null : i)}
                        />
                        <rect x={x} y={baseY - invH - retH} width={barW} height={invH} rx={2} fill="#1f1f1f" stroke={sel ? "#404040" : "#2a2a2a"} strokeWidth={sel ? 1.5 : 1} />
                        <rect x={x} y={baseY - retH} width={barW} height={retH} rx={2} fill="#22C55E" opacity={sel ? 1 : 0.88} />
                        <text x={x + barW / 2} y={baseY + 12} textAnchor="middle" fill="#737373" fontSize="9" fontFamily="Inter, sans-serif">
                          {ph.label}
                        </text>
                      </g>
                    );
                  });
                })()}
              </svg>
              {potentialBarIndex != null && (
                <div className="potential-callout num">
                  <div className="subtle small">{potentialHorizons[potentialBarIndex].label} projection</div>
                  <div>
                    <strong>{maskUsd(balanceReveal, potentialHorizons[potentialBarIndex].projected)}</strong> total · return{" "}
                    <span className="positive">{maskUsd(balanceReveal, potentialHorizons[potentialBarIndex].returnPart)}</span>
                  </div>
                  <div className="subtle small">Based on ~7.2% annualized fantasy market drift. Not financial advice.</div>
                </div>
              )}
              <div className="subtle small potential-foot">
                Tap a bar for projected value. Green = estimated gains from today&apos;s equity.
              </div>
            </div>

            <div className="section-label">Holdings</div>
            <div className="breakdown-list">
              <div className="breakdown-item">
                <span className="subtle">Cash</span>
                <strong className="num">{maskUsd(balanceReveal, cash)}</strong>
              </div>
              <div className="breakdown-item">
                <span className="subtle">Positions</span>
                <strong className="num">{maskUsd(balanceReveal, holdingsValue)}</strong>
              </div>
              <div className="breakdown-item">
                <span className="subtle">Equity</span>
                <strong className="num">{maskUsd(balanceReveal, accountValue)}</strong>
              </div>
            </div>

            <div className="section-label">Total P&amp;L</div>
            <div className={`pnl-big num ${totalPnL >= 0 ? "up" : "down"}`}>
              {balanceReveal ? (
                <>
                  {totalPnL >= 0 ? "+" : ""}
                  {formatUsd(totalPnL)}
                </>
              ) : (
                "$****"
              )}
            </div>

            <div className="section-label">Trade history</div>
            {tradeHistory.length === 0 ? (
              <div className="empty-state">No trades yet.</div>
            ) : (
              tradeHistory.map((t, idx) => (
                <div className="history-item" key={idx}>
                  <strong>{maskTradeLine(balanceReveal, t)}</strong>
                  <span className="subtle small">
                    {new Date(t.createdAt).toLocaleString()}
                    {t.realized != null && balanceReveal ? ` · Realized ${formatUsd(t.realized)}` : ""}
                    {t.realized != null && !balanceReveal ? " · Realized $****" : ""}
                  </span>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {coinDetailId && detailCoin && (
        <div className="coin-detail">
          <div className="coin-detail-header">
            <button type="button" className="back-btn" onClick={() => setCoinDetailId(null)}>
              ←
            </button>
            <div className="coin-detail-title">
              <h1>{detailCoin.name}</h1>
              <div className="sym">{detailCoin.symbol}</div>
            </div>
            <img className="coin-photo" src={influencerPhotoUrl(detailCoin)} alt="" style={{ width: 40, height: 40 }} />
          </div>

          <div className="price-hero">
            <div className="price">{formatUsd(detailCoin.price)}</div>
            <div className={`chg ${detailCoin.change24h >= 0 ? "positive" : "negative"}`}>
              {detailCoin.change24h >= 0 ? "+" : ""}
              {detailCoin.change24h.toFixed(2)}% session
            </div>
          </div>

          <div className="tf-row">
            {["LIVE", "1H", "4H", "1D", "7D", "ALL"].map((tf) => (
              <button
                key={tf}
                type="button"
                className={`tf-chip ${chartTf === tf ? "active" : ""}`}
                onClick={() => setChartTf(tf)}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="chart-wrap">
            <CandlestickChart candles={candles} width={360} height={168} />
          </div>

          <div className="detail-tabs detail-tabs-scroll">
            {["holders", "feed", "about", "projection"].map((t) => (
              <button
                key={t}
                type="button"
                className={`detail-tab ${coinDetailTab === t ? "active" : ""}`}
                onClick={() => setCoinDetailTab(t)}
              >
                {t === "holders" ? "Holders" : t === "feed" ? "Feed" : t === "about" ? "About" : "Projection"}
              </button>
            ))}
          </div>

          <div className="detail-panel">
            {coinDetailTab === "holders" && (
              <>
                {(holdings[detailCoin.id] || 0) > 0 && (
                  <div className="holder-row" style={{ borderBottom: "2px solid #262626" }}>
                    <img className="coin-photo" src={`https://ui-avatars.com/api/?name=${displayName}&size=64&background=404040&color=fff`} alt="" style={{ width: 40, height: 40 }} />
                    <div>
                      <div style={{ fontWeight: 800 }}>{displayName} (you)</div>
                      <div className="subtle small">{(holdings[detailCoin.id] || 0).toFixed(2)} coins</div>
                    </div>
                    <div className={`holder-pnl ${(detailCoin.price - (avgCost[detailCoin.id] || detailCoin.price)) * (holdings[detailCoin.id] || 0) >= 0 ? "positive" : "negative"}`}>
                      {(() => {
                        const ac = avgCost[detailCoin.id] ?? detailCoin.price;
                        const pnl = (detailCoin.price - ac) * (holdings[detailCoin.id] || 0);
                        return `${pnl >= 0 ? "+" : ""}${formatUsd(pnl)}`;
                      })()}
                    </div>
                  </div>
                )}
                {syntheticHolders(detailCoin).map((h) => (
                  <div className="holder-row" key={h.handle}>
                    <div className="lb-avatar">{h.handle.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight: 800 }}>{h.handle}</div>
                      <div className="subtle small">{h.qty.toLocaleString()} coins</div>
                    </div>
                    <div className={`holder-pnl ${h.pnlPct >= 0 ? "positive" : "negative"}`}>
                      {h.pnlPct >= 0 ? "+" : ""}
                      {h.pnlPct.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </>
            )}

            {coinDetailTab === "feed" && (
              <>
                <div className="subtle small" style={{ marginBottom: 12 }}>
                  Thesis on {detailCoin.symbol} — holders only can post from the Feed tab.
                </div>
                {coinPosts.filter((p) => p.coinId === detailCoin.id).length === 0 ? (
                  <div className="empty-state">No thesis yet for this coin.</div>
                ) : (
                  coinPosts
                    .filter((p) => p.coinId === detailCoin.id)
                    .map((p) => {
                      const livePnL =
                        p.userId === currentUser
                          ? (detailCoin.price - (avgCost[detailCoin.id] ?? detailCoin.price)) *
                            (holdings[detailCoin.id] || 0)
                          : p.unrealizedPnL;
                      const qtyShow = p.userId === currentUser ? holdings[detailCoin.id] || p.qty : p.qty;
                      const up = livePnL >= 0;
                      return (
                        <div className="post-card" key={p.id}>
                          <div className="post-header">
                            <div className="post-user">{p.userLabel}</div>
                            <div className={`post-pnl ${up ? "up" : "down"}`}>
                              {up ? "+" : ""}
                              {formatUsd(livePnL)}
                            </div>
                          </div>
                          <div className="post-position">
                            {qtyShow.toFixed(2)} {detailCoin.symbol}
                          </div>
                          <div className="post-body">{p.text}</div>
                        </div>
                      );
                    })
                )}
              </>
            )}

            {coinDetailTab === "about" && (
              <>
                <p className="about-bio">{detailCoin.bio}</p>
                <div className="about-score">Clout Score · {detailCoin.cloutScore}</div>
                {["reach", "engagement", "growth", "sentiment", "activity"].map((key) => (
                  <div className="metric-bar" key={key}>
                    <label>
                      <span style={{ textTransform: "capitalize" }}>{key}</span>
                      <span>{detailCoin.metrics[key]}%</span>
                    </label>
                    <div className="bar">
                      <div className="fill" style={{ width: `${detailCoin.metrics[key]}%` }} />
                    </div>
                  </div>
                ))}
              </>
            )}

            {coinDetailTab === "projection" && coinProjectionPack.rows.length > 0 && (
              <div className="projection-panel">
                <p className="projection-explainer subtle small">
                  Model uses Clout Score and growth weighting to simulate drift (fantasy only).
                </p>
                {(() => {
                  const rows = coinProjectionPack.rows;
                  const dollars = coinProjectionPack.dollars;
                  const d30 = dollars.find((d) => d.days === 30);
                  return (
                    <>
                      <div className="projection-invest-label">
                        If you invest <strong className="num">$500</strong> today, in <strong>30 days</strong> you could have…
                      </div>
                      <div className="projection-outcomes num">
                        <div>
                          <span className="proj-tag opt">Optimistic</span> {formatUsd(d30?.opt ?? 0)}
                        </div>
                        <div>
                          <span className="proj-tag neu">Neutral</span> {formatUsd(d30?.neu ?? 0)}
                        </div>
                        <div>
                          <span className="proj-tag pess">Pessimistic</span> {formatUsd(d30?.pess ?? 0)}
                        </div>
                      </div>
                      <div className="projection-chart-wrap">
                        <svg className="projection-svg" viewBox="0 0 300 130" preserveAspectRatio="xMidYMid meet">
                          {(() => {
                            const all = rows.flatMap((r) => [r.opt, r.neu, r.pess]);
                            const maxPx = Math.max(...all) * 1.02;
                            const minPx = Math.min(...all) * 0.98;
                            const range = maxPx - minPx || 1;
                            const chartH = 86;
                            const baseY = 102;
                            const bw = 10;
                            const ggap = 36;
                            return rows.map((r, gi) => {
                              const xs = 20 + gi * (3 * bw + 2 * 4 + ggap);
                              const bars = [
                                { v: r.opt, fill: "#22C55E" },
                                { v: r.neu, fill: "#737373" },
                                { v: r.pess, fill: "#EF4444" },
                              ];
                              const els = bars.map((b, bi) => {
                                const bh = ((b.v - minPx) / range) * chartH;
                                const x = xs + bi * (bw + 4);
                                return (
                                  <rect
                                    key={`${gi}-${bi}`}
                                    x={x}
                                    y={baseY - bh}
                                    width={bw}
                                    height={Math.max(2, bh)}
                                    rx={1}
                                    fill={b.fill}
                                  />
                                );
                              });
                              return (
                                <g key={r.days}>
                                  {els}
                                  <text x={xs + (3 * bw + 8) / 2 - 8} y={baseY + 14} fill="#525252" fontSize="8" fontFamily="Inter, sans-serif">
                                    {r.days}d
                                  </text>
                                </g>
                              );
                            });
                          })()}
                        </svg>
                        <div className="projection-legend-row subtle small">
                          <span>
                            <span className="sq opt" /> Optimistic
                          </span>
                          <span>
                            <span className="sq neu" /> Neutral
                          </span>
                          <span>
                            <span className="sq pess" /> Pessimistic
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          <div className={`buy-bar buy-bar-split ${(holdings[detailCoin.id] || 0) <= 0 ? "buy-only" : ""}`}>
            <button
              type="button"
              className="btn-bar-buy"
              onClick={() => {
                setTradeSheetMode("buy");
                setAmount("10");
                setTradeSheetOpen(true);
              }}
            >
              Buy {detailCoin.symbol}
            </button>
            {(holdings[detailCoin.id] || 0) > 0 && (
              <button
                type="button"
                className="btn-bar-sell"
                onClick={() => {
                  setTradeSheetMode("sell");
                  const o = holdings[detailCoin.id] || 0;
                  setAmount(String(Math.min(Number(o.toFixed(4)), 10)));
                  setTradeSheetOpen(true);
                }}
              >
                Sell
              </button>
            )}
          </div>
        </div>
      )}

      {tradeSheetOpen && detailCoin && (
        <div className="sheet-overlay" role="presentation" onClick={() => setTradeSheetOpen(false)}>
          <div className="sheet" role="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{tradeSheetMode === "buy" ? `Buy ${detailCoin.symbol}` : `Sell ${detailCoin.symbol}`}</h3>
            <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (coins)" />
            <div className="subtle small sheet-meta">
              ≈ {Number(amount) > 0 ? formatUsd(Number(amount) * detailCoin.price) : "—"} notional
              {tradeSheetMode === "sell" && (
                <span className="num">
                  {" "}
                  · Max {(holdings[detailCoin.id] || 0).toFixed(4)} {detailCoin.symbol}
                </span>
              )}
            </div>
            {tradeSheetMode === "sell" && (
              <button
                type="button"
                className="icon-btn sheet-max"
                onClick={() => setAmount(String(holdings[detailCoin.id] || 0))}
              >
                Max
              </button>
            )}
            <div className={`sheet-actions ${tradeSheetMode === "sell" ? "sheet-sell-only" : ""}`}>
              {tradeSheetMode === "buy" ? (
                <button type="button" className="sheet-buy-cta" onClick={() => executeTrade("buy", detailCoin)}>
                  Buy
                </button>
              ) : (
                <button type="button" className="sheet-sell-cta" onClick={() => executeTrade("sell", detailCoin)}>
                  Sell
                </button>
              )}
            </div>
            <button type="button" className="icon-btn sheet-close-full" onClick={() => setTradeSheetOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {!coinDetailId && (
        <nav className="bottom-nav">
          {[
            { id: "home", label: "Home", ico: "⌂" },
            { id: "search", label: "Search", ico: "◎" },
            { id: "feed", label: "Feed", ico: "≡" },
            { id: "leaderboard", label: "Board", ico: "▤" },
            { id: "profile", label: "Profile", ico: "◉" },
          ].map((item) => (
            <button key={item.id} type="button" className={`nav-item ${navTab === item.id ? "active" : ""}`} onClick={() => setNavTab(item.id)}>
              <span className="nav-ico">{item.ico}</span>
              {item.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
