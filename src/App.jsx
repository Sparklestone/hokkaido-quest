import { useState, useEffect, useMemo, useRef, useCallback } from "react";

// ─── COPY BUTTON ───
const CopyBtn = ({ text, color }) => {
  const [copied, setCopied] = useState(false);
  const copy = (e) => { e.stopPropagation(); navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); };
  return (<button onClick={copy} title="Copy" style={{ background: copied ? `${color}30` : "rgba(255,255,255,0.06)", border: `1px solid ${copied ? color + "50" : "rgba(255,255,255,0.1)"}`, borderRadius: 6, padding: "2px 7px", cursor: "pointer", fontSize: 11, color: copied ? color : "rgba(255,255,255,0.5)", transition: "all 0.2s", verticalAlign: "middle", marginLeft: 4, lineHeight: 1, fontFamily: "'Zen Kaku Gothic New'" }}>{copied ? "✓" : "📋"}</button>);
};

// ─── SWIPEABLE GALLERY ───
const Gallery = ({ images, color }) => {
  const [idx, setIdx] = useState(0);
  const startX = useRef(0); const dragX = useRef(0);
  const [dragging, setDragging] = useState(false); const [offset, setOffset] = useState(0);
  const cnt = images?.length || 0;
  if (!cnt) return null;
  const next = () => setIdx(p => (p + 1) % cnt);
  const prev = () => setIdx(p => (p - 1 + cnt) % cnt);
  const onS = x => { startX.current = x; dragX.current = 0; setDragging(true); };
  const onM = x => { if (!dragging) return; dragX.current = x - startX.current; setOffset(dragX.current); };
  const onE = () => { setDragging(false); if (dragX.current < -40) next(); else if (dragX.current > 40) prev(); setOffset(0); };
  return (
    <div style={{ position: "relative", width: "100%", height: 200, borderRadius: 12, overflow: "hidden", marginBottom: 16, cursor: "grab", userSelect: "none" }}
      onMouseDown={e => onS(e.clientX)} onMouseMove={e => onM(e.clientX)} onMouseUp={onE} onMouseLeave={() => { if (dragging) onE(); }}
      onTouchStart={e => onS(e.touches[0].clientX)} onTouchMove={e => onM(e.touches[0].clientX)} onTouchEnd={onE}>
      <div style={{ display: "flex", width: `${cnt * 100}%`, transform: `translateX(calc(-${idx * (100 / cnt)}% + ${offset}px))`, transition: dragging ? "none" : "transform 0.35s cubic-bezier(0.22,1,0.36,1)", height: "100%" }}>
        {images.map((src, i) => (<div key={i} style={{ width: `${100 / cnt}%`, height: "100%", flexShrink: 0 }}><img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} loading="lazy" /></div>))}
      </div>
      {cnt > 1 && <><button onClick={e => { e.stopPropagation(); prev(); }} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 32, height: 32, color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
        <button onClick={e => { e.stopPropagation(); next(); }} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 32, height: 32, color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button></>}
      <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5, zIndex: 5 }}>
        {images.map((_, i) => (<div key={i} onClick={e => { e.stopPropagation(); setIdx(i); }} style={{ width: i === idx ? 20 : 7, height: 7, borderRadius: 4, background: i === idx ? color : "rgba(255,255,255,0.45)", transition: "all 0.3s", cursor: "pointer" }} />))}
      </div>
      <div style={{ position: "absolute", top: 8, right: 10, background: "rgba(0,0,0,0.55)", borderRadius: 12, padding: "3px 10px", fontFamily: "'Zen Kaku Gothic New'", fontSize: 12, color: "rgba(255,255,255,0.8)" }}>{idx + 1}/{cnt}</div>
    </div>
  );
};

// ─── LIVE PHOTO FETCHER ───
// Priority: 1) Google Places API (server-side, deployed) 2) Wikimedia Commons (client-side, works everywhere) 3) Unsplash fallback
const _photoCache = {};

async function fetchWikimediaPhotos(query, count = 4) {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=${count + 2}&gsrnamespace=6&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=600&format=json&origin=*`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.query?.pages) return null;
    const pages = Object.values(data.query.pages)
      .filter(p => p.imageinfo?.[0]?.thumburl && !p.imageinfo[0].thumburl.includes('.svg'))
      .sort((a, b) => (a.index || 99) - (b.index || 99))
      .slice(0, count);
    if (pages.length === 0) return null;
    return pages.map(p => p.imageinfo[0].thumburl);
  } catch { return null; }
}

const LiveGallery = ({ activity, color }) => {
  const [photos, setPhotos] = useState(activity.images);
  const [loading, setLoading] = useState(true);
  const tried = useRef(false);

  useEffect(() => {
    if (tried.current) return;
    tried.current = true;

    const key = activity.mapQuery;
    if (_photoCache[key]) { setPhotos(_photoCache[key]); setLoading(false); return; }

    const run = async () => {
      // 1) Try Google Places API (only works when deployed with API key)
      try {
        const r = await fetch(`/api/places-details?query=${encodeURIComponent(activity.name + ' ' + (activity.nameJp || '') + ' Hokkaido Japan')}`);
        if (r.ok) {
          const data = await r.json();
          if (data?.photoRefs?.length > 0) {
            const urls = data.photoRefs.slice(0, 5).map(ref => `/api/places-photo?ref=${encodeURIComponent(ref)}&w=600&h=400`);
            _photoCache[key] = urls;
            setPhotos(urls);
            setLoading(false);
            return;
          }
        }
      } catch {}

      // 2) Try Wikimedia Commons (works client-side, no API key needed)
      const searchTerms = [
        activity.nameJp + ' ' + activity.name,
        activity.name + ' Hokkaido',
        activity.name + ' Japan',
      ];
      for (const term of searchTerms) {
        const wikiPhotos = await fetchWikimediaPhotos(term);
        if (wikiPhotos && wikiPhotos.length >= 2) {
          _photoCache[key] = wikiPhotos;
          setPhotos(wikiPhotos);
          setLoading(false);
          return;
        }
      }

      // 3) Keep fallback Unsplash images
      setLoading(false);
    };
    run();
  }, [activity.mapQuery, activity.name, activity.nameJp]);

  return (
    <div style={{ position: "relative" }}>
      {loading && (
        <div style={{
          position: "absolute", top: 8, left: 8, zIndex: 10,
          background: "rgba(0,0,0,0.6)", borderRadius: 8, padding: "4px 12px",
          fontFamily: "'Zen Kaku Gothic New'", fontSize: 11, color: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(4px)", display: "flex", alignItems: "center", gap: 6,
        }}><span style={{ display: "inline-block", animation: "pulse 1s infinite" }}>📷</span> Finding real photos...</div>
      )}
      <Gallery images={photos} color={color} />
    </div>
  );
};

// ─── TILE ART ───
const TA = { eating: c => (<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="20" r="12" fill={c + "30"} /><path d="M16 22c0 0 2 8 8 8s8-8 8-8" stroke={c} strokeWidth="2" strokeLinecap="round" fill={c + "15"} /><path d="M18 18c1-4 4-6 6-6s5 2 6 6" stroke={c} strokeWidth="1.5" fill="none" /><line x1="24" y1="30" x2="24" y2="38" stroke={c} strokeWidth="2" strokeLinecap="round" /><circle cx="21" cy="20" r="1" fill={c} /><circle cx="27" cy="20" r="1" fill={c} /></svg>), drinking: c => (<svg viewBox="0 0 48 48" fill="none"><path d="M16 12h16l-3 20h-10l-3-20z" fill={c + "20"} stroke={c} strokeWidth="1.5" /><rect x="21" y="32" width="6" height="6" rx="1" fill={c + "30"} stroke={c} strokeWidth="1" /><line x1="18" y1="38" x2="30" y2="38" stroke={c} strokeWidth="2" strokeLinecap="round" /><ellipse cx="24" cy="16" rx="6" ry="2" fill={c + "40"} /></svg>), coffee: c => (<svg viewBox="0 0 48 48" fill="none"><path d="M12 20h20v14a4 4 0 01-4 4h-12a4 4 0 01-4-4v-14z" fill={c + "20"} stroke={c} strokeWidth="1.5" /><path d="M32 22h4a3 3 0 010 6h-4" stroke={c} strokeWidth="1.5" fill="none" /><ellipse cx="22" cy="20" rx="10" ry="2" fill={c + "30"} /><path d="M18 14c0-3 2-4 2-6M22 12c0-3 2-4 2-6M26 14c0-3 2-4 2-6" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" /></svg>), cultural: c => (<svg viewBox="0 0 48 48" fill="none"><path d="M24 8l-16 12h32l-16-12z" fill={c + "25"} stroke={c} strokeWidth="1.5" /><line x1="14" y1="20" x2="14" y2="36" stroke={c} strokeWidth="2" /><line x1="24" y1="20" x2="24" y2="36" stroke={c} strokeWidth="2" /><line x1="34" y1="20" x2="34" y2="36" stroke={c} strokeWidth="2" /><rect x="10" y="36" width="28" height="4" rx="1" fill={c + "20"} stroke={c} strokeWidth="1" /></svg>), historical: c => (<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="14" fill={c + "12"} stroke={c} strokeWidth="1.5" /><circle cx="24" cy="24" r="6" fill={c + "25"} stroke={c} strokeWidth="1" /><path d="M24 14v10l6 4" stroke={c} strokeWidth="2" strokeLinecap="round" /></svg>), adventure: c => (<svg viewBox="0 0 48 48" fill="none"><path d="M24 8l12 28H12l12-28z" fill={c + "20"} stroke={c} strokeWidth="1.5" strokeLinejoin="round" /><path d="M24 8l-6 14 6-4 6 4-6-14z" fill={c + "30"} /><circle cx="24" cy="16" r="2" fill={c} opacity="0.5" /><line x1="8" y1="36" x2="40" y2="36" stroke={c} strokeWidth="1.5" strokeLinecap="round" /></svg>), fun: c => (<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="22" r="14" fill={c + "15"} stroke={c} strokeWidth="1.5" /><circle cx="19" cy="19" r="2.5" fill={c} opacity="0.6" /><circle cx="29" cy="19" r="2.5" fill={c} opacity="0.6" /><path d="M18 27c2 4 8 4 12 0" stroke={c} strokeWidth="2" strokeLinecap="round" /></svg>), relaxing: c => (<svg viewBox="0 0 48 48" fill="none"><ellipse cx="24" cy="30" rx="16" ry="8" fill={c + "20"} stroke={c} strokeWidth="1.5" /><path d="M14 18c1-4 4-6 4-9M22 16c1-4 2-5 2-8M30 18c1-4 2-5 3-8" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.4" /><circle cx="20" cy="28" r="3" fill={c + "25"} /></svg>), shopping: c => (<svg viewBox="0 0 48 48" fill="none"><path d="M14 18l-4 18h28l-4-18H14z" fill={c + "15"} stroke={c} strokeWidth="1.5" strokeLinejoin="round" /><path d="M18 18v-4a6 6 0 0112 0v4" stroke={c} strokeWidth="1.5" fill="none" /><circle cx="24" cy="27" r="3" fill={c + "25"} stroke={c} strokeWidth="1" /></svg>), mustsee: c => (<svg viewBox="0 0 48 48" fill="none"><path d="M24 4l6 12 14 2-10 10 2 14-12-6-12 6 2-14L4 18l14-2 6-12z" fill={c + "25"} stroke={c} strokeWidth="1.5" strokeLinejoin="round" /><circle cx="24" cy="24" r="5" fill={c + "40"} /><path d="M22 24l2 2 4-4" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>), events: c => (<svg viewBox="0 0 48 48" fill="none"><rect x="10" y="12" width="28" height="26" rx="3" fill={c + "15"} stroke={c} strokeWidth="1.5" /><line x1="10" y1="20" x2="38" y2="20" stroke={c} strokeWidth="1.5" /><line x1="18" y1="8" x2="18" y2="16" stroke={c} strokeWidth="2" strokeLinecap="round" /><line x1="30" y1="8" x2="30" y2="16" stroke={c} strokeWidth="2" strokeLinecap="round" /><circle cx="24" cy="29" r="4" fill={c + "30"} stroke={c} strokeWidth="1" /></svg>) };

const MahjongTile = ({ cat, isActive, color, onClick }) => { const [h, setH] = useState(false); return (<button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ width: 78, height: 96, position: "relative", cursor: "pointer", border: "none", background: "transparent", padding: 0, transition: "transform 0.25s", transform: (h || isActive) ? "translateY(-4px)" : "translateY(0)", flexShrink: 0 }}><div style={{ position: "absolute", inset: 0, top: 4, borderRadius: 10, background: isActive ? color + "40" : "rgba(0,0,0,0.4)" }} /><div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 10, background: isActive ? `linear-gradient(145deg,${color}30,${color}12)` : "linear-gradient(145deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))", border: isActive ? `2px solid ${color}70` : "2px solid rgba(255,255,255,0.15)", boxShadow: isActive ? `0 0 16px ${color}25,inset 0 1px 0 rgba(255,255,255,0.15)` : "inset 0 1px 0 rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, padding: "4px", overflow: "hidden" }}><div style={{ position: "absolute", top: 4, left: 5, width: 3, height: 3, borderRadius: "50%", background: isActive ? color + "50" : "rgba(255,255,255,0.12)" }} /><div style={{ position: "absolute", top: 4, right: 5, width: 3, height: 3, borderRadius: "50%", background: isActive ? color + "50" : "rgba(255,255,255,0.12)" }} /><div style={{ width: 36, height: 36, flexShrink: 0 }}>{TA[cat.id]?.(isActive ? color : "rgba(255,255,255,0.5)")}</div><div style={{ fontFamily: "'Dela Gothic One'", fontSize: 9, color: isActive ? color : "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.1, whiteSpace: "nowrap" }}>{cat.label}</div><div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 7.5, color: isActive ? color + "aa" : "rgba(255,255,255,0.3)", letterSpacing: 0.5 }}>{cat.labelJp}</div></div></button>); };

const OptTile = ({ label, emoji, isActive, color, onClick }) => { const [h, setH] = useState(false); return (<button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ position: "relative", cursor: "pointer", border: "none", background: "transparent", padding: 0, transition: "transform 0.25s", transform: (h || isActive) ? "translateY(-3px)" : "translateY(0)", flexShrink: 0 }}><div style={{ position: "absolute", inset: 0, top: 3, borderRadius: 8, background: isActive ? color + "35" : "rgba(0,0,0,0.35)" }} /><div style={{ position: "relative", borderRadius: 8, padding: "8px 16px", background: isActive ? `linear-gradient(145deg,${color}25,${color}10)` : "linear-gradient(145deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))", border: isActive ? `1.5px solid ${color}60` : "1.5px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Dela Gothic One'", fontSize: 12, color: isActive ? color : "rgba(255,255,255,0.45)" }}><span style={{ fontSize: 15 }}>{emoji}</span> {label}</div></button>); };

// ─── LOCATION BAR ───
const LocationBar = ({ loc, color }) => {
  const [editing, setEditing] = useState(false);
  const [addr, setAddr] = useState("");
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const defaults = { rusutsu: "Rusutsu Resort, 13 Izumikawa, Rusutsu, Hokkaido 048-1711", niseko: "Hirafu Village, Kutchan, Hokkaido 044-0080", sapporo: "Sapporo Station, Kita 6 Jonishi, Kita-ku, Sapporo 060-0806" };
  const current = addr || defaults[loc] || "";

  const findMe = () => {
    if (!navigator.geolocation) {
      setLocError("Geolocation not supported");
      setTimeout(() => setLocError(""), 3000);
      return;
    }
    setLocating(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Try reverse geocode through our API
        fetch(`/api/places-details?query=${latitude},${longitude}`)
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data?.address) {
              setAddr(data.address);
            } else {
              // Fallback: show raw coordinates
              setAddr(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
            }
          })
          .catch(() => {
            setAddr(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          })
          .finally(() => setLocating(false));
      },
      (err) => {
        setLocating(false);
        const msgs = { 1: "Location access denied — check your browser settings", 2: "Position unavailable — try again", 3: "Request timed out — try again" };
        setLocError(msgs[err.code] || "Could not get location");
        setTimeout(() => setLocError(""), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", padding: "12px 16px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 16 }}>📍</span>
        {editing ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input value={addr} onChange={e => setAddr(e.target.value)} placeholder="Search address, hotel, restaurant..." style={{ flex: 1, background: "rgba(255,255,255,0.08)", border: `1px solid ${color}40`, borderRadius: 8, padding: "8px 12px", color: "#fff", fontFamily: "'Zen Kaku Gothic New'", fontSize: 14, outline: "none" }} autoFocus />
              <button onClick={() => setEditing(false)} style={{ background: `${color}25`, border: `1px solid ${color}50`, borderRadius: 8, padding: "6px 14px", color: color, cursor: "pointer", fontFamily: "'Dela Gothic One'", fontSize: 12, whiteSpace: "nowrap" }}>Set</button>
            </div>
            <button onClick={findMe} disabled={locating} style={{
              background: locating ? `${color}15` : "rgba(255,255,255,0.06)",
              border: `1px solid ${locating ? color + "40" : "rgba(255,255,255,0.12)"}`,
              borderRadius: 8, padding: "8px 14px", cursor: locating ? "wait" : "pointer",
              fontFamily: "'Dela Gothic One'", fontSize: 12,
              color: locating ? color : "rgba(255,255,255,0.55)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "all 0.2s", width: "100%",
            }}>
              {locating ? (
                <><span style={{ display: "inline-block", animation: "pulse 1s infinite" }}>📡</span> Finding your location...</>
              ) : (
                <>🧭 Use My Location</>
              )}
            </button>
          </div>
        ) : (
          <>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: 1, marginBottom: 2 }}>YOUR LOCATION</div>
              <div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{current}<CopyBtn text={current} color={color} /></div>
            </div>
            <button onClick={() => setEditing(true)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "5px 12px", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontFamily: "'Zen Kaku Gothic New'", fontSize: 12 }}>✏️ Edit</button>
          </>
        )}
      </div>
      {locError && (
        <div style={{ marginTop: 8, fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: "#ff6b6b", background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.2)", borderRadius: 8, padding: "6px 12px" }}>
          ⚠️ {locError}
        </div>
      )}
    </div>
  );
};

// Travel multiplier: walking = 4x car, bus = 1.5x car
const travelMult = (mode) => mode === "walking" ? 4 : mode === "bus" ? 1.5 : 1;

// ─── DATA ───
const LOCATIONS = {
  rusutsu: { name: "Rusutsu", nameJp: "ルスツ", color: "#4ECDC4", accent: "#1A535C", bg: "linear-gradient(135deg,#0f2027 0%,#203a43 50%,#2c5364 100%)", info: "Rusutsu is Hokkaido's best-kept secret — a massive resort with virtually no lift lines, surrounded by pristine volcanic landscapes. Unlike international Niseko or urban Sapporo, Rusutsu offers a deeply Japanese ski experience. Its proximity to Lake Toya and Noboribetsu makes it a gateway to dramatic natural scenery." },
  niseko: { name: "Niseko", nameJp: "ニセコ", color: "#FF6B6B", accent: "#C73E3E", bg: "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)", info: "Niseko is Japan's most famous international ski destination, legendary for impossibly light powder and the iconic Mt. Yotei backdrop. Vibrant après-ski culture — craft breweries, whisky bars, farm-to-table dining. The most versatile base for non-skiers with dog sledding, snowshoeing, and glassblowing." },
  sapporo: { name: "Sapporo", nameJp: "札幌", color: "#FFE66D", accent: "#F4A261", bg: "linear-gradient(135deg,#0c0c1d 0%,#1a1a3e 50%,#2d1b69 100%)", info: "Sapporo is Hokkaido's capital — a proper metropolis with world-class food, nightlife, and culture. Famous for miso ramen, Genghis Khan BBQ, the Snow Festival, and Sapporo beer. Depth you can't find in resort towns: Ainu museums, Noguchi sculpture parks, hidden coffee shops, and Japan's best bar district." },
};

const CATEGORIES = [
  { id: "mustsee", label: "Must See", emoji: "⭐", labelJp: "必見" },
  { id: "eating", label: "Eating", emoji: "🍜", labelJp: "食事" },
  { id: "drinking", label: "Drinking", emoji: "🍶", labelJp: "飲む" },
  { id: "coffee", label: "Coffee", emoji: "☕", labelJp: "珈琲" },
  { id: "cultural", label: "Cultural", emoji: "⛩️", labelJp: "文化" },
  { id: "historical", label: "Historical", emoji: "🏯", labelJp: "歴史" },
  { id: "adventure", label: "Adventure", emoji: "🎿", labelJp: "冒険" },
  { id: "fun", label: "Fun", emoji: "🎮", labelJp: "楽しい" },
  { id: "relaxing", label: "Relaxing", emoji: "♨️", labelJp: "癒し" },
  { id: "shopping", label: "Shopping", emoji: "🛍️", labelJp: "買物" },
  { id: "events", label: "Events", emoji: "🎪", labelJp: "催事" },
];

const _p={lake:["photo-1528164344705-47542687000d","photo-1506905925346-21bda4d32df4","photo-1473448912268-2022ce9509d8"],mtn:["photo-1464822759023-fed622ff2c3b","photo-1483728642387-6c3bdd6c93e5","photo-1519681393784-d120267933ba"],volcano:["photo-1462332420958-a05d1e002413","photo-1464822759023-fed622ff2c3b","photo-1486870591958-9b9d0d1dda99"],onsen:["photo-1545569341-9eb8b30979d9","photo-1584132967334-10e028bd69f7","photo-1540979388789-6cee28a1cdc9"],food:["photo-1504674900247-0877df9cc836","photo-1567620905732-2d1ec7ab7445","photo-1551218808-94e220e084d2"],ramen:["photo-1569718212165-3a8278d5f624","photo-1557872943-16a5ac26437e","photo-1617093727343-374698b1b08d"],sushi:["photo-1579871494447-9811cf80d66c","photo-1553621042-f6e147245754","photo-1580822184713-fc5400e7fe10"],bbq:["photo-1504674900247-0877df9cc836","photo-1546069901-ba9599a7e63c","photo-1567620905732-2d1ec7ab7445"],bar:["photo-1514933651103-005eec06c04b","photo-1436076863939-06870fe779c2","photo-1569529465841-dfecdab7503b"],beer:["photo-1535958636474-b021ee887b13","photo-1532634993-15f421e42ec0","photo-1558642452-9d2a7deb7f62"],whisky:["photo-1527281400683-1aae777175f8","photo-1569529465841-dfecdab7503b","photo-1514933651103-005eec06c04b"],coffee:["photo-1509042239860-f550ce710b93","photo-1495474472287-4d71bcdd2085","photo-1442512595331-e89e73853f31"],cafe:["photo-1445116572660-236099ec97a0","photo-1497935586351-b67a49e012bf","photo-1501339847302-ac426a4a7cbb"],temple:["photo-1478436127897-769e1b3f0f36","photo-1480796927426-f609979314bd","photo-1524413840807-0c3cb6fa808d"],shrine:["photo-1478436127897-769e1b3f0f36","photo-1480796927426-f609979314bd","photo-1545569341-9eb8b30979d9"],snow:["photo-1517783999520-f068d7431571","photo-1491002052546-bf38f186af56","photo-1478131143081-80f7f84ca84d"],dog:["photo-1605568427561-40dd23c2acea","photo-1548199973-03cce0bbc87b","photo-1517849845537-4d257902454a"],city:["photo-1542051841857-5f90071e7989","photo-1528360983277-13d401cdc186","photo-1540959733332-eab4deabeeaf"],market:["photo-1580822184713-fc5400e7fe10","photo-1553621042-f6e147245754","photo-1579871494447-9811cf80d66c"],park:["photo-1506905925346-21bda4d32df4","photo-1513635269975-59663e0ac1ad","photo-1470071459604-3b5ec3a7fe05"],art:["photo-1576511468792-5c9b54e7e4e7","photo-1459411552884-841db9b3cc2a","photo-1513364776144-60967b0f800f"],fireworks:["photo-1498931299472-f7a63a5a1cfa","photo-1533174072545-7a4b6ad7a6c3","photo-1467810563316-b5476525c0f9"],night:["photo-1533174072545-7a4b6ad7a6c3","photo-1519671482749-fd09be7ccebf","photo-1554797589-7241bb691973"],choco:["photo-1481391319762-47dff72954d9","photo-1549007994-cb92caebd54b","photo-1486427944544-d2c246c4df4d"],bear:["photo-1530595467537-0b5996c41f2d","photo-1474511320723-9a56873571b7","photo-1551918120-9739cb430c6d"],glass:["photo-1576511468792-5c9b54e7e4e7","photo-1459411552884-841db9b3cc2a","photo-1513364776144-60967b0f800f"],shop:["photo-1542051841857-5f90071e7989","photo-1528360983277-13d401cdc186","photo-1540959733332-eab4deabeeaf"],history:["photo-1480796927426-f609979314bd","photo-1528360983277-13d401cdc186","photo-1524413840807-0c3cb6fa808d"],farm:["photo-1559598467-f8b76c8155d0","photo-1486297678162-eb2a19b0a32d","photo-1550583724-b2692b85b150"],ice:["photo-1551538827-9c037cb4f32a","photo-1470338745628-171cf53de3a8","photo-1477601263568-180e2c6d046e"],adventure:["photo-1517783999520-f068d7431571","photo-1491002052546-bf38f186af56","photo-1478131143081-80f7f84ca84d"],spa:["photo-1600585154340-be6161a56a0c","photo-1540979388789-6cee28a1cdc9","photo-1584132967334-10e028bd69f7"],wine:["photo-1514933651103-005eec06c04b","photo-1436076863939-06870fe779c2","photo-1569529465841-dfecdab7503b"],museum:["photo-1480796927426-f609979314bd","photo-1513635269975-59663e0ac1ad","photo-1528360983277-13d401cdc186"]};
const img = (key) => (_p[key]||_p.city).map(id=>`https://images.unsplash.com/${id}?w=600&h=400&fit=crop`);

const DA = {
  rusutsu: [
    // MUST SEE
    {name:"Lake Toya",nameJp:"洞爺湖",cat:"mustsee",travelMin:30,activityMin:60,rating:4.9,pop:true,desc:"One of Japan's most beautiful caldera lakes with volcanic geopark, sculpture trail, and steaming Mt. Usu views.",mapQuery:"Lake+Toya+Hokkaido",cost:"Free",tip:"The lakeside sculpture walk is world-class and almost nobody knows about it.",openH:7,closeH:17,images:img("lake")},
    {name:"Usuzan Ropeway",nameJp:"有珠山ロープウェイ",cat:"mustsee",travelMin:35,activityMin:75,rating:4.6,pop:true,desc:"Cable car up active volcano Mt. Usu with panoramic crater views and summit walking trails.",mapQuery:"Usuzan+Ropeway",cost:"¥¥",tip:"The summit trail overlooks the 2000 eruption crater — absolutely surreal.",openH:8,closeH:17,images:img("volcano")},
    {name:"Noboribetsu Jigokudani",nameJp:"登別地獄谷",cat:"mustsee",travelMin:45,activityMin:45,rating:4.7,pop:true,desc:"Hell Valley — a volcanic crater with steaming vents, boiling streams, and sulfurous landscapes.",mapQuery:"Noboribetsu+Jigokudani",cost:"Free",tip:"The boardwalk at dawn is otherworldly — mist and steam everywhere.",openH:7,closeH:18,images:img("volcano")},
    // EATING
    {name:"Michi no Eki Rusutsu",nameJp:"道の駅ルスツ",cat:"eating",travelMin:10,activityMin:45,rating:4.3,desc:"Roadside rest stop with Rusutsu pork, local vegetables, and famous soft-serve.",mapQuery:"Michi+no+Eki+230+Rusutsu",cost:"¥",tip:"The soft-serve ice cream with local milk is legendary.",openH:9,closeH:17,images:img("food")},
    {name:"Kimobetsu Tofu Shop",nameJp:"喜茂別豆腐店",cat:"eating",travelMin:20,activityMin:30,rating:4.5,desc:"Tiny roadside tofu shop using mountain spring water. The yudofu set is perfection.",mapQuery:"Kimobetsu+Tofu+Hokkaido",cost:"¥",tip:"Get the soy milk doughnuts to go — they sell out by noon.",openH:8,closeH:15,images:img("food")},
    {name:"Toya Sobadokoro",nameJp:"洞爺そば処",cat:"eating",travelMin:30,activityMin:40,rating:4.4,desc:"Handmade buckwheat soba noodles with lake views. The tempura soba set is excellent.",mapQuery:"Toya+Soba+Restaurant",cost:"¥",tip:"Winter soba here uses new-harvest buckwheat — nuttier and more fragrant.",openH:11,closeH:15,images:img("food")},
    {name:"Rusutsu Lamb BBQ",nameJp:"ルスツジンギスカン",cat:"eating",travelMin:5,activityMin:50,rating:4.3,desc:"Resort Genghis Khan BBQ with premium Hokkaido lamb grilled on a dome.",mapQuery:"Rusutsu+Resort+BBQ",cost:"¥¥",tip:"The lamb here is so fresh it barely needs seasoning.",openH:17,closeH:22,images:img("bbq")},
    // DRINKING
    {name:"Izakaya Night",nameJp:"居酒屋ナイト",cat:"drinking",travelMin:5,activityMin:60,rating:4.2,desc:"Cozy resort izakaya with local craft beers, hot sake, and Hokkaido whisky.",mapQuery:"Rusutsu+Resort+Restaurant",cost:"¥¥",tip:"Ask for seasonal nigori sake — incredible unfiltered styles.",openH:17,closeH:23,images:img("bar")},
    {name:"Toya Wine Bar",nameJp:"洞爺ワインバー",cat:"drinking",travelMin:30,activityMin:60,rating:4.3,desc:"Lakeside wine bar serving Hokkaido wines from the Yoichi and余市 regions.",mapQuery:"Lake+Toya+Wine+Bar",cost:"¥¥",tip:"Hokkaido pinot noir is gaining international recognition — try a local flight.",openH:16,closeH:22,images:img("wine")},
    {name:"Noboribetsu Craft Beer",nameJp:"鬼ビール",cat:"drinking",travelMin:45,activityMin:60,rating:4.4,desc:"Oni (demon) themed brewery in the hot springs town. Unique volcanic-water brewed ales.",mapQuery:"Noboribetsu+Craft+Beer",cost:"¥¥",tip:"The 'Hell Fire IPA' is their signature — surprisingly balanced for the name.",openH:11,closeH:20,images:img("beer")},
    // COFFEE
    {name:"Toya Lakeside Café",nameJp:"洞爺カフェ",cat:"coffee",travelMin:30,activityMin:45,rating:4.4,desc:"Hand-drip coffee and pastries with mesmerizing winter lake views.",mapQuery:"Lake+Toya+Cafe",cost:"¥",tip:"Steam rising off the volcanic lake in winter is hypnotic from the window seat.",openH:9,closeH:17,images:img("coffee")},
    {name:"Rusutsu Resort Café",nameJp:"リゾートカフェ",cat:"coffee",travelMin:5,activityMin:30,rating:4.1,desc:"Freshly roasted beans and Hokkaido milk lattes in the resort lobby.",mapQuery:"Rusutsu+Resort+Cafe",cost:"¥",tip:"Their hot chocolate with local cream is the ultimate après-ski drink.",openH:7,closeH:20,images:img("coffee")},
    {name:"Makkari Coffee Stand",nameJp:"真狩コーヒー",cat:"coffee",travelMin:25,activityMin:30,rating:4.3,desc:"Minimalist roadside coffee stand with Mt. Yotei views and single-origin pour-over.",mapQuery:"Makkari+Coffee+Hokkaido",cost:"¥",tip:"On clear days, the Yotei view from here is the best photo op in the region.",openH:9,closeH:16,images:img("coffee")},
    // CULTURAL
    {name:"Toya Sculpture Park",nameJp:"洞爺彫刻公園",cat:"cultural",travelMin:30,activityMin:45,rating:4.5,desc:"58 sculptures around the lake perimeter by international artists. A hidden art gem.",mapQuery:"Lake+Toya+Sculpture+Park",cost:"Free",tip:"Pick up the sculpture map from the visitor center — many are tucked behind trees.",openH:7,closeH:17,images:img("park")},
    {name:"Ainu Museum Shiraoi",nameJp:"ウポポイ",cat:"cultural",travelMin:50,activityMin:90,rating:4.7,pop:true,desc:"National Ainu Museum 'Upopoy' — Japan's premier indigenous culture center. Modern, moving, essential.",mapQuery:"Upopoy+Ainu+Museum+Shiraoi",cost:"¥¥",tip:"The traditional dance performance schedule is posted at the entrance — plan around it.",openH:9,closeH:17,images:img("history")},
    {name:"Kimobetsu Art Studio",nameJp:"喜茂別アートスタジオ",cat:"cultural",travelMin:20,activityMin:45,rating:4.1,desc:"Small artist-run studio offering pottery and woodcarving workshops.",mapQuery:"Kimobetsu+Art+Studio",cost:"¥¥",tip:"The potter uses local volcanic clay — your piece will be uniquely Hokkaido.",openH:10,closeH:16,images:img("art")},
    // HISTORICAL
    {name:"Date Jidaimura",nameJp:"伊達時代村",cat:"historical",travelMin:45,activityMin:120,rating:4.2,desc:"Edo-period ninja village with live martial arts shows, costumes, and ninja maze.",mapQuery:"Noboribetsu+Date+Jidaimura",cost:"¥¥",tip:"The ninja show is genuinely impressive — real stunts.",openH:9,closeH:17,images:img("history")},
    {name:"Toyako Visitor Center",nameJp:"洞爺湖ビジターセンター",cat:"historical",travelMin:30,activityMin:40,rating:4.3,desc:"Interactive museum covering Mt. Usu's eruption history with preserved damage sites.",mapQuery:"Toyako+Visitor+Center",cost:"¥",tip:"The preserved buried houses from the 2000 eruption are haunting and incredible.",openH:9,closeH:17,images:img("museum")},
    {name:"Rusutsu Village Shrine",nameJp:"ルスツ神社",cat:"historical",travelMin:10,activityMin:20,rating:4.0,desc:"Small local shrine with deep snow surrounding the torii. A moment of winter stillness.",mapQuery:"Rusutsu+Shrine+Hokkaido",cost:"Free",tip:"The snow-buried stone lanterns create an atmosphere you won't find at famous shrines.",openH:6,closeH:18,images:img("shrine")},
    // ADVENTURE
    {name:"Snowmobile Tour",nameJp:"スノーモービル",cat:"adventure",travelMin:10,activityMin:90,rating:4.7,pop:true,desc:"Guided snowmobile rides through pristine Hokkaido backcountry powder fields.",mapQuery:"Rusutsu+Snowmobile+Tour",cost:"¥¥¥",tip:"Book the longer course — scenery gets dramatically better further out.",openH:8,closeH:16,images:img("snow")},
    {name:"Fat Bike Snow Tour",nameJp:"ファットバイク",cat:"adventure",travelMin:10,activityMin:75,rating:4.4,desc:"Ride oversized-tire bikes through snowy forest trails. Surprisingly stable and exhilarating.",mapQuery:"Rusutsu+Fat+Bike+Tour",cost:"¥¥",tip:"The guide knows trails that feel like riding through Narnia.",openH:9,closeH:15,images:img("adventure")},
    {name:"Ice Fishing Experience",nameJp:"氷上ワカサギ釣り",cat:"adventure",travelMin:35,activityMin:90,rating:4.5,desc:"Fish for smelt (wakasagi) through a hole in frozen Lake Toya. They fry your catch on the spot.",mapQuery:"Lake+Toya+Ice+Fishing",cost:"¥¥",tip:"Nothing tastes better than tempura fish you caught five minutes ago.",openH:7,closeH:14,images:img("ice")},
    // FUN
    {name:"Bear Park + Onsen",nameJp:"熊牧場",cat:"fun",travelMin:40,activityMin:90,rating:4.4,desc:"Feed Hokkaido brown bears from an observation deck, plus famous Noboribetsu hot springs.",mapQuery:"Noboribetsu+Bear+Park",cost:"¥¥",tip:"The bears catch food mid-air — sit front row.",openH:8,closeH:17,images:img("bear")},
    {name:"Rusutsu Indoor Park",nameJp:"ルスツ遊園地",cat:"fun",travelMin:5,activityMin:90,rating:4.1,desc:"Indoor wave pool, carousel, and games inside the resort.",mapQuery:"Rusutsu+Resort+Amusement",cost:"¥¥",tip:"The wave pool is surprisingly fun and almost never crowded in ski season.",openH:10,closeH:21,images:img("city")},
    {name:"Snow Tubing Hill",nameJp:"スノーチュービング",cat:"fun",travelMin:5,activityMin:45,rating:4.3,desc:"Giant tubing hill at the resort — simple, hilarious, and no skill required.",mapQuery:"Rusutsu+Snow+Tubing",cost:"¥",tip:"Go at night when they light it up — feels like a different experience entirely.",openH:9,closeH:20,images:img("snow")},
    // RELAXING
    {name:"Rusutsu Onsen",nameJp:"ルスツ温泉",cat:"relaxing",travelMin:5,activityMin:60,rating:4.6,pop:true,desc:"Natural hot spring baths with indoor and outdoor pools overlooking snow-covered mountains.",mapQuery:"Rusutsu+Resort+Onsen",cost:"¥",tip:"Go right when lifts open — you'll have it nearly to yourself.",openH:6,closeH:22,images:img("onsen")},
    {name:"Noboribetsu Grand Onsen",nameJp:"登別グランドホテル",cat:"relaxing",travelMin:45,activityMin:90,rating:4.6,desc:"Day-use onsen at a grand hotel with Roman-style baths, waterfalls, and volcanic mineral water.",mapQuery:"Noboribetsu+Grand+Hotel+Onsen",cost:"¥¥",tip:"The waterfall bath is theatrical and therapeutic at the same time.",openH:8,closeH:21,images:img("spa")},
    {name:"Toya Sun Palace Day Spa",nameJp:"洞爺サンパレス",cat:"relaxing",travelMin:30,activityMin:75,rating:4.4,desc:"Lakeside resort with infinity-style baths overlooking Lake Toya. Day-use available.",mapQuery:"Toya+Sun+Palace+Onsen",cost:"¥¥",tip:"The outdoor infinity bath feels like soaking in the lake itself.",openH:10,closeH:20,images:img("onsen")},
    // SHOPPING
    {name:"Michi no Eki Gift Shop",nameJp:"道の駅おみやげ",cat:"shopping",travelMin:10,activityMin:30,rating:4.2,desc:"Hokkaido specialties — Shiroi Koibito, Royce chocolate, dried scallops, local crafts.",mapQuery:"Michi+no+Eki+230+Rusutsu",cost:"Varies",tip:"The melon jelly sets are a top-tier omiyage that nobody expects.",openH:9,closeH:17,images:img("shop")},
    {name:"Toya Glass Art",nameJp:"洞爺ガラス館",cat:"shopping",travelMin:30,activityMin:40,rating:4.3,desc:"Beautiful glassware gallery with items made using volcanic sand from the region.",mapQuery:"Lake+Toya+Glass+Art",cost:"Varies",tip:"The volcanic glass bowls are unique to this area — nowhere else in Japan.",openH:9,closeH:17,images:img("glass")},
    {name:"Rusutsu Resort Shop",nameJp:"リゾートショップ",cat:"shopping",travelMin:5,activityMin:30,rating:4.0,desc:"Resort gift shop with ski gear, Hokkaido snacks, and local artisan goods.",mapQuery:"Rusutsu+Resort+Shop",cost:"Varies",tip:"They carry limited Hokkaido-only Kit Kat flavors you can't get in cities.",openH:8,closeH:21,images:img("shop")},
    // EVENTS
    {name:"Toya Winter Fireworks",nameJp:"洞爺冬花火",cat:"events",travelMin:30,activityMin:30,rating:4.7,desc:"Seasonal fireworks over Lake Toya on winter evenings.",mapQuery:"Lake+Toya+Fireworks",cost:"Free",tip:"The reflection on the lake doubles the show. Check dates — select weekends.",openH:18,closeH:21,eventWindow:"Dec–Mar weekends",images:img("fireworks")},
    {name:"Rusutsu Night Entertainment",nameJp:"ナイトエンターテイメント",cat:"events",travelMin:5,activityMin:60,rating:4.1,desc:"Resort evening shows including taiko drumming, dance performances, and seasonal events.",mapQuery:"Rusutsu+Resort+Entertainment",cost:"¥",tip:"The taiko performance is powerful — the drummers are surprisingly skilled.",openH:19,closeH:21,eventWindow:"Nightly Dec–Mar",images:img("night")},
    {name:"Noboribetsu Oni Festival",nameJp:"登別鬼祭り",cat:"events",travelMin:45,activityMin:60,rating:4.5,desc:"Seasonal demon-themed celebrations in the hot springs town with parades and performances.",mapQuery:"Noboribetsu+Oni+Festival",cost:"Free",tip:"The demon dancers in the steam of Hell Valley at night are genuinely spine-tingling.",openH:17,closeH:21,eventWindow:"Select winter dates",images:img("fireworks")},
  ],
  niseko: [
    {name:"Dog Sledding",nameJp:"犬ぞり体験",cat:"mustsee",travelMin:25,activityMin:90,rating:4.8,pop:true,desc:"Mush Alaskan huskies through powder fields with Mt. Yotei backdrop.",mapQuery:"Niseko+Dog+Sledding",cost:"¥¥¥",tip:"You get cuddle time before and after the run.",openH:8,closeH:15,images:img("dog")},
    {name:"Yukoro Onsen",nameJp:"雪秩父温泉",cat:"mustsee",travelMin:15,activityMin:60,rating:4.8,pop:true,desc:"Rustic outdoor hot springs in birch forest. Multiple pools at different temperatures.",mapQuery:"Yukoro+Onsen+Niseko",cost:"¥",tip:"The rotenburo during snowfall is a core Japan memory.",openH:7,closeH:21,images:img("onsen")},
    {name:"Mt. Yotei Viewpoint",nameJp:"羊蹄山ビュー",cat:"mustsee",travelMin:15,activityMin:20,rating:4.7,desc:"Multiple viewpoints of Hokkaido's 'mini Fuji'. Best at sunrise or sunset.",mapQuery:"Mt+Yotei+Viewpoint+Niseko",cost:"Free",tip:"The Makkari viewpoint is the most photogenic — fewer crowds than the roadside ones.",openH:6,closeH:18,images:img("mtn")},
    {name:"Takahashi Dairy",nameJp:"高橋牧場",cat:"eating",travelMin:10,activityMin:40,rating:4.7,pop:true,desc:"Farm-fresh milk, cheese, and legendary milk puffs. Mt. Yotei views.",mapQuery:"Takahashi+Dairy+Farm+Niseko",cost:"¥",tip:"Get two milk puffs — you'll wish you had.",openH:9,closeH:18,images:img("farm")},
    {name:"Miso Ramen Hirafu",nameJp:"味噌ラーメン",cat:"eating",travelMin:10,activityMin:40,rating:4.4,desc:"Rich Hokkaido miso ramen with butter and corn.",mapQuery:"Ramen+Niseko+Hirafu",cost:"¥",tip:"Add extra chashu — Hokkaido pork is on another level.",openH:11,closeH:22,images:img("ramen")},
    {name:"Niseko Pizza",nameJp:"ニセコピッツァ",cat:"eating",travelMin:10,activityMin:45,rating:4.5,desc:"Wood-fired pizza using local Hokkaido cheese and seasonal toppings.",mapQuery:"Niseko+Pizza+Hirafu",cost:"¥¥",tip:"The four-cheese with Hokkaido mozzarella is insanely good.",openH:11,closeH:21,images:img("food")},
    {name:"Sushi Shin Niseko",nameJp:"鮨しん",cat:"eating",travelMin:10,activityMin:50,rating:4.6,desc:"Intimate sushi counter with fish sourced daily from Otaru port.",mapQuery:"Sushi+Shin+Niseko",cost:"¥¥¥",tip:"Sit at the counter and let the chef choose — omakase here is exceptional value.",openH:17,closeH:22,images:img("sushi")},
    {name:"Craft Beer District",nameJp:"ニセコビール",cat:"drinking",travelMin:10,activityMin:75,rating:4.5,desc:"Microbreweries and bars in Hirafu pouring local Hokkaido craft ales.",mapQuery:"Niseko+Taproom+Hirafu",cost:"¥¥",tip:"Niseko Brewing's smoked porter is incredible after a cold day.",openH:15,closeH:23,images:img("beer")},
    {name:"Niseko Spirit Bar",nameJp:"ニセコスピリッツ",cat:"drinking",travelMin:5,activityMin:60,rating:4.4,desc:"200+ Japanese spirits including rare Hokkaido whisky and shochu.",mapQuery:"Bar+Gyu+Niseko+Hirafu",cost:"¥¥",tip:"Ask for a Hokkaido-only whisky flight — distilleries most tourists never hear about.",openH:17,closeH:24,images:img("whisky")},
    {name:"Wild Bill's Bar",nameJp:"ワイルドビルズ",cat:"drinking",travelMin:5,activityMin:60,rating:4.3,desc:"Legendary Niseko après-ski bar. Live music, dancing, and international crowd.",mapQuery:"Wild+Bills+Niseko",cost:"¥¥",tip:"Thursday nights are the best for live music — gets packed by 10PM.",openH:16,closeH:24,images:img("bar")},
    {name:"Sprout Café",nameJp:"スプラウトカフェ",cat:"coffee",travelMin:8,activityMin:35,rating:4.6,desc:"Specialty pour-over in a warm, wood-lined cabin. Single-origin beans roasted locally.",mapQuery:"Sprout+Cafe+Niseko",cost:"¥",tip:"Their flat white with Niseko milk is ridiculous.",openH:8,closeH:17,images:img("coffee")},
    {name:"Gloorious Coffee",nameJp:"グロリアス",cat:"coffee",travelMin:5,activityMin:30,rating:4.5,desc:"Australian-style café popular with the international ski crowd. Great matcha latte.",mapQuery:"Gloorious+Coffee+Niseko",cost:"¥",tip:"The banana bread sells out by 11 AM.",openH:7,closeH:16,images:img("cafe")},
    {name:"Green Farm Café",nameJp:"グリーンファーム",cat:"coffee",travelMin:12,activityMin:35,rating:4.4,desc:"Organic café on a working farm. Seasonal drinks with farm-grown herbs.",mapQuery:"Green+Farm+Cafe+Niseko",cost:"¥",tip:"The lavender latte in winter is unexpectedly perfect.",openH:9,closeH:17,images:img("cafe")},
    {name:"Glass Studio",nameJp:"硝子工房",cat:"cultural",travelMin:20,activityMin:60,rating:4.3,desc:"Blow your own glass ornament or cup. They ship worldwide.",mapQuery:"Glass+Studio+Niseko",cost:"¥¥",tip:"Makes a meaningful souvenir you actually made yourself.",openH:9,closeH:17,images:img("glass")},
    {name:"Niseko Art Gallery",nameJp:"ニセコアートギャラリー",cat:"cultural",travelMin:10,activityMin:30,rating:4.2,desc:"Rotating exhibitions from Hokkaido and international artists in a converted barn.",mapQuery:"Niseko+Art+Gallery",cost:"Free",tip:"The photography exhibitions of Hokkaido winters are breathtaking.",openH:10,closeH:18,images:img("art")},
    {name:"Kimono Experience",nameJp:"着物体験",cat:"cultural",travelMin:10,activityMin:60,rating:4.4,desc:"Dress in traditional winter kimono and walk through the snow-covered village.",mapQuery:"Niseko+Kimono+Experience",cost:"¥¥",tip:"Photos in kimono against snow are incredible — worth it just for that.",openH:10,closeH:16,images:img("temple")},
    {name:"Soga Shrine",nameJp:"曽我神社",cat:"historical",travelMin:20,activityMin:30,rating:4.1,desc:"Small mountain shrine surrounded by ancient trees. Deep winter atmosphere.",mapQuery:"Soga+Shrine+Niseko",cost:"Free",tip:"The torii gate framed by snow is an unforgettable photo.",openH:6,closeH:18,images:img("shrine")},
    {name:"Kutchan History Museum",nameJp:"倶知安風土館",cat:"historical",travelMin:15,activityMin:40,rating:4.0,desc:"Local history from Ainu settlement to ski resort development. Surprisingly fascinating.",mapQuery:"Kutchan+Museum",cost:"¥",tip:"The old skiing equipment display shows how much the sport has evolved.",openH:9,closeH:17,images:img("museum")},
    {name:"Niseko Railway Heritage",nameJp:"ニセコ鉄道遺産",cat:"historical",travelMin:12,activityMin:30,rating:4.1,desc:"Preserved railway station and train cars from the original Niseko line.",mapQuery:"Niseko+Railway+Station",cost:"Free",tip:"The station building itself is a Meiji-era gem — great architecture.",openH:8,closeH:17,images:img("history")},
    {name:"Snowshoe Trek",nameJp:"スノーシュー",cat:"adventure",travelMin:15,activityMin:120,rating:4.7,pop:true,desc:"Guided trek through old-growth birch forest. Spot fox and deer tracks.",mapQuery:"Niseko+Snowshoe+Tour",cost:"¥¥",tip:"Morning tours have the best chance of seeing Ezo red foxes.",openH:7,closeH:15,images:img("snow")},
    {name:"Backcountry Cat Skiing",nameJp:"キャットスキー",cat:"adventure",travelMin:20,activityMin:180,rating:4.9,desc:"Snowcat takes you to untouched powder runs inaccessible by lift.",mapQuery:"Niseko+Cat+Skiing",cost:"¥¥¥",tip:"Book months ahead — this sells out faster than any other Niseko experience.",openH:8,closeH:15,images:img("adventure")},
    {name:"Horseback Riding",nameJp:"乗馬体験",cat:"adventure",travelMin:20,activityMin:60,rating:4.3,desc:"Ride Hokkaido native horses through snowy meadows with mountain views.",mapQuery:"Niseko+Horse+Riding",cost:"¥¥",tip:"The horses are incredibly gentle — suitable even for complete beginners.",openH:9,closeH:15,images:img("adventure")},
    {name:"Outdoor Ice Bar",nameJp:"アイスバー",cat:"fun",travelMin:10,activityMin:45,rating:4.5,desc:"Seasonal pop-up bar made entirely of ice. Drinks in ice glasses.",mapQuery:"Niseko+Ice+Bar",cost:"¥¥",tip:"Go at dusk when they light the ice walls — it glows blue.",openH:16,closeH:22,images:img("ice")},
    {name:"Niseko Village Gondola",nameJp:"ゴンドラ観光",cat:"fun",travelMin:10,activityMin:45,rating:4.3,desc:"Scenic gondola ride for non-skiers with panoramic mountain views.",mapQuery:"Niseko+Village+Gondola",cost:"¥¥",tip:"The top station has a heated viewing deck — no need to brave the wind.",openH:9,closeH:16,images:img("mtn")},
    {name:"Snow Rafting",nameJp:"スノーラフティング",cat:"fun",travelMin:15,activityMin:40,rating:4.4,desc:"Ride a rubber raft pulled by snowmobile across powder fields. Pure adrenaline.",mapQuery:"Niseko+Snow+Rafting",cost:"¥¥",tip:"Hold on tight through the turns — that's where the fun is.",openH:9,closeH:16,images:img("adventure")},
    {name:"Niseko Annupuri Onsen",nameJp:"アンヌプリ温泉",cat:"relaxing",travelMin:15,activityMin:60,rating:4.5,desc:"Quiet onsen away from the Hirafu crowds. Milky mineral water surrounded by birch.",mapQuery:"Niseko+Annupuri+Onsen",cost:"¥",tip:"This is the locals' choice — half the price, twice the peace.",openH:7,closeH:21,images:img("onsen")},
    {name:"Konbu Onsen",nameJp:"昆布温泉",cat:"relaxing",travelMin:20,activityMin:60,rating:4.6,desc:"Rustic forest onsen named for its kelp-like mineral content. Skin comes out impossibly soft.",mapQuery:"Konbu+Onsen+Niseko",cost:"¥",tip:"The water has a unique silky texture you won't find at other onsen.",openH:8,closeH:21,images:img("onsen")},
    {name:"Hotel Spa Day Pass",nameJp:"ホテルスパ",cat:"relaxing",travelMin:10,activityMin:90,rating:4.4,desc:"Luxury spa treatment at one of Niseko's international hotels. Massage, sauna, pool.",mapQuery:"Niseko+Hotel+Spa",cost:"¥¥¥",tip:"The hot stone massage uses volcanic stones from the region.",openH:10,closeH:20,images:img("spa")},
    {name:"Hirafu Shopping Street",nameJp:"ひらふ通り",cat:"shopping",travelMin:5,activityMin:45,rating:4.3,desc:"The main drag with ski shops, boutiques, convenience stores, and souvenir spots.",mapQuery:"Hirafu+Main+Street+Niseko",cost:"Varies",tip:"Rhythm Niseko has the best secondhand ski gear deals.",openH:9,closeH:22,images:img("city")},
    {name:"Niseko Cheese Factory Shop",nameJp:"チーズ工房",cat:"shopping",travelMin:15,activityMin:30,rating:4.5,desc:"Buy artisan Hokkaido cheese direct from the maker. Tasting available.",mapQuery:"Niseko+Cheese+Factory",cost:"Varies",tip:"The smoked camembert travels well and makes incredible gifts.",openH:9,closeH:17,images:img("farm")},
    {name:"Kutchan Covered Market",nameJp:"倶知安市場",cat:"shopping",travelMin:15,activityMin:40,rating:4.2,desc:"Local covered market with Hokkaido produce, crafts, and specialty foods.",mapQuery:"Kutchan+Market",cost:"Varies",tip:"The dried fruit and nut mixes here use local ingredients you can't find elsewhere.",openH:9,closeH:17,images:img("market")},
    {name:"Niseko Night Market",nameJp:"ナイトマーケット",cat:"events",travelMin:5,activityMin:60,rating:4.5,desc:"Seasonal evening market with local crafts, hot food stalls, and live music.",mapQuery:"Niseko+Village+Night+Market",cost:"¥",tip:"The yakitori stalls are the real draw.",openH:17,closeH:21,eventWindow:"Dec–Mar weekends",images:img("night")},
    {name:"Hanazono Lantern Walk",nameJp:"花園ランタン",cat:"events",travelMin:15,activityMin:45,rating:4.6,desc:"Guided evening walk through a lantern-lit forest trail. Magical winter atmosphere.",mapQuery:"Hanazono+Lantern+Walk+Niseko",cost:"¥¥",tip:"Book the 7PM slot — the darkness makes the lanterns more impactful.",openH:17,closeH:20,eventWindow:"Dec–Mar nightly",images:img("fireworks")},
    {name:"Après-Ski Concert Series",nameJp:"アプレスキーコンサート",cat:"events",travelMin:10,activityMin:60,rating:4.3,desc:"Weekly live music events at various Niseko venues. Jazz, acoustic, and local bands.",mapQuery:"Niseko+Live+Music+Concert",cost:"¥",tip:"Check the Niseko United events page — the lineup changes weekly.",openH:18,closeH:22,eventWindow:"Dec–Mar weekly",images:img("night")},
  ],
  sapporo: [
    {name:"Nijo Market",nameJp:"二条市場",cat:"mustsee",travelMin:10,activityMin:60,rating:4.6,pop:true,desc:"Historic fish market with uni, crab, and seafood donburi at the source.",mapQuery:"Nijo+Market+Sapporo",cost:"¥¥",tip:"The uni here is Hokkaido's best — sweet, creamy, zero fishiness.",openH:7,closeH:18,images:img("market")},
    {name:"Genghis Khan Daruma",nameJp:"だるま",cat:"mustsee",travelMin:10,activityMin:60,rating:4.8,pop:true,desc:"Hokkaido's signature lamb BBQ grilled on a dome. Bucket-list meal.",mapQuery:"Daruma+Genghis+Khan+Sapporo",cost:"¥¥",tip:"Arrive 15min before opening or expect 30+ min wait.",openH:11,closeH:23,images:img("bbq")},
    {name:"Odori Park & TV Tower",nameJp:"大通公園",cat:"mustsee",travelMin:10,activityMin:45,rating:4.5,desc:"Sapporo's central park with TV Tower views. The heart of the city.",mapQuery:"Odori+Park+Sapporo+TV+Tower",cost:"¥",tip:"Night views from the tower are dramatically better than daytime.",openH:9,closeH:22,images:img("city")},
    {name:"Ramen Yokocho",nameJp:"ラーメン横丁",cat:"eating",travelMin:10,activityMin:40,rating:4.5,desc:"Legendary ramen alley with 17 shops. Birthplace of Sapporo miso ramen.",mapQuery:"Sapporo+Ramen+Yokocho",cost:"¥",tip:"Shirakaba Sanso has the most unique broth.",openH:11,closeH:23,images:img("ramen")},
    {name:"Soup Curry Suage",nameJp:"スープカレーすあげ",cat:"eating",travelMin:10,activityMin:45,rating:4.6,pop:true,desc:"Sapporo's signature dish — fragrant curry broth with crispy fried chicken and vegetables.",mapQuery:"Suage+Soup+Curry+Sapporo",cost:"¥",tip:"Spice level 3 is the sweet spot for most people — don't go lower than 2.",openH:11,closeH:22,images:img("food")},
    {name:"Kaisen-don at Curb Market",nameJp:"場外市場海鮮丼",cat:"eating",travelMin:15,activityMin:45,rating:4.7,desc:"Seafood rice bowls at the wholesale market. Even fresher than Nijo.",mapQuery:"Sapporo+Curb+Market+Jogai",cost:"¥¥",tip:"The mixed seafood bowl with sea urchin is the local favorite.",openH:6,closeH:15,images:img("sushi")},
    {name:"Zangi Fried Chicken",nameJp:"ザンギ",cat:"eating",travelMin:10,activityMin:30,rating:4.4,desc:"Hokkaido-style fried chicken — crispier and more flavorful than regular karaage.",mapQuery:"Sapporo+Zangi+Restaurant",cost:"¥",tip:"Naruto is the most famous zangi shop — the batter recipe is a secret.",openH:11,closeH:22,images:img("food")},
    {name:"Sapporo Beer Museum",nameJp:"ビール博物館",cat:"drinking",travelMin:15,activityMin:60,rating:4.5,desc:"Iconic red brick brewery with limited-edition beer tastings.",mapQuery:"Sapporo+Beer+Museum",cost:"¥",tip:"Star Hall has all-you-can-drink BBQ + beer combos.",openH:10,closeH:18,images:img("beer")},
    {name:"Susukino Bar Crawl",nameJp:"すすきの",cat:"drinking",travelMin:10,activityMin:120,rating:4.7,pop:true,desc:"Japan's northernmost entertainment district. Thousands of tiny bars.",mapQuery:"Susukino+Sapporo",cost:"¥¥",tip:"Look for bars on upper floors — best ones have no English signs.",openH:18,closeH:24,images:img("bar")},
    {name:"Sapporo Wine & Cheese Bar",nameJp:"ワイン＆チーズバー",cat:"drinking",travelMin:10,activityMin:60,rating:4.4,desc:"Cozy bar specializing in Hokkaido wine and artisan cheese pairings.",mapQuery:"Sapporo+Wine+Cheese+Bar",cost:"¥¥",tip:"The Yoichi pinot noir paired with smoked camembert is perfection.",openH:17,closeH:23,images:img("wine")},
    {name:"Nikka Whisky Yoichi",nameJp:"余市蒸溜所",cat:"drinking",travelMin:55,activityMin:90,rating:4.8,pop:true,desc:"Birthplace of Japanese whisky. Free tours and tastings.",mapQuery:"Nikka+Whisky+Yoichi+Distillery",cost:"Free",tip:"Distillery-only single cask bottlings are collector's items.",openH:9,closeH:17,images:img("whisky")},
    {name:"Baristart Coffee",nameJp:"バリスタート",cat:"coffee",travelMin:10,activityMin:35,rating:4.7,pop:true,desc:"Sapporo's best café. Every drink uses rotating Hokkaido farm milk.",mapQuery:"Baristart+Coffee+Sapporo",cost:"¥",tip:"Their latte is arguably the best in the city.",openH:8,closeH:19,images:img("coffee")},
    {name:"Morihico Coffee",nameJp:"森彦コーヒー",cat:"coffee",travelMin:15,activityMin:40,rating:4.6,desc:"Hidden in a converted house surrounded by trees. Slow-drip, atmospheric.",mapQuery:"Morihico+Coffee+Sapporo",cost:"¥",tip:"The building feels like stepping into a Ghibli film.",openH:10,closeH:20,images:img("cafe")},
    {name:"FAbULOUS Coffee",nameJp:"ファビュラス",cat:"coffee",travelMin:10,activityMin:30,rating:4.5,desc:"Minimalist third-wave café near Odori. Outstanding single-origin pour-overs.",mapQuery:"FAbULOUS+Coffee+Sapporo",cost:"¥",tip:"They rotate origins every few weeks — always something unexpected.",openH:9,closeH:18,images:img("cafe")},
    {name:"Saturdays Chocolate",nameJp:"サタデーズチョコレート",cat:"coffee",travelMin:10,activityMin:35,rating:4.5,desc:"Bean-to-bar chocolate café. Single-origin hot chocolate and cacao drinks.",mapQuery:"Saturdays+Chocolate+Sapporo",cost:"¥",tip:"The drinking chocolate is thick and intense — nothing like regular hot cocoa.",openH:10,closeH:19,images:img("cafe")},
    {name:"Moerenuma Park",nameJp:"モエレ沼公園",cat:"cultural",travelMin:30,activityMin:60,rating:4.5,desc:"Isamu Noguchi's sculpture park. Glass pyramid and otherworldly winter landscapes.",mapQuery:"Moerenuma+Park+Sapporo",cost:"Free",tip:"The glass pyramid feels like being inside an anime set piece.",openH:7,closeH:19,images:img("park")},
    {name:"Hokkaido Museum of Art",nameJp:"北海道立近代美術館",cat:"cultural",travelMin:15,activityMin:60,rating:4.4,desc:"Major art museum with strong Hokkaido and indigenous art collections.",mapQuery:"Hokkaido+Museum+Modern+Art",cost:"¥",tip:"The glass exhibition wing has perfect natural lighting.",openH:9,closeH:17,images:img("art")},
    {name:"Sapporo Art Park",nameJp:"芸術の森",cat:"cultural",travelMin:25,activityMin:75,rating:4.3,desc:"Outdoor sculpture garden and gallery in a forested setting south of the city.",mapQuery:"Sapporo+Art+Park",cost:"¥",tip:"The snow-covered sculptures take on completely different forms in winter.",openH:9,closeH:17,images:img("park")},
    {name:"Hokkaido Shrine",nameJp:"北海道神宮",cat:"historical",travelMin:20,activityMin:45,rating:4.7,pop:true,desc:"Major Shinto shrine in Maruyama Park. Foxes sometimes wander the grounds.",mapQuery:"Hokkaido+Shrine+Sapporo",cost:"Free",tip:"Walk through Maruyama Park — the forest approach is part of the magic.",openH:7,closeH:17,images:img("shrine")},
    {name:"Hokkaido Museum",nameJp:"北海道博物館",cat:"historical",travelMin:25,activityMin:75,rating:4.4,desc:"Ainu culture, natural history, and pioneer story. Well-designed modern museum.",mapQuery:"Hokkaido+Museum+Sapporo",cost:"¥",tip:"The Ainu exhibit is deeply moving — don't rush through it.",openH:9,closeH:17,images:img("museum")},
    {name:"Former Government Building",nameJp:"赤れんが庁舎",cat:"historical",travelMin:10,activityMin:30,rating:4.3,desc:"Stunning red brick neo-Baroque building from 1888. Free interior tours.",mapQuery:"Sapporo+Red+Brick+Building",cost:"Free",tip:"The interior stained glass is unexpectedly beautiful.",openH:8,closeH:18,images:img("history")},
    {name:"Clock Tower",nameJp:"時計台",cat:"historical",travelMin:10,activityMin:20,rating:4.0,desc:"Sapporo's iconic 1878 clock tower. Small museum inside.",mapQuery:"Sapporo+Clock+Tower",cost:"¥",tip:"It's famously underwhelming from outside but charming inside.",openH:8,closeH:17,images:img("history")},
    {name:"Tanuki Koji Arcade",nameJp:"狸小路",cat:"shopping",travelMin:10,activityMin:90,rating:4.4,desc:"7-block covered arcade — Don Quijote, retro game centers, specialty shops.",mapQuery:"Tanuki+Koji+Sapporo",cost:"Varies",tip:"Block 3 has retro arcade cabinets.",openH:10,closeH:22,images:img("city")},
    {name:"Stellar Place & JR Tower",nameJp:"ステラプレイス",cat:"shopping",travelMin:5,activityMin:60,rating:4.3,desc:"Modern shopping complex connected to Sapporo Station. Fashion, food, and observatory.",mapQuery:"Stellar+Place+JR+Tower+Sapporo",cost:"Varies",tip:"The T38 observatory on the 38th floor has 360° city views.",openH:10,closeH:21,images:img("shop")},
    {name:"Nijo Market Souvenir Row",nameJp:"二条市場おみやげ",cat:"shopping",travelMin:10,activityMin:30,rating:4.3,desc:"Dedicated souvenir stalls at the market — dried seafood, snacks, and Hokkaido goods.",mapQuery:"Nijo+Market+Sapporo+Gifts",cost:"Varies",tip:"The dried scallop packs are the best value souvenir in all of Hokkaido.",openH:7,closeH:18,images:img("market")},
    {name:"Jozankei Onsen",nameJp:"定山渓温泉",cat:"relaxing",travelMin:40,activityMin:90,rating:4.6,desc:"Mountain hot spring village in a river gorge. Day-use baths at multiple ryokan.",mapQuery:"Jozankei+Onsen+Sapporo",cost:"¥¥",tip:"Hoheikyo onsen nearby has an outdoor bath next to a dam.",openH:7,closeH:21,images:img("onsen")},
    {name:"Toyohira River Walk + Café",nameJp:"豊平川散歩",cat:"relaxing",travelMin:10,activityMin:45,rating:4.2,desc:"Scenic winter river walk followed by specialty coffee.",mapQuery:"Toyohira+River+Sapporo+Cafe",cost:"¥",tip:"Baristart Coffee is right along this route.",openH:7,closeH:20,images:img("park")},
    {name:"Maruyama Hot Yoga",nameJp:"円山ホットヨガ",cat:"relaxing",travelMin:20,activityMin:60,rating:4.3,desc:"Drop-in hot yoga studio in the Maruyama district. Perfect for sore muscles.",mapQuery:"Hot+Yoga+Maruyama+Sapporo",cost:"¥¥",tip:"The evening classes are less crowded and the instructor speaks some English.",openH:7,closeH:21,images:img("park")},
    {name:"Shiroi Koibito Park",nameJp:"白い恋人パーク",cat:"fun",travelMin:25,activityMin:75,rating:4.3,desc:"Chocolate factory theme park. Make your own cookies.",mapQuery:"Shiroi+Koibito+Park+Sapporo",cost:"¥¥",tip:"Cookie-decorating workshop is great — brings home a gift.",openH:10,closeH:17,images:img("choco")},
    {name:"Maruyama Zoo",nameJp:"円山動物園",cat:"fun",travelMin:20,activityMin:90,rating:4.3,desc:"Polar bears, red pandas, and snow monkeys. Great for a chill afternoon.",mapQuery:"Maruyama+Zoo+Sapporo",cost:"¥",tip:"The polar bear swimming tunnel is mesmerizing.",openH:9,closeH:16,images:img("bear")},
    {name:"Retro Game Arcade",nameJp:"レトロゲーセン",cat:"fun",travelMin:10,activityMin:45,rating:4.4,desc:"Multi-floor arcade in Susukino with classic cabinets, crane games, and purikura.",mapQuery:"Susukino+Arcade+Sapporo",cost:"¥",tip:"The 3rd floor has games from the 80s and 90s — bring ¥100 coins.",openH:10,closeH:24,images:img("city")},
    {name:"Snow Festival",nameJp:"雪まつり",cat:"events",travelMin:10,activityMin:90,rating:4.9,pop:true,desc:"If visiting during February — the Odori Park snow/ice sculptures are legendary.",mapQuery:"Sapporo+Snow+Festival+Odori",cost:"Free",tip:"Evening illuminations are stunning — go twice, day and night.",openH:8,closeH:22,eventWindow:"Early Feb only",images:img("ice")},
    {name:"White Illumination",nameJp:"ホワイトイルミネーション",cat:"events",travelMin:10,activityMin:45,rating:4.6,desc:"Millions of LED lights transform Odori Park and Ekimae-dori into a winter wonderland.",mapQuery:"Sapporo+White+Illumination",cost:"Free",tip:"The tunnel of lights on Ekimae-dori is the most photogenic section.",openH:16,closeH:22,eventWindow:"Nov–Mar nightly",images:img("fireworks")},
    {name:"German Christmas Market",nameJp:"ミュンヘンクリスマス市",cat:"events",travelMin:10,activityMin:60,rating:4.5,desc:"Annual German-style market in Odori Park with glühwein, sausages, and crafts.",mapQuery:"Sapporo+Christmas+Market+Odori",cost:"¥",tip:"The glühwein is surprisingly good — they import real German spice blends.",openH:11,closeH:21,eventWindow:"Late Nov–Dec",images:img("night")},
  ],
};

const fmt = (h, m) => { const hh = ((h % 24) + 24) % 24; return `${hh === 0 ? 12 : hh > 12 ? hh - 12 : hh}:${String(Math.max(0, Math.min(59, m))).padStart(2, "0")} ${hh >= 12 ? "PM" : "AM"}`; };
const fmtD = m => { const h = Math.floor(m / 60), mm = m % 60; return h === 0 ? `${mm}m` : mm === 0 ? `${h}h` : `${h}h ${mm}m`; };
const isOp = (a, ar) => ar >= a.openH && (ar + a.activityMin / 60) <= a.closeH + 0.5;
const Petals = () => (<div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>{Array.from({ length: 12 }, (_, i) => (<div key={i} style={{ position: "absolute", left: `${(i * 8.5) % 100}%`, top: -20, width: 8 + (i % 4) * 2, height: (8 + (i % 4) * 2) * 0.7, background: "radial-gradient(ellipse,rgba(255,183,197,0.65),rgba(255,140,160,0.2))", borderRadius: "50% 0 50% 50%", animation: `pf ${7 + (i % 4) * 2}s ${(i * 0.6) % 7}s linear infinite`, filter: "blur(0.5px)" }} />))}</div>);

// ─── CARD ───
const Cd = ({ a, color, i, dH, dM, tMode, noTime }) => {
  const mult = travelMult(tMode);
  const adjTravel = Math.round(a.travelMin * mult);
  const tot = adjTravel * 2 + a.activityMin;
  const dd = dH + dM / 60, ar = dd + adjTravel / 60, bk = dd + tot / 60;
  const cat = CATEGORIES.find(c => c.id === a.cat);
  const map = `https://www.google.com/maps/search/?api=1&query=${a.mapQuery}`;
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px 22px", animation: `si 0.5s ${i * 0.07}s both cubic-bezier(0.22,1,0.36,1)`, position: "relative", overflow: "hidden", transition: "border-color 0.3s" }} onMouseEnter={e => e.currentTarget.style.borderColor = color + "44"} onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}>
      <div style={{ display: "flex", gap: 6, position: "absolute", top: 14, right: 14, zIndex: 5 }}>
        {a.pop && <div style={{ background: "rgba(255,100,100,0.2)", border: "1px solid rgba(255,100,100,0.4)", borderRadius: 20, padding: "3px 10px", fontFamily: "'Dela Gothic One'", fontSize: 11, color: "#ff8888" }}>🔥 Popular</div>}
        {cat && <div style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "4px 12px", display: "flex", alignItems: "center", gap: 5, fontFamily: "'Zen Kaku Gothic New'", fontSize: 14, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}><span style={{ fontSize: 16 }}>{cat.emoji}</span> {cat.label}</div>}
        <div style={{ background: `linear-gradient(135deg,${color},${color}cc)`, color: "#000", fontFamily: "'Dela Gothic One'", fontSize: 13, padding: "4px 11px", borderRadius: 20 }}>★ {a.rating}</div>
      </div>
      <div style={{ fontFamily: "'Dela Gothic One'", fontSize: 19, color: "#fff", marginBottom: 2, paddingRight: 200 }}>{a.name}<CopyBtn text={a.name} color={color} /></div>
      <div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: color, marginBottom: 14, opacity: 0.8, letterSpacing: 1 }}>{a.nameJp}<CopyBtn text={a.nameJp} color={color} /></div>
      <LiveGallery activity={a} color={color} />
      <div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 15, color: "rgba(255,255,255,0.75)", lineHeight: 1.65, marginBottom: 14 }}>{a.desc}</div>
      {a.eventWindow && <div style={{ background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 8, padding: "6px 12px", marginBottom: 12, fontFamily: "'Dela Gothic One'", fontSize: 13, color: color, display: "inline-block" }}>🗓️ {a.eventWindow}</div>}
      <div style={{ background: `${color}12`, border: `1px solid ${color}25`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 8, alignItems: "flex-start" }}><span style={{ fontSize: 14, flexShrink: 0 }}>💡</span><span style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 14, color: color, lineHeight: 1.5, fontStyle: "italic" }}>{a.tip}</span></div>
      {!noTime && <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontFamily: "'Zen Kaku Gothic New'", fontSize: 14, color: "rgba(255,255,255,0.55)" }}>
        <span style={{ color: color, fontFamily: "'Dela Gothic One'", fontSize: 15 }}>🕐 {fmt(Math.floor(ar), Math.round((ar % 1) * 60))}</span><span>arrive →</span><span style={{ color: "rgba(255,255,255,0.85)" }}>{a.activityMin}m</span><span>→</span>
        <span style={{ color: "#fff", fontFamily: "'Dela Gothic One'", fontSize: 17, background: `${color}25`, padding: "3px 12px", borderRadius: 8, border: `1px solid ${color}35` }}>🏠 Back {fmt(Math.floor(bk), Math.round((bk % 1) * 60))}</span>
      </div>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "5px 12px", fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{tMode === "walking" ? "🚶" : tMode === "bus" ? "🚌" : "🚗"} {adjTravel}min each way</div>
        <div style={{ background: `${color}20`, borderRadius: 8, padding: "5px 12px", fontFamily: "'Dela Gothic One'", fontSize: 13, color: color }}>⌛ {fmtD(tot)} total</div>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "5px 12px", fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{a.cost}</div>
        <a href={map} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "auto", background: `${color}20`, border: `1px solid ${color}40`, borderRadius: 8, padding: "5px 14px", fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: color, textDecoration: "none" }}>📍 Map</a>
      </div>
    </div>
  );
};

// ─── MAIN ───
export default function App() {
  const [loc, setLoc] = useState(null);
  const [cats, setCats] = useState(new Set());
  const [time, setTime] = useState(180);
  const [dH, setDH] = useState(9);
  const [dM, setDM] = useState(0);
  const [sort, setSort] = useState("rating");
  const [free, setFree] = useState(false);
  const [surprise, setSurprise] = useState(null);
  const [scr, setScr] = useState("loc");
  const [tab, setTab] = useState("single");
  const [expC, setExpC] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [tMode, setTMode] = useState("car");
  const [maxTravel, setMaxTravel] = useState(30);
  const [noTime, setNoTime] = useState(false);

  // Reset to singles tab when noTime enabled (combos/extra unavailable)
  useEffect(() => { if (noTime && tab !== "single") setTab("single"); }, [noTime]);

  const L = loc ? LOCATIONS[loc] : null;
  const dep = dH + dM / 60;
  const backStr = fmt(Math.floor(dep + time / 60), Math.round(((dep + time / 60) % 1) * 60));
  const toggle = id => setCats(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const mult = travelMult(tMode);

  const filtered = useMemo(() => {
    if (!loc) return [];
    return DA[loc].filter(a => {
      const adjTravel = Math.round(a.travelMin * mult);
      if (!noTime && adjTravel > maxTravel) return false;
      if (!noTime && adjTravel * 2 + a.activityMin > time) return false;
      if (cats.size > 0 && !cats.has(a.cat)) return false;
      if (free && a.cost !== "Free") return false;
      if (!noTime && !isOp(a, dep + adjTravel / 60)) return false;
      return true;
    }).sort((a, b) => sort === "rating" ? b.rating - a.rating : sort === "time" ? (Math.round(a.travelMin * mult) * 2 + a.activityMin) - (Math.round(b.travelMin * mult) * 2 + b.activityMin) : Math.round(a.travelMin * mult) - Math.round(b.travelMin * mult));
  }, [loc, time, cats, free, sort, dep, mult, maxTravel, noTime]);

  const extra = useMemo(() => {
    if (!loc || noTime) return [];
    return DA[loc].filter(a => {
      const adj = Math.round(a.travelMin * mult);
      const t = adj * 2 + a.activityMin;
      if (t <= time) return false;
      if (cats.size > 0 && !cats.has(a.cat)) return false;
      if (free && a.cost !== "Free") return false;
      if (!isOp(a, dep + adj / 60)) return false;
      return true;
    }).sort((a, b) => (Math.round(a.travelMin * mult) * 2 + a.activityMin) - (Math.round(b.travelMin * mult) * 2 + b.activityMin));
  }, [loc, time, cats, free, dep, mult, noTime]);

  const combos = useMemo(() => {
    if (!loc || noTime) return [];
    const r = [];
    for (let i = 0; i < Math.min(filtered.length, 15); i++) {
      const a1 = filtered[i], adj1 = Math.round(a1.travelMin * mult);
      const s1 = dep + adj1 / 60, e1 = s1 + a1.activityMin / 60;
      for (let j = 0; j < Math.min(filtered.length, 15); j++) {
        if (j === i) continue;
        const a2 = filtered[j], adj2 = Math.round(a2.travelMin * mult);
        const tb = Math.max(5, Math.round((adj1 + adj2) / 2));
        const s2 = e1 + tb / 60, e2 = s2 + a2.activityMin / 60;
        const tot = Math.round((e2 + adj2 / 60 - dep) * 60);
        if (tot > time || !isOp(a2, s2)) continue;
        r.push({ acts: [a1, a2], travs: [tb], tot, avg: +((a1.rating + a2.rating) / 2).toFixed(1), uc: new Set([a1.cat, a2.cat]).size });
      }
    }
    const seen = new Set();
    return r.map(c => ({ ...c, sc: c.avg * 10 + c.uc * 5 - c.tot * 0.02, k: c.acts.map(a => a.name).sort().join("|") })).filter(c => { if (seen.has(c.k)) return false; seen.add(c.k); return true; }).sort((a, b) => b.sc - a.sc).slice(0, 12);
  }, [filtered, dep, time, loc, mult]);

  return (
    <div style={{ minHeight: "100vh", background: L ? L.bg : "linear-gradient(135deg,#0a0a1a 0%,#1a0a2e 50%,#0a1628 100%)", color: "#fff", position: "relative", overflow: "hidden", transition: "background 0.6s" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap');@keyframes pf{0%{transform:translateY(-20px) rotate(0) translateX(0);opacity:0}10%{opacity:1}90%{opacity:.6}100%{transform:translateY(100vh) rotate(360deg) translateX(60px);opacity:0}}@keyframes si{from{opacity:0;transform:translateY(30px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes fu{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes bi{0%{transform:translateX(-50%) scale(.3);opacity:0}50%{transform:translateX(-50%) scale(1.05)}100%{transform:translateX(-50%) scale(1);opacity:1}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}input[type="range"]{-webkit-appearance:none;width:100%;height:6px;border-radius:3px;outline:none;background:rgba(255,255,255,.1)}input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:${L ? L.color : "#FFE66D"};cursor:pointer;box-shadow:0 0 12px ${L ? L.color + "88" : "#FFE66D88"}}*{box-sizing:border-box}a{color:inherit}select{background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:8px 12px;font-family:'Zen Kaku Gothic New';font-size:14px;outline:none;cursor:pointer}select option{background:#1a1a2e;color:#fff}`}</style>
      <Petals />

      {/* HEADER */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,10,26,0.75)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {scr !== "loc" && <button onClick={() => { if (scr === "results") setScr("filters"); else { setScr("loc"); setLoc(null); setShowInfo(false); } }} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, color: "#fff", padding: "6px 12px", cursor: "pointer", fontFamily: "'Zen Kaku Gothic New'", fontSize: 14 }}>← 戻る</button>}
          <span style={{ fontFamily: "'Dela Gothic One'", fontSize: 16 }}>{L ? L.nameJp : "北海道"}</span>
          <span style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: "rgba(255,255,255,0.45)", marginLeft: 4 }}>HOKKAIDO QUEST</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {L && scr !== "loc" && <button onClick={() => setShowInfo(p => !p)} style={{ background: showInfo ? `${L.color}25` : "rgba(255,255,255,0.08)", border: `1px solid ${showInfo ? L.color + "50" : "rgba(255,255,255,0.1)"}`, borderRadius: 8, padding: "6px 14px", color: showInfo ? L.color : "rgba(255,255,255,0.6)", cursor: "pointer", fontFamily: "'Dela Gothic One'", fontSize: 12 }}>ℹ️ Info</button>}
          {scr === "results" && L && <button onClick={() => { const p = filtered[Math.floor(Math.random() * filtered.length)]; if (p) { setSurprise(p); setTimeout(() => setSurprise(null), 4500); } }} style={{ background: `${L.color}20`, border: `1px solid ${L.color}40`, borderRadius: 8, padding: "6px 14px", color: L.color, cursor: "pointer", fontFamily: "'Dela Gothic One'", fontSize: 12 }}>🎲 Surprise</button>}
        </div>
      </div>

      {showInfo && L && <div style={{ maxWidth: 620, margin: "0 auto", padding: "16px 16px 0", animation: "fu 0.4s both" }}><div style={{ background: `${L.color}08`, border: `1px solid ${L.color}25`, borderRadius: 16, padding: "20px 22px" }}><div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}><div style={{ fontFamily: "'Dela Gothic One'", fontSize: 22, color: L.color }}>{L.nameJp}</div><div style={{ fontFamily: "'Dela Gothic One'", fontSize: 16, color: "rgba(255,255,255,0.7)" }}>{L.name}</div></div><div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 15, color: "rgba(255,255,255,0.7)", lineHeight: 1.75 }}>{L.info}</div></div></div>}

      {surprise && L && <div style={{ position: "fixed", top: 80, left: "50%", zIndex: 100, animation: "bi 0.5s both", background: `linear-gradient(135deg,${L.color}20,rgba(0,0,0,0.92))`, border: `2px solid ${L.color}`, borderRadius: 20, padding: "20px 28px", maxWidth: 400, width: "90%", backdropFilter: "blur(20px)", boxShadow: `0 0 40px ${L.color}30` }}><div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 12, color: L.color, letterSpacing: 2 }}>✨ DESTINY PICKS ✨</div><div style={{ fontFamily: "'Dela Gothic One'", fontSize: 20, marginTop: 4 }}>{surprise.name}<CopyBtn text={surprise.name} color={L.color} /></div><div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 14, color: L.color, opacity: 0.7 }}>{surprise.nameJp}</div><div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 14, color: "rgba(255,255,255,0.65)", marginTop: 8, lineHeight: 1.5 }}>{surprise.tip}</div></div>}

      <div style={{ maxWidth: 620, margin: "0 auto", padding: "0 16px 60px" }}>

        {/* LOCATION SELECT */}
        {scr === "loc" && <div style={{ paddingTop: 40, animation: "fu 0.6s both" }}>
          <div style={{ textAlign: "center", marginBottom: 48, position: "relative", zIndex: 2 }}>
            <div style={{ fontFamily: "'Dela Gothic One'", fontSize: 52, lineHeight: 1, background: "linear-gradient(135deg,#FFE66D,#FF6B6B,#4ECDC4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8 }}>北海道</div>
            <div style={{ fontFamily: "'Dela Gothic One'", fontSize: 22, color: "rgba(255,255,255,0.9)", letterSpacing: 4, marginBottom: 16 }}>HOKKAIDO QUEST</div>
            <div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 15, color: "rgba(255,255,255,0.5)", maxWidth: 340, margin: "0 auto", lineHeight: 1.7 }}>Find the perfect adventure while your family hits the slopes.</div>
          </div>
          <div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 12, color: "rgba(255,255,255,0.35)", letterSpacing: 3, marginBottom: 16, textAlign: "center" }}>SELECT YOUR BASE</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Object.entries(LOCATIONS).map(([k, l], i) => (
              <button key={k} onClick={() => { setLoc(k); setScr("filters"); setCats(new Set()); setShowInfo(false); }} style={{ background: `linear-gradient(135deg,${l.color}12,${l.color}05)`, border: `1px solid ${l.color}30`, borderRadius: 16, padding: "22px 24px", cursor: "pointer", textAlign: "left", transition: "all 0.3s", animation: `fu 0.5s ${0.1 + i * 0.1}s both` }} onMouseEnter={e => { e.currentTarget.style.transform = "translateX(4px)"; e.currentTarget.style.borderColor = l.color + "60"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.borderColor = l.color + "30"; }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div><div style={{ fontFamily: "'Dela Gothic One'", fontSize: 24, color: "#fff" }}>{l.name}</div><div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 15, color: l.color, letterSpacing: 2 }}>{l.nameJp}</div></div>
                  <div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{DA[k].length} spots <span style={{ color: l.color, fontSize: 18 }}>→</span></div>
                </div>
              </button>
            ))}
          </div>
        </div>}

        {/* FILTERS */}
        {scr === "filters" && L && <div style={{ paddingTop: 24, animation: "fu 0.5s both" }}>
          <LocationBar loc={loc} color={L.color} />
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontFamily: "'Dela Gothic One'", fontSize: 36, color: L.color }}>{L.nameJp}</div>
            <div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 14, color: "rgba(255,255,255,0.45)", letterSpacing: 2 }}>{L.name.toUpperCase()} — SET PARAMETERS</div>
          </div>

          {/* Timing Toggle + Departure */}
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: "22px 24px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: noTime ? 0 : 14 }}>
              <div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: 2 }}>{noTime ? "TIMING" : "DEPARTURE TIME"}</div>
              <OptTile label="No Timing" emoji="🚫" isActive={noTime} color={L.color} onClick={() => setNoTime(p => !p)} />
            </div>
            {!noTime && <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "6px 12px" }}>
                <select value={dH} onChange={e => setDH(Number(e.target.value))}>{Array.from({ length: 18 }, (_, i) => i + 6).map(h => <option key={h} value={h}>{h > 12 ? h - 12 : h} {h >= 12 ? "PM" : "AM"}</option>)}</select>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18 }}>:</span>
                <select value={dM} onChange={e => setDM(Number(e.target.value))}>{[0, 15, 30, 45].map(m => <option key={m} value={m}>{String(m).padStart(2, "0")}</option>)}</select>
              </div>
              <div style={{ fontFamily: "'Dela Gothic One'", fontSize: 22, color: L.color }}>{fmt(dH, dM)}</div>
              <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
                {[{ l: "🌅", h: 7 }, { l: "☀️", h: 10 }, { l: "🌇", h: 14 }, { l: "🌙", h: 17 }].map(q => (<button key={q.h} onClick={() => { setDH(q.h); setDM(0); }} style={{ background: dH === q.h ? `${L.color}25` : "rgba(255,255,255,0.05)", border: `1px solid ${dH === q.h ? L.color + "50" : "rgba(255,255,255,0.08)"}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>{q.l}</button>))}
              </div>
            </div>}
            {noTime && <div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 8, lineHeight: 1.5 }}>Showing all activities regardless of time. Travel times still shown based on mode.</div>}
          </div>

          {/* Time Budget — hidden when noTime */}
          {!noTime && <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: "22px 24px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: 2 }}>TIME BUDGET</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{ fontFamily: "'Dela Gothic One'", fontSize: 28, color: L.color }}>{fmtD(time)}</span>
                <span style={{ fontFamily: "'Dela Gothic One'", fontSize: 18, color: "#fff", background: `${L.color}20`, padding: "4px 14px", borderRadius: 10, border: `1px solid ${L.color}35` }}>🏠 Back by {backStr}</span>
              </div>
            </div>
            <input type="range" min={30} max={480} step={15} value={time} onChange={e => setTime(Number(e.target.value))} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: "'Zen Kaku Gothic New'", fontSize: 12, color: "rgba(255,255,255,0.3)" }}><span>30min</span><span>8hrs</span></div>
          </div>}

          {/* TRAVEL */}
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: "22px 24px", marginBottom: 16 }}>
            <div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: 2, marginBottom: 14 }}>TRAVEL MODE</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[{ id: "car", emoji: "🚗", label: "Car" }, { id: "bus", emoji: "🚌", label: "Bus/Train" }, { id: "walking", emoji: "🚶", label: "Walking" }].map(m => (
                <OptTile key={m.id} label={m.label} emoji={m.emoji} isActive={tMode === m.id} color={L.color} onClick={() => setTMode(m.id)} />
              ))}
            </div>
            {!noTime && <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, marginTop: 18 }}>
                <span style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: "rgba(255,255,255,0.45)" }}>Max travel time (one way)</span>
                <span style={{ fontFamily: "'Dela Gothic One'", fontSize: 20, color: L.color }}>{maxTravel}min</span>
              </div>
              <input type="range" min={5} max={60} step={5} value={maxTravel} onChange={e => setMaxTravel(Number(e.target.value))} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: "'Zen Kaku Gothic New'", fontSize: 12, color: "rgba(255,255,255,0.3)" }}><span>5min</span><span>1hr</span></div>
            </>}
          </div>

          {/* Categories */}
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: "22px 24px", marginBottom: 16 }}>
            <div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: 2, marginBottom: 16 }}>VIBE CHECK — tap tiles to filter</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>{CATEGORIES.map(c => <MahjongTile key={c.id} cat={c} isActive={cats.has(c.id)} color={L.color} onClick={() => toggle(c.id)} />)}</div>
          </div>

          {/* Options */}
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: "22px 24px", marginBottom: 28 }}>
            <div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: 2, marginBottom: 12 }}>SORT BY</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <OptTile label="Popular" emoji="🔥" isActive={sort === "rating"} color={L.color} onClick={() => setSort("rating")} />
              <OptTile label="Quickest" emoji="⏱️" isActive={sort === "time"} color={L.color} onClick={() => setSort("time")} />
              <OptTile label="Closest" emoji="📍" isActive={sort === "closest"} color={L.color} onClick={() => setSort("closest")} />
              <OptTile label="Free Only" emoji="🆓" isActive={free} color={L.color} onClick={() => setFree(!free)} />
            </div>
          </div>

          <button onClick={() => setScr("results")} style={{ width: "100%", background: `linear-gradient(135deg,${L.color},${L.accent}cc)`, border: "none", borderRadius: 14, padding: "16px 24px", cursor: "pointer", fontFamily: "'Dela Gothic One'", fontSize: 18, color: "#000", letterSpacing: 1, boxShadow: `0 4px 24px ${L.color}40`, transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>FIND ADVENTURES → {filtered.length} results</button>
        </div>}

        {/* RESULTS */}
        {scr === "results" && L && <div style={{ paddingTop: 24, animation: "fu 0.4s both" }}>
          <LocationBar loc={loc} color={L.color} />

          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", marginBottom: 20, overflow: "hidden", position: "relative", zIndex: 2 }}>
            {[{ k: "single", l: `🎯 All (${filtered.length})`, show: true }, { k: "combo", l: `⛓️ Combos (${combos.length})`, show: !noTime }, { k: "extra", l: `⏳ Extra (${extra.length})`, show: !noTime }].filter(t => t.show).map(t => (
              <button key={t.k} onClick={() => { setTab(t.k); setExpC(null); }} style={{ flex: 1, padding: "12px 10px", cursor: "pointer", border: "none", background: tab === t.k ? `${L.color}20` : "transparent", color: tab === t.k ? L.color : "rgba(255,255,255,0.45)", fontFamily: "'Dela Gothic One'", fontSize: 12, borderBottom: tab === t.k ? `2px solid ${L.color}` : "2px solid transparent" }}>{t.l}</button>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 8, position: "relative", zIndex: 2 }}>
            <div>
              <div style={{ fontFamily: "'Dela Gothic One'", fontSize: 15, color: L.color }}>{L.nameJp} {tab === "combo" ? "COMBO" : tab === "extra" ? "EXTRA TIME" : "QUEST LOG"}</div>
              <div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{noTime ? "No timing" : `Departing ${fmt(dH, dM)} · ${fmtD(time)}`} · {tMode === "walking" ? "🚶 Walking" : tMode === "bus" ? "🚌 Bus" : "🚗 Car"}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {!noTime && <div style={{ fontFamily: "'Dela Gothic One'", fontSize: 16, color: "#fff", background: `${L.color}20`, padding: "6px 16px", borderRadius: 10, border: `1px solid ${L.color}35` }}>🏠 {backStr}</div>}
              <button onClick={() => setScr("filters")} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: "rgba(255,255,255,0.55)" }}>⚙️</button>
            </div>
          </div>

          {tab === "single" && (filtered.length > 0 ? <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "relative", zIndex: 2 }}>{filtered.map((a, i) => <Cd key={a.name} a={a} color={L.color} i={i} dH={dH} dM={dM} tMode={tMode} noTime={noTime} />)}</div> : <Emp />)}

          {tab === "extra" && !noTime && (extra.length > 0 ? <div style={{ position: "relative", zIndex: 2 }}><div style={{ background: `${L.color}08`, border: `1px solid ${L.color}20`, borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontFamily: "'Zen Kaku Gothic New'", fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>These match your vibe but need more than <strong style={{ color: L.color }}>{fmtD(time)}</strong>. Plan for a longer break.</div><div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{extra.map((a, i) => { const adj = Math.round(a.travelMin * mult); const ov = (adj * 2 + a.activityMin) - time; return (<div key={a.name} style={{ position: "relative" }}><div style={{ position: "absolute", top: 14, left: 14, zIndex: 6, background: "linear-gradient(135deg,#ff4444,#cc0000)", borderRadius: 8, padding: "4px 10px", fontFamily: "'Dela Gothic One'", fontSize: 12, color: "#fff" }}>+{fmtD(ov)} over</div><Cd a={a} color={L.color} i={i} dH={dH} dM={dM} tMode={tMode} noTime={false} /></div>); })}</div></div> : <Emp msg="All matching activities fit — nice!" />)}

          {tab === "combo" && (combos.length > 0 ? <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "relative", zIndex: 2 }}>
            {combos.map((c, ci) => {
              const isE = expC === ci;
              let t = dep;
              const tl = [];
              c.acts.forEach((a, ai) => { const adj = Math.round(a.travelMin * mult); t += adj / 60; const ar = t; t += a.activityMin / 60; const dn = t; if (ai < c.travs.length) t += c.travs[ai] / 60; tl.push({ a, ar, dn }); });
              const lastAdj = Math.round(c.acts[c.acts.length - 1].travelMin * mult);
              const ret = t + lastAdj / 60;
              return (
                <div key={ci} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${isE ? L.color + "40" : "rgba(255,255,255,0.08)"}`, borderRadius: 16, overflow: "hidden", animation: `si 0.5s ${ci * 0.06}s both` }}>
                  <button onClick={() => setExpC(isE ? null : ci)} style={{ width: "100%", background: "transparent", border: "none", cursor: "pointer", padding: "18px 22px", textAlign: "left", color: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>{c.acts.map((a, ai) => <span key={ai} style={{ display: "flex", alignItems: "center", gap: 4 }}>{ai > 0 && <span style={{ color: L.color, fontFamily: "'Dela Gothic One'", fontSize: 12 }}>→</span>}<span style={{ fontFamily: "'Dela Gothic One'", fontSize: 15 }}>{a.name}</span></span>)}</div>
                        <div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{c.acts.map(a => a.nameJp).join(" → ")}</div>
                      </div>
                      <div style={{ background: `linear-gradient(135deg,${L.color},${L.color}cc)`, color: "#000", fontFamily: "'Dela Gothic One'", fontSize: 13, padding: "4px 11px", borderRadius: 20, height: "fit-content" }}>★ {c.avg}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <div style={{ background: `${L.color}20`, borderRadius: 8, padding: "5px 12px", fontFamily: "'Dela Gothic One'", fontSize: 13, color: L.color }}>⌛ {fmtD(c.tot)}</div>
                      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "5px 12px", fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{c.acts.length} stops</div>
                      <span style={{ marginLeft: "auto", color: L.color, fontSize: 13, transform: isE ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.3s", display: "inline-block" }}>▶</span>
                    </div>
                  </button>
                  {isE && <div style={{ padding: "0 22px 22px", animation: "fu 0.3s both" }}>
                    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "16px 18px", marginBottom: 16, borderLeft: `3px solid ${L.color}40` }}>
                      <div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 12, color: "rgba(255,255,255,0.35)", letterSpacing: 2, marginBottom: 12 }}>TIMELINE</div>
                      {tl.map((s, si) => (<div key={si} style={{ marginBottom: si < tl.length - 1 ? 14 : 0 }}><div style={{ display: "flex", gap: 10 }}><div style={{ width: 55, flexShrink: 0, textAlign: "right", fontFamily: "'Dela Gothic One'", fontSize: 13, color: L.color }}>{fmt(Math.floor(s.ar), Math.round((s.ar % 1) * 60))}</div><div style={{ width: 8, height: 8, borderRadius: "50%", background: L.color, flexShrink: 0, marginTop: 4, boxShadow: `0 0 8px ${L.color}60` }} /><div><div style={{ fontFamily: "'Dela Gothic One'", fontSize: 15 }}>{s.a.name}<CopyBtn text={s.a.name} color={L.color} /></div><div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{s.a.activityMin}min · {s.a.cost}</div><div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: L.color, opacity: 0.7, fontStyle: "italic", marginTop: 4 }}>💡 {s.a.tip}</div></div></div>{si < tl.length - 1 && <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}><div style={{ width: 55, flexShrink: 0, textAlign: "right", fontFamily: "'Zen Kaku Gothic New'", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{fmt(Math.floor(s.dn), Math.round((s.dn % 1) * 60))}</div><div style={{ width: 8, display: "flex", justifyContent: "center", flexShrink: 0 }}><div style={{ width: 1, height: 18, background: `${L.color}30` }} /></div><div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{tMode === "walking" ? "🚶" : tMode === "bus" ? "🚌" : "🚗"} {c.travs[si]}min</div></div>}</div>))}
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}><div style={{ width: 55, flexShrink: 0, textAlign: "right", fontFamily: "'Dela Gothic One'", fontSize: 13, color: L.color }}>{fmt(Math.floor(ret), Math.round((ret % 1) * 60))}</div><div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.3)", flexShrink: 0 }} /><div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 14, color: "rgba(255,255,255,0.55)" }}>🏠 Back</div></div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{c.acts.map((a, ai) => <a key={ai} href={`https://www.google.com/maps/search/?api=1&query=${a.mapQuery}`} target="_blank" rel="noopener noreferrer" style={{ background: `${L.color}15`, border: `1px solid ${L.color}30`, borderRadius: 8, padding: "6px 12px", fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: L.color, textDecoration: "none" }}>📍 {a.name}</a>)}</div>
                  </div>}
                </div>
              );
            })}
          </div> : <Emp msg="No combos fit — try more time or broader filters." />)}

          <div style={{ height: 40 }} />
        </div>}
      </div>
    </div>
  );
}

const Emp = ({ msg }) => (<div style={{ textAlign: "center", padding: "60px 20px", animation: "fu 0.5s both" }}><div style={{ fontSize: 48, marginBottom: 16 }}>🎌</div><div style={{ fontFamily: "'Dela Gothic One'", fontSize: 18, color: "rgba(255,255,255,0.6)" }}>{msg || "No matches"}</div><div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 8, lineHeight: 1.6 }}>Try adjusting your filters.</div></div>);
