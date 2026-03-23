import { useState, useEffect, useMemo, useRef, useCallback } from "react";

// ─── COPY BUTTON ───
const CopyBtn = ({ text, color }) => {
  const [copied, setCopied] = useState(false);
  const copy = (e) => { e.stopPropagation(); navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); };
  return (<button onClick={copy} title="Copy" style={{ background: copied ? `${color}30` : "transparent", border: "none", cursor: "pointer", padding: "2px 4px", verticalAlign: "middle", marginLeft: 3, lineHeight: 1, transition: "all 0.2s", opacity: copied ? 1 : 0.4 }}>
    {copied ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="3"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>}
  </button>);
};

// ─── WEB & INSTAGRAM BUTTONS ───
const WebBtn = ({ query, color }) => (
  <a href={`https://www.google.com/search?q=${encodeURIComponent(query + ' official site')}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} title="Website" style={{ display: "inline-flex", alignItems: "center", verticalAlign: "middle", marginLeft: 3, padding: "2px 4px", opacity: 0.4, transition: "opacity 0.2s", textDecoration: "none" }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.4}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
  </a>
);

const InstaBtn = ({ query, color }) => (
  <a href={`https://www.instagram.com/explore/tags/${encodeURIComponent(query.replace(/[^a-zA-Z0-9\u3000-\u9FFF]/g, '').toLowerCase())}/`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} title="Instagram" style={{ display: "inline-flex", alignItems: "center", verticalAlign: "middle", marginLeft: 2, padding: "2px 4px", opacity: 0.4, transition: "opacity 0.2s", textDecoration: "none" }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.4}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="rgba(255,255,255,0.7)" stroke="none"/></svg>
  </a>
);

// ─── SHARE / PDF ───
function buildShareHTML(title, activities, locationName, tMode, color, timing = {}) {
  const modeLabel = { car: "🚗 Driving", bus: "🚌 Bus", walking: "🚶 Walking" }[tMode] || "🚗 Driving";
  const { dH, dM, noTime, mult = 1 } = timing;
  const hasTiming = !noTime && dH != null;
  const dep = hasTiming ? dH + (dM || 0) / 60 : 0;
  const fmtT = (h, m) => { const hh = ((Math.floor(h) % 24) + 24) % 24; return `${hh === 0 ? 12 : hh > 12 ? hh - 12 : hh}:${String(Math.max(0, Math.min(59, Math.round(m)))).padStart(2, "0")} ${hh >= 12 ? "PM" : "AM"}`; };
  const fmtDur = m => { const h = Math.floor(m / 60), mm = m % 60; return h === 0 ? `${mm}m` : mm === 0 ? `${h}h` : `${h}h ${mm}m`; };

  // Build per-activity timing
  let runH = dep;
  const timingRows = activities.map(a => {
    const adj = Math.round(a.travelMin * (mult || 1));
    const arriveH = runH + adj / 60;
    const doneH = arriveH + a.activityMin / 60;
    const backH = doneH + adj / 60;
    const row = { adj, arriveH, doneH, backH, tot: adj * 2 + a.activityMin };
    runH = doneH + (activities.length > 1 ? Math.max(5, adj) / 60 : 0); // travel between for combos
    return row;
  });

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title} — Hokkaido Quest</title>
<link href="https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Zen+Kaku+Gothic+New:wght@400;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Zen Kaku Gothic New',sans-serif;background:#0a0a1a;color:#fff;padding:24px;max-width:640px;margin:0 auto}
@media print{body{background:#fff;color:#111;padding:12px}h1{color:#111!important}.card{border:1px solid #ddd!important;background:#fafafa!important}.tip{background:#f5f5f5!important;border-color:#ddd!important;color:#333!important}.tag{background:#eee!important;color:#444!important}.timeline{background:#f5f5f5!important;border-color:#ddd!important}.tl-time{color:#333!important}.tl-label{color:#555!important}.hdr{color:#111!important}.sub{color:#666!important}.desc{color:#333!important}a{color:#0066cc!important}}
h1{font-family:'Dela Gothic One';font-size:22px;color:${color};margin-bottom:4px}
.sub{font-size:13px;color:rgba(255,255,255,0.4);margin-bottom:20px;letter-spacing:2px}
.card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:18px;margin-bottom:14px;page-break-inside:avoid}
.card h2{font-family:'Dela Gothic One';font-size:17px;margin-bottom:2px;color:#fff}
.jp{font-size:13px;color:${color};opacity:0.8;margin-bottom:10px;letter-spacing:1px}
.desc{font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;margin-bottom:10px}
.tip{background:${color}12;border:1px solid ${color}25;border-radius:8px;padding:8px 12px;font-size:13px;color:${color};font-style:italic;line-height:1.5;margin-bottom:10px}
.timeline{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px 14px;margin-bottom:10px;font-size:13px;line-height:1.8}
.tl-time{font-family:'Dela Gothic One';color:${color}}
.tl-label{color:rgba(255,255,255,0.5)}
.tags{display:flex;flex-wrap:wrap;gap:6px}
.tag{background:rgba(255,255,255,0.06);border-radius:6px;padding:4px 10px;font-size:12px;color:rgba(255,255,255,0.55)}
.tag.accent{background:${color}20;color:${color};font-family:'Dela Gothic One'}
a.map{display:inline-block;background:${color}20;border:1px solid ${color}40;border-radius:6px;padding:4px 12px;font-size:12px;color:${color};text-decoration:none;margin-top:8px}
.footer{margin-top:24px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.08);font-size:11px;color:rgba(255,255,255,0.3);text-align:center}
@media print{.no-print{display:none!important}}
</style></head><body>
<h1>北海道 ${title}</h1>
<div class="sub">${locationName.toUpperCase()} · ${modeLabel}${hasTiming ? ` · Depart ${fmtT(dH, dM || 0)}` : ''} · ${activities.length} ACTIVIT${activities.length === 1 ? 'Y' : 'IES'}</div>
${activities.map((a, i) => {
  const t = timingRows[i];
  return `
<div class="card">
  <h2>${i + 1}. ${a.name}</h2>
  <div class="jp">${a.nameJp}</div>
  ${hasTiming ? `<div class="timeline">
    <span class="tl-time">🕐 Arrive ${fmtT(t.arriveH, (t.arriveH % 1) * 60)}</span>
    <span class="tl-label"> → ${a.activityMin}min activity → </span>
    <span class="tl-time">🏠 Back by ${fmtT(t.backH, (t.backH % 1) * 60)}</span>
    <span class="tl-label"> · ⌛ ${fmtDur(t.tot)} total</span>
  </div>` : `<div class="timeline">
    <span class="tl-label">${tMode === "walking" ? "🚶" : tMode === "bus" ? "🚌" : "🚗"} ${t.adj}min each way · ${a.activityMin}min activity · ⌛ ~${fmtDur(t.tot)} total</span>
  </div>`}
  <div class="desc">${a.desc}</div>
  <div class="tip">💡 ${a.tip}</div>
  <div class="tags">
    <span class="tag accent">★ ${a.rating}</span>
    <span class="tag">${a.cost}</span>
    <span class="tag">${tMode === "walking" ? "🚶" : tMode === "bus" ? "🚌" : "🚗"} ${t.adj}min travel</span>
    <span class="tag">Open ${a.openH || '?'}:00–${a.closeH || '?'}:00</span>
    ${a.eventWindow ? `<span class="tag">🗓️ ${a.eventWindow}</span>` : ''}
  </div>
  <a class="map" href="https://www.google.com/maps/search/?api=1&query=${a.mapQuery}" target="_blank">📍 Open in Google Maps</a>
</div>`;
}).join('')}
<div class="footer">Generated by Hokkaido Quest 北海道 · ${new Date().toLocaleDateString()}</div>
<div class="no-print" style="text-align:center;margin-top:20px">
  <button onclick="window.print()" style="background:${color};color:#000;border:none;border-radius:10px;padding:12px 28px;font-family:'Dela Gothic One';font-size:15px;cursor:pointer">📄 Save as PDF</button>
</div>
</body></html>`;
}

const ShareBtn = ({ activities, title, locationName, tMode, color, label = "📤", small = false, dH, dM, noTime, mult }) => {
  const [busy, setBusy] = useState(false);
  const fmtT = (h, m) => { const hh = ((Math.floor(h) % 24) + 24) % 24; return `${hh === 0 ? 12 : hh > 12 ? hh - 12 : hh}:${String(Math.max(0, Math.min(59, Math.round(m)))).padStart(2, "0")} ${hh >= 12 ? "PM" : "AM"}`; };
  const fmtDur = m => { const h = Math.floor(m / 60), mm = m % 60; return h === 0 ? `${mm}m` : mm === 0 ? `${h}h` : `${h}h ${mm}m`; };

  const handleShare = async (e) => {
    e.stopPropagation();
    setBusy(true);
    const timing = { dH, dM, noTime, mult: mult || 1 };
    const hasTiming = !noTime && dH != null;
    const dep = hasTiming ? dH + (dM || 0) / 60 : 0;
    const modeIcon = tMode === "walking" ? "🚶" : tMode === "bus" ? "🚌" : "🚗";

    try {
      // Build text summary with timing
      let runH = dep;
      const lines = activities.map((a, i) => {
        const adj = Math.round(a.travelMin * (mult || 1));
        const arriveH = runH + adj / 60;
        const backH = arriveH + a.activityMin / 60 + adj / 60;
        const tot = adj * 2 + a.activityMin;
        runH = arriveH + a.activityMin / 60 + (activities.length > 1 ? Math.max(5, adj) / 60 : 0);

        let timeLine = '';
        if (hasTiming) {
          timeLine = `   🕐 Arrive ${fmtT(arriveH, (arriveH % 1) * 60)} → ${a.activityMin}min → 🏠 Back ${fmtT(backH, (backH % 1) * 60)} (${fmtDur(tot)} total)\n`;
        } else {
          timeLine = `   ${modeIcon} ${adj}min each way · ${a.activityMin}min activity · ~${fmtDur(tot)} total\n`;
        }
        return `${i + 1}. ${a.name} (${a.nameJp}) ★${a.rating}\n${timeLine}   ${a.desc}\n   💡 ${a.tip}\n   📍 https://www.google.com/maps/search/?api=1&query=${a.mapQuery}\n`;
      }).join('\n');

      const header = hasTiming ? `Depart ${fmtT(dH, dM || 0)} · ${modeIcon}\n\n` : `${modeIcon} Travel mode\n\n`;
      const text = `${title} — Hokkaido Quest\n${header}${lines}`;

      if (navigator.share) {
        await navigator.share({ title: `${title} — Hokkaido Quest`, text });
        setBusy(false);
        return;
      }

      const html = buildShareHTML(title, activities, locationName, tMode, color, timing);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      if (err.name !== 'AbortError') {
        const html = buildShareHTML(title, activities, locationName, tMode, color, { dH, dM, noTime, mult });
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    }
    setBusy(false);
  };
  
  const baseStyle = small ? {
    background: "rgba(255,255,255,0.06)", border: `1px solid rgba(255,255,255,0.1)`,
    borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 13,
    color: "rgba(255,255,255,0.5)", fontFamily: "'Zen Kaku Gothic New'",
    transition: "all 0.2s", display: "inline-flex", alignItems: "center", gap: 4,
  } : {
    background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 8,
    padding: "6px 14px", cursor: "pointer", fontSize: 12, color: color,
    fontFamily: "'Dela Gothic One'", transition: "all 0.2s",
    display: "inline-flex", alignItems: "center", gap: 5,
  };
  
  return (
    <button onClick={handleShare} disabled={busy} style={{ ...baseStyle, opacity: busy ? 0.5 : 1 }}>
      {busy ? "..." : label}
    </button>
  );
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
    <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", borderRadius: 12, overflow: "hidden", marginBottom: 16, cursor: "grab", userSelect: "none" }}
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
const TA = { eating: c => (<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="20" r="12" fill={c + "30"} /><path d="M16 22c0 0 2 8 8 8s8-8 8-8" stroke={c} strokeWidth="2" strokeLinecap="round" fill={c + "15"} /><path d="M18 18c1-4 4-6 6-6s5 2 6 6" stroke={c} strokeWidth="1.5" fill="none" /><line x1="24" y1="30" x2="24" y2="38" stroke={c} strokeWidth="2" strokeLinecap="round" /><circle cx="21" cy="20" r="1" fill={c} /><circle cx="27" cy="20" r="1" fill={c} /></svg>), drinking: c => (<svg viewBox="0 0 48 48" fill="none"><path d="M16 12h16l-3 20h-10l-3-20z" fill={c + "20"} stroke={c} strokeWidth="1.5" /><rect x="21" y="32" width="6" height="6" rx="1" fill={c + "30"} stroke={c} strokeWidth="1" /><line x1="18" y1="38" x2="30" y2="38" stroke={c} strokeWidth="2" strokeLinecap="round" /><ellipse cx="24" cy="16" rx="6" ry="2" fill={c + "40"} /></svg>), coffee: c => (<svg viewBox="0 0 48 48" fill="none"><path d="M12 20h20v14a4 4 0 01-4 4h-12a4 4 0 01-4-4v-14z" fill={c + "20"} stroke={c} strokeWidth="1.5" /><path d="M32 22h4a3 3 0 010 6h-4" stroke={c} strokeWidth="1.5" fill="none" /><ellipse cx="22" cy="20" rx="10" ry="2" fill={c + "30"} /><path d="M18 14c0-3 2-4 2-6M22 12c0-3 2-4 2-6M26 14c0-3 2-4 2-6" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" /></svg>), cultural: c => (<svg viewBox="0 0 48 48" fill="none"><path d="M24 8l-16 12h32l-16-12z" fill={c + "25"} stroke={c} strokeWidth="1.5" /><line x1="14" y1="20" x2="14" y2="36" stroke={c} strokeWidth="2" /><line x1="24" y1="20" x2="24" y2="36" stroke={c} strokeWidth="2" /><line x1="34" y1="20" x2="34" y2="36" stroke={c} strokeWidth="2" /><rect x="10" y="36" width="28" height="4" rx="1" fill={c + "20"} stroke={c} strokeWidth="1" /></svg>), historical: c => (<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="14" fill={c + "12"} stroke={c} strokeWidth="1.5" /><circle cx="24" cy="24" r="6" fill={c + "25"} stroke={c} strokeWidth="1" /><path d="M24 14v10l6 4" stroke={c} strokeWidth="2" strokeLinecap="round" /></svg>), adventure: c => (<svg viewBox="0 0 48 48" fill="none"><path d="M24 8l12 28H12l12-28z" fill={c + "20"} stroke={c} strokeWidth="1.5" strokeLinejoin="round" /><path d="M24 8l-6 14 6-4 6 4-6-14z" fill={c + "30"} /><circle cx="24" cy="16" r="2" fill={c} opacity="0.5" /><line x1="8" y1="36" x2="40" y2="36" stroke={c} strokeWidth="1.5" strokeLinecap="round" /></svg>), fun: c => (<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="22" r="14" fill={c + "15"} stroke={c} strokeWidth="1.5" /><circle cx="19" cy="19" r="2.5" fill={c} opacity="0.6" /><circle cx="29" cy="19" r="2.5" fill={c} opacity="0.6" /><path d="M18 27c2 4 8 4 12 0" stroke={c} strokeWidth="2" strokeLinecap="round" /></svg>), relaxing: c => (<svg viewBox="0 0 48 48" fill="none"><ellipse cx="24" cy="30" rx="16" ry="8" fill={c + "20"} stroke={c} strokeWidth="1.5" /><path d="M14 18c1-4 4-6 4-9M22 16c1-4 2-5 2-8M30 18c1-4 2-5 3-8" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.4" /><circle cx="20" cy="28" r="3" fill={c + "25"} /></svg>), shopping: c => (<svg viewBox="0 0 48 48" fill="none"><path d="M14 18l-4 18h28l-4-18H14z" fill={c + "15"} stroke={c} strokeWidth="1.5" strokeLinejoin="round" /><path d="M18 18v-4a6 6 0 0112 0v4" stroke={c} strokeWidth="1.5" fill="none" /><circle cx="24" cy="27" r="3" fill={c + "25"} stroke={c} strokeWidth="1" /></svg>), mustsee: c => (<svg viewBox="0 0 48 48" fill="none"><path d="M24 4l6 12 14 2-10 10 2 14-12-6-12 6 2-14L4 18l14-2 6-12z" fill={c + "25"} stroke={c} strokeWidth="1.5" strokeLinejoin="round" /><circle cx="24" cy="24" r="5" fill={c + "40"} /><path d="M22 24l2 2 4-4" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>), events: c => (<svg viewBox="0 0 48 48" fill="none"><rect x="10" y="12" width="28" height="26" rx="3" fill={c + "15"} stroke={c} strokeWidth="1.5" /><line x1="10" y1="20" x2="38" y2="20" stroke={c} strokeWidth="1.5" /><line x1="18" y1="8" x2="18" y2="16" stroke={c} strokeWidth="2" strokeLinecap="round" /><line x1="30" y1="8" x2="30" y2="16" stroke={c} strokeWidth="2" strokeLinecap="round" /><circle cx="24" cy="29" r="4" fill={c + "30"} stroke={c} strokeWidth="1" /></svg>), essentials: c => (<svg viewBox="0 0 48 48" fill="none"><rect x="14" y="8" width="20" height="32" rx="3" fill={c + "15"} stroke={c} strokeWidth="1.5" /><line x1="14" y1="14" x2="34" y2="14" stroke={c} strokeWidth="1" /><path d="M21 24h6M24 21v6" stroke={c} strokeWidth="2.5" strokeLinecap="round" /><circle cx="24" cy="24" r="8" fill="none" stroke={c} strokeWidth="1.5" opacity="0.3" /><rect x="20" y="36" width="8" height="2" rx="1" fill={c + "40"} /></svg>), liquor: c => (<svg viewBox="0 0 48 48" fill="none"><path d="M20 8h8v12l4 16H16l4-16V8z" fill={c + "15"} stroke={c} strokeWidth="1.5" /><line x1="20" y1="8" x2="28" y2="8" stroke={c} strokeWidth="2" strokeLinecap="round" /><ellipse cx="24" cy="32" rx="6" ry="2" fill={c + "25"} /><path d="M22 20c0 0 1 2 2 2s2-2 2-2" stroke={c} strokeWidth="1" opacity="0.5" /><line x1="24" y1="38" x2="24" y2="42" stroke={c} strokeWidth="1.5" strokeLinecap="round" /><line x1="18" y1="42" x2="30" y2="42" stroke={c} strokeWidth="2" strokeLinecap="round" /></svg>) };

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
        // Reverse geocode via dedicated Geocoding API endpoint
        fetch(`/api/geocode?lat=${latitude}&lng=${longitude}`)
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data?.address) {
              setAddr(data.address);
              setEditing(false);
            } else {
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
  rusutsu: { name: "Rusutsu", nameJp: "ルスツ", color: "#4ECDC4", accent: "#1A535C", bg: "linear-gradient(135deg,#0f2027 0%,#203a43 50%,#2c5364 100%)", info: "Rusutsu is Hokkaido's best-kept secret — a massive resort with virtually no lift lines, surrounded by pristine volcanic landscapes. Unlike international Niseko or urban Sapporo, Rusutsu offers a deeply Japanese ski experience. Its proximity to Lake Toya and Noboribetsu makes it a gateway to dramatic natural scenery.", lat: 42.7521, lng: 140.2364 },
  niseko: { name: "Niseko", nameJp: "ニセコ", color: "#FF6B6B", accent: "#C73E3E", bg: "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)", info: "Niseko is Japan's most famous international ski destination, legendary for impossibly light powder and the iconic Mt. Yotei backdrop. Vibrant après-ski culture — craft breweries, whisky bars, farm-to-table dining. The most versatile base for non-skiers with dog sledding, snowshoeing, and glassblowing.", lat: 42.8625, lng: 140.6880 },
  sapporo: { name: "Sapporo", nameJp: "札幌", color: "#FFE66D", accent: "#F4A261", bg: "linear-gradient(135deg,#0c0c1d 0%,#1a1a3e 50%,#2d1b69 100%)", info: "Sapporo is Hokkaido's capital — a proper metropolis with world-class food, nightlife, and culture. Famous for miso ramen, Genghis Khan BBQ, the Snow Festival, and Sapporo beer. Depth you can't find in resort towns: Ainu museums, Noguchi sculpture parks, hidden coffee shops, and Japan's best bar district.", lat: 43.0621, lng: 141.3544 },
};

// Known landmark coordinates for map accuracy
const KNOWN_COORDS = {
  "Lake+Toya+Hokkaido":[42.596,140.856],"Usuzan+Ropeway":[42.534,140.844],"Noboribetsu+Jigokudani":[42.495,141.138],
  "Kyogoku+Spring+Water+Village":[42.864,140.513],"Upopoy+Shiraoi":[42.554,141.354],"Nikka+Whisky+Yoichi+Distillery":[43.173,140.773],
  "Hoheikyo+Onsen+Sapporo":[42.960,141.180],"Sapporo+TV+Tower":[43.061,141.357],"Nijo+Market+Sapporo":[43.061,141.347],
  "Odori+Park+Sapporo":[43.059,141.356],"Tanukikoji+Shopping+Street+Sapporo":[43.058,141.349],"Susukino+Sapporo":[43.054,141.353],
  "Shiroi+Koibito+Park+Sapporo":[43.076,141.276],"Moerenuma+Park+Sapporo":[43.112,141.407],"Maruyama+Park+Sapporo":[43.053,141.310],
  "Jozankei+Onsen+Sapporo":[42.969,141.157],"Lake+Shikotsu+Ice+Festival":[42.779,141.325],"Asahiyama+Memorial+Park+Sapporo":[43.044,141.354],
  "Sapporo+Ramen+Yokocho":[43.055,141.354],"Sapporo+Beer+Museum":[43.071,141.362],"Sapporo+Snow+Festival":[43.059,141.356],
  "Hirafu+Niseko":[42.863,140.699],"Niseko+Village":[42.858,140.665],"Annupuri+Niseko":[42.860,140.641],
  "Hanazono+Niseko":[42.882,140.719],
};

// Compute approximate map coordinates from travelMin and name hash
function getCoords(a, locData) {
  if (KNOWN_COORDS[a.mapQuery]) return KNOWN_COORDS[a.mapQuery];
  // Use name as seed for consistent direction
  let hash = 0;
  for (let i = 0; i < a.name.length; i++) hash = ((hash << 5) - hash + a.name.charCodeAt(i)) | 0;
  const angle = (Math.abs(hash) % 360) * Math.PI / 180;
  // ~0.008 degrees per minute of driving ≈ 0.8km/min
  const dist = a.travelMin * 0.003;
  return [locData.lat + dist * Math.cos(angle), locData.lng + dist * Math.sin(angle) * 1.3];
}

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
  { id: "essentials", label: "Essentials", emoji: "💊", labelJp: "必需品" },
  { id: "liquor", label: "Liquor", emoji: "🍷", labelJp: "酒屋" },
  { id: "events", label: "Events", emoji: "🎪", labelJp: "催事" },
];

const _p={lake:["photo-1528164344705-47542687000d","photo-1506905925346-21bda4d32df4","photo-1473448912268-2022ce9509d8"],mtn:["photo-1464822759023-fed622ff2c3b","photo-1483728642387-6c3bdd6c93e5","photo-1519681393784-d120267933ba"],volcano:["photo-1462332420958-a05d1e002413","photo-1464822759023-fed622ff2c3b","photo-1486870591958-9b9d0d1dda99"],onsen:["photo-1545569341-9eb8b30979d9","photo-1584132967334-10e028bd69f7","photo-1540979388789-6cee28a1cdc9"],food:["photo-1504674900247-0877df9cc836","photo-1567620905732-2d1ec7ab7445","photo-1551218808-94e220e084d2"],ramen:["photo-1569718212165-3a8278d5f624","photo-1557872943-16a5ac26437e","photo-1617093727343-374698b1b08d"],sushi:["photo-1579871494447-9811cf80d66c","photo-1553621042-f6e147245754","photo-1580822184713-fc5400e7fe10"],bbq:["photo-1504674900247-0877df9cc836","photo-1546069901-ba9599a7e63c","photo-1567620905732-2d1ec7ab7445"],bar:["photo-1514933651103-005eec06c04b","photo-1436076863939-06870fe779c2","photo-1569529465841-dfecdab7503b"],beer:["photo-1535958636474-b021ee887b13","photo-1532634993-15f421e42ec0","photo-1558642452-9d2a7deb7f62"],whisky:["photo-1527281400683-1aae777175f8","photo-1569529465841-dfecdab7503b","photo-1514933651103-005eec06c04b"],coffee:["photo-1509042239860-f550ce710b93","photo-1495474472287-4d71bcdd2085","photo-1442512595331-e89e73853f31"],cafe:["photo-1445116572660-236099ec97a0","photo-1497935586351-b67a49e012bf","photo-1501339847302-ac426a4a7cbb"],temple:["photo-1478436127897-769e1b3f0f36","photo-1480796927426-f609979314bd","photo-1524413840807-0c3cb6fa808d"],shrine:["photo-1478436127897-769e1b3f0f36","photo-1480796927426-f609979314bd","photo-1545569341-9eb8b30979d9"],snow:["photo-1517783999520-f068d7431571","photo-1491002052546-bf38f186af56","photo-1478131143081-80f7f84ca84d"],dog:["photo-1605568427561-40dd23c2acea","photo-1548199973-03cce0bbc87b","photo-1517849845537-4d257902454a"],city:["photo-1542051841857-5f90071e7989","photo-1528360983277-13d401cdc186","photo-1540959733332-eab4deabeeaf"],market:["photo-1580822184713-fc5400e7fe10","photo-1553621042-f6e147245754","photo-1579871494447-9811cf80d66c"],park:["photo-1506905925346-21bda4d32df4","photo-1513635269975-59663e0ac1ad","photo-1470071459604-3b5ec3a7fe05"],art:["photo-1576511468792-5c9b54e7e4e7","photo-1459411552884-841db9b3cc2a","photo-1513364776144-60967b0f800f"],fireworks:["photo-1498931299472-f7a63a5a1cfa","photo-1533174072545-7a4b6ad7a6c3","photo-1467810563316-b5476525c0f9"],night:["photo-1533174072545-7a4b6ad7a6c3","photo-1519671482749-fd09be7ccebf","photo-1554797589-7241bb691973"],choco:["photo-1481391319762-47dff72954d9","photo-1549007994-cb92caebd54b","photo-1486427944544-d2c246c4df4d"],bear:["photo-1530595467537-0b5996c41f2d","photo-1474511320723-9a56873571b7","photo-1551918120-9739cb430c6d"],glass:["photo-1576511468792-5c9b54e7e4e7","photo-1459411552884-841db9b3cc2a","photo-1513364776144-60967b0f800f"],shop:["photo-1542051841857-5f90071e7989","photo-1528360983277-13d401cdc186","photo-1540959733332-eab4deabeeaf"],history:["photo-1480796927426-f609979314bd","photo-1528360983277-13d401cdc186","photo-1524413840807-0c3cb6fa808d"],farm:["photo-1559598467-f8b76c8155d0","photo-1486297678162-eb2a19b0a32d","photo-1550583724-b2692b85b150"],ice:["photo-1551538827-9c037cb4f32a","photo-1470338745628-171cf53de3a8","photo-1477601263568-180e2c6d046e"],adventure:["photo-1517783999520-f068d7431571","photo-1491002052546-bf38f186af56","photo-1478131143081-80f7f84ca84d"],spa:["photo-1600585154340-be6161a56a0c","photo-1540979388789-6cee28a1cdc9","photo-1584132967334-10e028bd69f7"],wine:["photo-1514933651103-005eec06c04b","photo-1436076863939-06870fe779c2","photo-1569529465841-dfecdab7503b"],museum:["photo-1480796927426-f609979314bd","photo-1513635269975-59663e0ac1ad","photo-1528360983277-13d401cdc186"]};
const img = (key) => (_p[key]||_p.city).map(id=>`https://images.unsplash.com/${id}?w=600&h=400&fit=crop`);

const DA = {
  rusutsu: [
    {name:"Lake Toya",nameJp:"洞爺湖",cat:"mustsee",travelMin:30,activityMin:60,rating:4.9,pop:true,desc:"One of Japan's most beautiful caldera lakes. Volcanic geopark, sculpture trail, and steaming views of Mt. Usu.",mapQuery:"Lake+Toya+Hokkaido",cost:"Free",tip:"The lakeside sculpture walk is world-class and almost nobody knows about it.",openH:7,closeH:17,images:img("lake")},
    {name:"Usuzan Ropeway",nameJp:"有珠山ロープウェイ",cat:"mustsee",travelMin:35,activityMin:75,rating:4.6,pop:true,desc:"Cable car up active volcano Mt. Usu with panoramic crater views and summit walking trails.",mapQuery:"Usuzan+Ropeway",cost:"¥¥",tip:"The summit trail overlooks the 2000 eruption crater — absolutely surreal.",openH:8,closeH:17,images:img("mtn")},
    {name:"Noboribetsu Jigokudani",nameJp:"登別地獄谷",cat:"mustsee",travelMin:45,activityMin:45,rating:4.7,pop:true,desc:"Hell Valley — volcanic crater with steaming vents, boiling streams, and sulfurous landscapes.",mapQuery:"Noboribetsu+Jigokudani",cost:"Free",tip:"The boardwalk at dawn is otherworldly — mist and steam everywhere.",openH:7,closeH:18,images:img("volcano")},
    {name:"Kyogoku Spring Water",nameJp:"京極ふきだし公園",cat:"mustsee",travelMin:25,activityMin:40,rating:4.5,desc:"Natural spring where 80,000 tons of crystal-clear water wells up daily from Mt. Yotei's base. Moss-covered stones in forested surroundings.",mapQuery:"Kyogoku+Spring+Water+Village",cost:"Free",tip:"Bring an empty bottle — officially some of the best drinking water in Japan.",openH:7,closeH:17,images:img("park")},
    {name:"Uo-teru Izakaya",nameJp:"魚照",cat:"eating",travelMin:5,activityMin:60,rating:4.6,pop:true,desc:"Seafood izakaya right outside the resort. Hokkaido's freshest catches, Wagyu sukiyaki, and outstanding pork shabu-shabu.",mapQuery:"Uo+Teru+Rusutsu",cost:"¥¥",tip:"Book ahead — this tiny spot fills up every night.",openH:17,closeH:22,images:img("sushi")},
    {name:"Mokumokuya BBQ",nameJp:"もくもく屋",cat:"eating",travelMin:5,activityMin:60,rating:4.5,pop:true,desc:"All-you-can-eat Genghis Khan lamb BBQ. Tender cuts grilled at your table with killer dipping sauce.",mapQuery:"Mokumokuya+Rusutsu",cost:"¥¥",tip:"Come hungry — the all-you-can-eat lamb is the best value dinner in Rusutsu.",openH:17,closeH:22,images:img("bbq")},
    {name:"TAKiBi Kimobetsu",nameJp:"TAKiBi",cat:"eating",travelMin:10,activityMin:75,rating:4.7,pop:true,desc:"Family-run izakaya since 2020 using foraged wild vegetables and local sashimi. The motsunabe hotpot is rich and perfect for sharing.",mapQuery:"TAKiBi+Kimobetsu",cost:"¥¥",tip:"Don't miss the motsunabe — offal and vegetables with garlic and chili. Book ahead.",openH:17,closeH:22,images:img("food")},
    {name:"Tanpopo Shokudo",nameJp:"たんぽぽ食堂",cat:"eating",travelMin:5,activityMin:50,rating:4.4,desc:"Casual izakaya famous for kaisen-don with sea urchin, eel, and tuna. Also great zangi and gyoza.",mapQuery:"Tanpopo+Shokudo+Rusutsu",cost:"¥",tip:"The lady who runs it makes you feel at home from the moment you walk in.",openH:17,closeH:22,images:img("food")},
    {name:"The Red House",nameJp:"ザ・レッドハウス",cat:"eating",travelMin:5,activityMin:60,rating:4.4,desc:"Fusion Japanese-Western. Shabu shabu, grilled lamb, good sake selection. Family-friendly.",mapQuery:"The+Red+House+Rusutsu",cost:"¥¥",tip:"Perfect for groups with different tastes — the menu covers everything.",openH:17,closeH:21,images:img("food")},
    {name:"Nabedokoro Yo-chan",nameJp:"鍋処よーちゃん",cat:"eating",travelMin:5,activityMin:60,rating:4.3,desc:"Warm hot-pot restaurant with Hokkaido lamb and pork nabe.",mapQuery:"Nabedokoro+Yochan+Rusutsu",cost:"¥¥",tip:"The lamb hot pot will warm you to the bone.",openH:17,closeH:21,images:img("food")},
    {name:"Kikoz Middle Eastern",nameJp:"キコズ",cat:"eating",travelMin:10,activityMin:45,rating:4.5,desc:"Middle Eastern-Hokkaido fusion in Kimobetsu. Run by Kiko-san. Falafels are a must. Vegan options available.",mapQuery:"Kikoz+Kimobetsu",cost:"¥",tip:"One of the only places in the region with real vegan options.",openH:11,closeH:14,images:img("food")},
    {name:"Fuka Japanese Cuisine",nameJp:"風花",cat:"eating",travelMin:3,activityMin:60,rating:4.5,desc:"Resort's premium Japanese restaurant. Local vegetables, seafood, and Wagyu teppanyaki and kaiseki.",mapQuery:"Fuka+Restaurant+Rusutsu+Resort",cost:"¥¥¥",tip:"The kaiseki course is the most refined meal in Rusutsu.",openH:17,closeH:21,images:img("sushi")},
    {name:"SEKKATEI Shabu-shabu",nameJp:"石花亭",cat:"eating",travelMin:3,activityMin:60,rating:4.3,desc:"Resort shabu-shabu buffet with premium Hokkaido pork and lamb.",mapQuery:"Sekkatei+Rusutsu+Resort",cost:"¥¥",tip:"The Japanese breakfast set here is a delightful way to start the day.",openH:7,closeH:21,images:img("food")},
    {name:"La queue crochet Café",nameJp:"ラ・キュー・クロシェ",cat:"eating",travelMin:5,activityMin:45,rating:4.4,desc:"Cozy café near Villa Rusutsu with juicy karaage and fluffy pancakes. Watch snowfall through expansive windows.",mapQuery:"La+queue+crochet+Rusutsu",cost:"¥",tip:"The pancakes are legitimately excellent — not resort filler food.",openH:10,closeH:16,images:img("cafe")},
    {name:"Potato Inn Papa",nameJp:"ポテトインパパ",cat:"eating",travelMin:10,activityMin:50,rating:4.3,desc:"Kimobetsu institution for 30+ years. European-Japanese comfort food in a cozy cottage.",mapQuery:"Potato+Inn+Papa+Kimobetsu",cost:"¥¥",tip:"Perfect comfort food for a snowy evening.",openH:11,closeH:20,images:img("food")},
    {name:"Kimobetsu Zangi Izakaya",nameJp:"喜茂別居酒屋",cat:"eating",travelMin:10,activityMin:50,rating:4.2,desc:"Long-standing Kimobetsu izakaya with counter and floor seating. Famous for zangi (Hokkaido fried chicken) and deep-fried yam.",mapQuery:"Kimobetsu+Izakaya",cost:"¥",tip:"The deep-fried yam is the sleeper hit — order it alongside the zangi.",openH:18,closeH:24,images:img("food")},
    {name:"Costa Terrazza Italian",nameJp:"コスタテラッツァ",cat:"eating",travelMin:3,activityMin:50,rating:4.2,desc:"Resort Italian with hearth-baked pizzas using Hokkaido wheat and dairy.",mapQuery:"Costa+Terrazza+Rusutsu+Resort",cost:"¥¥",tip:"The pizza dough uses Hokkaido wheat — noticeably better than typical resort food.",openH:11,closeH:21,images:img("food")},
    {name:"Michi no Eki Rusutsu",nameJp:"道の駅ルスツ",cat:"eating",travelMin:10,activityMin:45,rating:4.3,desc:"Roadside rest stop famous for Rusutsu pork butadon and legendary Hokkaido milk soft-serve.",mapQuery:"Michi+no+Eki+230+Rusutsu",cost:"¥",tip:"The soft-serve with local milk is worth the trip alone.",openH:9,closeH:17,images:img("food")},
    {name:"KANTEN Chinese",nameJp:"甘天",cat:"eating",travelMin:3,activityMin:50,rating:4.2,desc:"Resort Chinese that surprises with quality. Stir-fried shrimp in sweet chili sauce and pork in black sauce.",mapQuery:"Kanten+Rusutsu+Resort",cost:"¥¥",tip:"Looks unassuming but punches way above what you'd expect.",openH:11,closeH:21,images:img("food")},
    {name:"Rodeo Drive",nameJp:"ロデオドライブ",cat:"drinking",travelMin:5,activityMin:75,rating:4.4,pop:true,desc:"Rusutsu's longest-running bar (20+ years). Owner-chef smokes oysters 8 hours. Impressive whisky and draught Guinness.",mapQuery:"Rodeo+Drive+Rusutsu",cost:"¥¥",tip:"The smoked oysters with whisky is the signature. Opens 4pm with happy hour.",openH:16,closeH:24,images:img("bar")},
    {name:"Rusutsu Sakaba",nameJp:"ルスツ酒場",cat:"drinking",travelMin:5,activityMin:75,rating:4.5,desc:"Lively local favorite. Seafood hotpot, grilled squid, oysters — plus rare local brews and Belgian bottles.",mapQuery:"Rusutsu+Sakaba",cost:"¥¥",tip:"The craft beer selection is surprisingly deep.",openH:17,closeH:23,images:img("beer")},
    {name:"Orbist Bar",nameJp:"オービスト",cat:"drinking",travelMin:3,activityMin:60,rating:4.2,desc:"Resort's upscale cocktail bar. Candlelit, chic, extensive drink list.",mapQuery:"Orbist+Bar+Rusutsu+Resort",cost:"¥¥¥",tip:"The cover charge is steep but the atmosphere is genuinely classy.",openH:19,closeH:23,images:img("bar")},
    {name:"Pub Cricket",nameJp:"パブクリケット",cat:"drinking",travelMin:3,activityMin:60,rating:4.0,desc:"Resort sports bar with ski films and a mixed international crowd.",mapQuery:"Pub+Cricket+Rusutsu+Resort",cost:"¥¥",tip:"Closes 3-5:30pm so no true après — go after dinner.",openH:11,closeH:23,images:img("bar")},
    {name:"Youtei Izakaya",nameJp:"ようてい居酒屋",cat:"drinking",travelMin:5,activityMin:60,rating:4.1,desc:"Tiny izakaya with shabu shabu, Genghis Khan, and karaoke.",mapQuery:"Youtei+Izakaya+Rusutsu",cost:"¥¥",tip:"This is where the karaoke happens in Rusutsu.",openH:17,closeH:23,images:img("bar")},
    {name:"Toya Lakeside Café",nameJp:"洞爺カフェ",cat:"coffee",travelMin:30,activityMin:45,rating:4.4,desc:"Hand-drip coffee and pastries with mesmerizing winter lake views.",mapQuery:"Lake+Toya+Cafe",cost:"¥",tip:"The steam rising off the lake in winter is hypnotic.",openH:9,closeH:17,images:img("coffee")},
    {name:"Makkari Coffee Stand",nameJp:"真狩コーヒー",cat:"coffee",travelMin:25,activityMin:30,rating:4.3,desc:"Minimalist roadside stand with Mt. Yotei views and single-origin pour-over.",mapQuery:"Makkari+Coffee+Hokkaido",cost:"¥",tip:"On clear days, the best photo op in the region.",openH:9,closeH:16,images:img("coffee")},
    {name:"Rusutsu Resort Café",nameJp:"リゾートカフェ",cat:"coffee",travelMin:3,activityMin:30,rating:4.1,desc:"Freshly roasted beans and Hokkaido milk lattes in the South Wing.",mapQuery:"Rusutsu+Resort+Cafe",cost:"¥",tip:"The hot chocolate with local cream is the ultimate après drink.",openH:7,closeH:20,images:img("cafe")},
    {name:"Upopoy Ainu Museum",nameJp:"ウポポイ",cat:"cultural",travelMin:50,activityMin:90,rating:4.7,pop:true,desc:"National Ainu Museum — Japan's premier indigenous culture center. Essential.",mapQuery:"Upopoy+Ainu+Museum+Shiraoi",cost:"¥¥",tip:"Plan around the traditional dance performance schedule.",openH:9,closeH:17,images:img("museum")},
    {name:"Toya Sculpture Park",nameJp:"洞爺彫刻公園",cat:"cultural",travelMin:30,activityMin:45,rating:4.5,desc:"58 sculptures around the lake by international artists. Hidden outdoor art gem.",mapQuery:"Lake+Toya+Sculpture+Park",cost:"Free",tip:"Pick up the map — many sculptures are tucked behind trees.",openH:7,closeH:17,images:img("park")},
    {name:"Cheese & Ice Cream Making",nameJp:"チーズ＆アイス作り",cat:"cultural",travelMin:3,activityMin:60,rating:4.3,desc:"Hands-on workshops using Rusutsu Highland dairy. Make mozzarella or gelato from fresh local milk.",mapQuery:"Rusutsu+Resort+Cheese+Making",cost:"¥¥",tip:"You eat your own creation at the end.",openH:10,closeH:16,images:img("farm")},
    {name:"Kimobetsu Pottery",nameJp:"喜茂別陶芸",cat:"cultural",travelMin:20,activityMin:45,rating:4.1,desc:"Artist-run studio with pottery and woodcarving using local volcanic clay.",mapQuery:"Kimobetsu+Art+Studio",cost:"¥¥",tip:"They ship internationally — unique Hokkaido souvenir.",openH:10,closeH:16,images:img("art")},
    {name:"Date Jidaimura",nameJp:"伊達時代村",cat:"historical",travelMin:45,activityMin:120,rating:4.2,desc:"Edo-period ninja village with live martial arts shows, costumes, and ninja maze.",mapQuery:"Noboribetsu+Date+Jidaimura",cost:"¥¥",tip:"The ninja show has real stunts — not tourist fluff.",openH:9,closeH:17,images:img("history")},
    {name:"Toyako Visitor Center",nameJp:"洞爺湖ビジターセンター",cat:"historical",travelMin:30,activityMin:40,rating:4.3,desc:"Museum on Mt. Usu eruption history. The preserved buried houses from 2000 are haunting.",mapQuery:"Toyako+Visitor+Center",cost:"¥",tip:"The preserved damage sites outside are the most striking part.",openH:9,closeH:17,images:img("museum")},
    {name:"Rusutsu Village Shrine",nameJp:"ルスツ神社",cat:"historical",travelMin:10,activityMin:20,rating:4.0,desc:"Small local shrine with deep snow surrounding the torii.",mapQuery:"Rusutsu+Shrine+Hokkaido",cost:"Free",tip:"Come at sunset — the light through the trees is incredible.",openH:6,closeH:18,images:img("shrine")},
    {name:"Snowmobile Tour",nameJp:"スノーモービル",cat:"adventure",travelMin:10,activityMin:90,rating:4.7,pop:true,desc:"Guided snowmobile rides through pristine backcountry. Short scenic or long wilderness course.",mapQuery:"Rusutsu+Snowmobile+Tour",cost:"¥¥¥",tip:"Book the longer course — scenery gets dramatically better further out.",openH:8,closeH:16,images:img("snow")},
    {name:"Dog Sledding Rusutsu",nameJp:"犬ぞり",cat:"adventure",travelMin:5,activityMin:60,rating:4.6,desc:"Mush huskies through powder fields at the resort. Includes cuddle time before and after.",mapQuery:"Rusutsu+Dog+Sledding",cost:"¥¥¥",tip:"The resort's most popular non-ski activity — book ahead.",openH:9,closeH:15,images:img("dog")},
    {name:"Fat Bike Snow Tour",nameJp:"ファットバイク",cat:"adventure",travelMin:10,activityMin:75,rating:4.4,desc:"Oversized-tire bikes through snowy forest trails. Surprisingly stable and exhilarating.",mapQuery:"Rusutsu+Fat+Bike+Tour",cost:"¥¥",tip:"The guide knows trails that feel like riding through Narnia.",openH:9,closeH:15,images:img("adventure")},
    {name:"Ice Fishing at Toya",nameJp:"氷上ワカサギ釣り",cat:"adventure",travelMin:35,activityMin:90,rating:4.5,desc:"Fish for smelt through frozen lake. They fry your catch as tempura on the spot.",mapQuery:"Lake+Toya+Ice+Fishing",cost:"¥¥",tip:"Nothing tastes better than tempura fish caught five minutes ago.",openH:7,closeH:14,images:img("ice")},
    {name:"Horseback Riding",nameJp:"乗馬体験",cat:"adventure",travelMin:10,activityMin:60,rating:4.3,desc:"Hokkaido native horses through snowy meadows. Beginner-friendly.",mapQuery:"Rusutsu+Horse+Riding",cost:"¥¥",tip:"The horses are incredibly gentle.",openH:9,closeH:15,images:img("adventure")},
    {name:"Snowshoeing Trek",nameJp:"スノーシュー",cat:"adventure",travelMin:5,activityMin:90,rating:4.4,desc:"Guided snowshoe trek through forest. Snowfield orienteering course available.",mapQuery:"Rusutsu+Snowshoe+Trek",cost:"¥¥",tip:"Watch for fox and deer tracks in fresh powder.",openH:9,closeH:15,images:img("snow")},
    {name:"Snow Rafting",nameJp:"スノーラフティング",cat:"adventure",travelMin:5,activityMin:30,rating:4.3,desc:"Rubber raft pulled by snowmobile across powder fields.",mapQuery:"Rusutsu+Snow+Rafting",cost:"¥¥",tip:"Hold on tight through the turns.",openH:9,closeH:16,images:img("adventure")},
    {name:"Bear Park + Onsen",nameJp:"熊牧場",cat:"fun",travelMin:40,activityMin:90,rating:4.4,desc:"Feed Hokkaido brown bears from a deck, plus Noboribetsu hot springs.",mapQuery:"Noboribetsu+Bear+Park",cost:"¥¥",tip:"The bears catch food mid-air — sit front row.",openH:8,closeH:17,images:img("bear")},
    {name:"Giant Carousel",nameJp:"メリーゴーラウンド",cat:"fun",travelMin:3,activityMin:30,rating:4.2,desc:"World's largest indoor merry-go-round. Free. Don't miss the singing robot bear band.",mapQuery:"Rusutsu+Resort+Carousel",cost:"Free",tip:"The robot bear band is the weirdest thing in all of Hokkaido.",openH:13,closeH:21,images:img("city")},
    {name:"Indoor Wave Pool",nameJp:"ウェーブプール",cat:"fun",travelMin:3,activityMin:60,rating:4.1,desc:"Full indoor wave pool and waterslide. Almost never crowded in ski season.",mapQuery:"Rusutsu+Resort+Wave+Pool",cost:"¥¥",tip:"The best-kept secret at the resort — bring a swimsuit.",openH:10,closeH:21,images:img("city")},
    {name:"Snow Tubing Hill",nameJp:"スノーチュービング",cat:"fun",travelMin:5,activityMin:45,rating:4.3,desc:"Giant tubing hill lit up at night for a different experience.",mapQuery:"Rusutsu+Snow+Tubing",cost:"¥",tip:"Go at night when they light it up.",openH:9,closeH:20,images:img("snow")},
    {name:"Climbing Wall & Gym",nameJp:"クライミングウォール",cat:"fun",travelMin:3,activityMin:45,rating:4.0,desc:"Indoor climbing wall and full fitness gym. Multiple difficulty routes.",mapQuery:"Rusutsu+Resort+Climbing+Wall",cost:"¥",tip:"Good for burning energy when weather shuts down the mountain.",openH:10,closeH:20,images:img("city")},
    {name:"Rusutsu Amusement Park",nameJp:"ルスツ遊園地",cat:"fun",travelMin:3,activityMin:120,rating:4.3,desc:"Hokkaido's largest theme park — 8 rollercoasters, go-karts, Ferris wheel. Limited winter schedule but the indoor attractions stay open.",mapQuery:"Rusutsu+Resort+Amusement+Park",cost:"¥¥",tip:"Check winter schedule — some outdoor rides close but indoor attractions stay open.",openH:9,closeH:17,eventWindow:"Summer full / Winter limited",images:img("city")},
    {name:"Kotobuki Onsen",nameJp:"寿温泉",cat:"relaxing",travelMin:3,activityMin:60,rating:4.6,pop:true,desc:"Natural hot spring in the resort's North Wing. Panoramic mountain views. Family-friendly.",mapQuery:"Rusutsu+Resort+Kotobuki+Onsen",cost:"¥",tip:"Go when lifts open — you'll have it nearly to yourself.",openH:6,closeH:22,images:img("onsen")},
    {name:"Noboribetsu Grand Onsen",nameJp:"登別グランドホテル",cat:"relaxing",travelMin:45,activityMin:90,rating:4.6,desc:"Day-use onsen with Roman-style baths, waterfalls, and volcanic mineral water.",mapQuery:"Noboribetsu+Grand+Hotel+Onsen",cost:"¥¥",tip:"The waterfall bath is theatrical and therapeutic.",openH:8,closeH:21,images:img("spa")},
    {name:"Toya Sun Palace Spa",nameJp:"洞爺サンパレス",cat:"relaxing",travelMin:30,activityMin:75,rating:4.4,desc:"Lakeside resort with infinity-style baths overlooking Lake Toya.",mapQuery:"Toya+Sun+Palace+Onsen",cost:"¥¥",tip:"The outdoor infinity bath feels like soaking in the lake.",openH:10,closeH:20,images:img("onsen")},
    {name:"Westin Spa",nameJp:"ウェスティンスパ",cat:"relaxing",travelMin:3,activityMin:60,rating:4.3,desc:"Hot stone massage, aromatherapy, and sauna using volcanic stones.",mapQuery:"Westin+Rusutsu+Resort+Spa",cost:"¥¥¥",tip:"They use actual volcanic stones from the region.",openH:10,closeH:20,images:img("spa")},
    {name:"Michi no Eki Gift Shop",nameJp:"道の駅おみやげ",cat:"shopping",travelMin:10,activityMin:30,rating:4.2,desc:"Hokkaido specialties — Shiroi Koibito, Royce, dried scallops, melon jelly.",mapQuery:"Michi+no+Eki+230+Rusutsu",cost:"Varies",tip:"The melon jelly sets are top-tier omiyage.",openH:9,closeH:17,images:img("shop")},
    {name:"Toya Glass Art",nameJp:"洞爺ガラス館",cat:"shopping",travelMin:30,activityMin:40,rating:4.3,desc:"Glassware gallery with items made using volcanic sand.",mapQuery:"Lake+Toya+Glass+Art",cost:"Varies",tip:"Volcanic glass bowls are unique to this area.",openH:9,closeH:17,images:img("glass")},
    {name:"Daniel Street Plaza",nameJp:"ダニエルストリート",cat:"shopping",travelMin:3,activityMin:30,rating:4.0,desc:"Indoor shopping in the resort. Souvenirs, snacks, ski gear, Hokkaido-only Kit Kat flavors.",mapQuery:"Rusutsu+Resort+Daniel+Street",cost:"Varies",tip:"Hokkaido-only Kit Kat flavors you can't find in cities.",openH:9,closeH:21,images:img("shop")},
    {name:"Toya Winter Fireworks",nameJp:"洞爺冬花火",cat:"events",travelMin:30,activityMin:30,rating:4.7,desc:"Fireworks launched over Lake Toya. Reflection on water doubles the spectacle.",mapQuery:"Lake+Toya+Fireworks",cost:"Free",tip:"Check dates — select weekends Dec through March.",openH:18,closeH:21,eventWindow:"Dec–Mar weekends",images:img("fireworks")},
    {name:"Noboribetsu Oni Festival",nameJp:"登別鬼祭り",cat:"events",travelMin:45,activityMin:60,rating:4.5,desc:"Demon celebrations with parades and performances in Hell Valley.",mapQuery:"Noboribetsu+Oni+Festival",cost:"Free",tip:"The demon dancers in steam at night are spine-tingling.",openH:17,closeH:21,eventWindow:"Select winter dates",images:img("fireworks")},
    // ── ESSENTIALS ──
    {name:"Seicomart Rusutsu",nameJp:"セイコーマート",cat:"essentials",travelMin:5,activityMin:15,rating:4.3,pop:true,desc:"Hokkaido's beloved convenience store chain. Hot food, onigiri, cheap drinks, and basic toiletries. Way better than 7-Eleven for snacks.",mapQuery:"Seicomart+Rusutsu",cost:"¥",tip:"Seicomart is Hokkaido-only — their hot bento and 100-yen wine are local legends.",openH:6,closeH:23,images:img("shop")},
    {name:"7-Eleven Rusutsu",nameJp:"セブンイレブン",cat:"essentials",travelMin:5,activityMin:15,rating:4.1,desc:"Right across from the resort hotel. ATM (international cards), basic medicine, snacks, drinks. The Chu-Hi selection is impressive.",mapQuery:"7-Eleven+Rusutsu+Resort",cost:"¥",tip:"The ATM here accepts international cards — useful for cash-only izakayas nearby.",openH:0,closeH:24,images:img("shop")},
    {name:"Rusutsu Resort Convenience Shop",nameJp:"リゾートショップ",cat:"essentials",travelMin:3,activityMin:10,rating:4.0,desc:"In-resort shop with snacks, drinks, sunscreen, lip balm, hand warmers, basic medicine, and forgotten ski essentials.",mapQuery:"Rusutsu+Resort+Shop",cost:"¥¥",tip:"Resort prices but it has everything you'd need in a pinch — including hand warmers.",openH:8,closeH:21,images:img("shop")},
    {name:"Kimobetsu Pharmacy",nameJp:"喜茂別薬局",cat:"essentials",travelMin:12,activityMin:15,rating:4.0,desc:"Small town pharmacy in Kimobetsu. Over-the-counter medicine, first aid, and health supplies.",mapQuery:"Pharmacy+Kimobetsu+Hokkaido",cost:"¥",tip:"If you need anything the convenience stores don't carry, this is your closest option.",openH:9,closeH:18,images:img("shop")},
    // ── LIQUOR ──
    {name:"Seicomart Wine & Beer",nameJp:"セイコーマート酒",cat:"liquor",travelMin:5,activityMin:10,rating:4.3,pop:true,desc:"Seicomart has the best cheap alcohol in Hokkaido. Famous ¥100 wine, Sapporo Classic (Hokkaido-only), Chu-Hi, local sake.",mapQuery:"Seicomart+Rusutsu",cost:"¥",tip:"The ¥100 wine is legitimately drinkable. Sapporo Classic is Hokkaido-exclusive — stock up.",openH:6,closeH:23,images:img("wine")},
    {name:"7-Eleven Beer & Spirits",nameJp:"セブンイレブン酒",cat:"liquor",travelMin:5,activityMin:10,rating:4.0,desc:"Good selection of Japanese craft beer, whisky minis, sake, and Strong Zero. Beer vending machines also in the hotel.",mapQuery:"7-Eleven+Rusutsu+Resort",cost:"¥",tip:"Strong Zero at 9% is the unofficial après-ski drink of budget-conscious skiers.",openH:0,closeH:24,images:img("beer")},
    {name:"Rusutsu Sakaba Takeaway",nameJp:"ルスツ酒場テイクアウト",cat:"liquor",travelMin:5,activityMin:10,rating:4.4,desc:"The izakaya also sells bottles to go — rare local sake, craft beer, and Belgian bottles you won't find at convenience stores.",mapQuery:"Rusutsu+Sakaba",cost:"¥¥",tip:"Ask what local sake they recommend — they carry bottles you can't find in stores.",openH:17,closeH:23,images:img("beer")},
    {name:"Resort Night Shows",nameJp:"ナイトショー",cat:"events",travelMin:3,activityMin:45,rating:4.1,desc:"Nightly entertainment — taiko drumming, fountain light shows, seasonal performances.",mapQuery:"Rusutsu+Resort+Entertainment",cost:"¥",tip:"The taiko performance is genuinely powerful.",openH:19,closeH:21,eventWindow:"Nightly Dec–Mar",images:img("night")},
  ],
  niseko: [
    {name:"Dog Sledding",nameJp:"犬ぞり体験",cat:"mustsee",travelMin:25,activityMin:90,rating:4.8,pop:true,desc:"Mush Alaskan huskies through powder fields with Mt. Yotei backdrop.",mapQuery:"Niseko+Dog+Sledding",cost:"¥¥¥",tip:"Cuddle time before and after. Book well ahead.",openH:8,closeH:15,images:img("dog")},
    {name:"Yukoro Onsen",nameJp:"雪秩父温泉",cat:"mustsee",travelMin:15,activityMin:60,rating:4.8,pop:true,desc:"Rustic outdoor springs in birch forest. Multiple pools surrounded by falling snow.",mapQuery:"Yukoro+Onsen+Niseko",cost:"¥",tip:"The rotenburo during snowfall is a core Japan memory.",openH:7,closeH:21,images:img("onsen")},
    {name:"Mt. Yotei Viewpoint",nameJp:"羊蹄山ビュー",cat:"mustsee",travelMin:15,activityMin:20,rating:4.7,desc:"Multiple viewpoints of Hokkaido's 'mini Fuji'. Best at sunrise or golden hour.",mapQuery:"Mt+Yotei+Viewpoint+Niseko",cost:"Free",tip:"Makkari viewpoint is most photogenic — fewer crowds.",openH:6,closeH:18,images:img("mtn")},
    {name:"Rakuichi Soba",nameJp:"楽一",cat:"eating",travelMin:10,activityMin:50,rating:4.8,pop:true,desc:"Niseko's most popular restaurant. Handcrafted soba kaiseki — buckwheat noodles paired with traditional kaiseki.",mapQuery:"Rakuichi+Soba+Niseko",cost:"¥¥",tip:"Reservations essential — the hardest table in Niseko.",openH:11,closeH:21,images:img("food")},
    {name:"Takahashi Dairy",nameJp:"高橋牧場",cat:"eating",travelMin:10,activityMin:40,rating:4.7,pop:true,desc:"Farm-fresh milk, cheese, legendary milk puffs. Mt. Yotei views from terrace.",mapQuery:"Takahashi+Dairy+Farm+Niseko",cost:"¥",tip:"Get two milk puffs — you'll wish you had.",openH:9,closeH:18,images:img("farm")},
    {name:"Ebisutei Izakaya",nameJp:"えびす亭",cat:"eating",travelMin:5,activityMin:60,rating:4.5,desc:"Local izakaya below the Hirafu intersection. One of the few places serving oden — daikon, eggs, fishcakes in soy-dashi broth. Deep-fried oysters are legendary.",mapQuery:"Ebisutei+Niseko+Hirafu",cost:"¥¥",tip:"Deep-fried oysters on the half-shell with Yebisu beer is the local order.",openH:17,closeH:22,images:img("food")},
    {name:"Gokoro Udon",nameJp:"ごころ",cat:"eating",travelMin:8,activityMin:40,rating:4.6,desc:"Authentic Shikoku-style udon made fresh daily. Mt. Yotei views. Closes when noodles sell out.",mapQuery:"Gokoro+Udon+Niseko",cost:"¥",tip:"Get there early — they literally close when noodles run out.",openH:11,closeH:14,images:img("food")},
    {name:"Sushi Shin by Miyakawa",nameJp:"鮨しん",cat:"eating",travelMin:10,activityMin:50,rating:4.7,desc:"Edomae sushi by 3-Michelin-starred Masaaki Miyakawa. Daily fish from Otaru port.",mapQuery:"Sushi+Shin+Niseko",cost:"¥¥¥",tip:"Sit at the counter and trust the omakase.",openH:17,closeH:22,images:img("sushi")},
    {name:"PST Niseko Pizza",nameJp:"ピーエスティー",cat:"eating",travelMin:8,activityMin:45,rating:4.5,desc:"Tokyo's Pizza Studio Tamaki in Niseko. Japanese-born pizza — light aromatic dough that's neither Neapolitan nor American.",mapQuery:"PST+Niseko+Pizza",cost:"¥¥",tip:"The pizza style is genuinely different from anything you've had.",openH:11,closeH:21,images:img("food")},
    {name:"Markie Curry",nameJp:"マーキーカレー",cat:"eating",travelMin:8,activityMin:40,rating:4.4,desc:"Beloved Hokkaido soup curry. Customize your base, spice level, and toppings.",mapQuery:"Markie+Curry+Niseko",cost:"¥",tip:"Spice level 5 is legit hot — start at 3.",openH:11,closeH:21,images:img("food")},
    {name:"Chiharu Zushi",nameJp:"ちはる鮨",cat:"eating",travelMin:15,activityMin:50,rating:4.5,desc:"Hidden sushi in Kutchan back streets. Only 27 seats — watch Maeda-san hand-roll each piece.",mapQuery:"Chiharu+Zushi+Kutchan",cost:"¥¥",tip:"The intimacy of watching the chef at this scale is the whole point.",openH:17,closeH:22,images:img("sushi")},
    {name:"PattyDaddyBurger",nameJp:"パティダディ",cat:"eating",travelMin:5,activityMin:35,rating:4.3,desc:"Juicy burgers and local craft beers in a stylish American diner.",mapQuery:"PattyDaddyBurger+Niseko",cost:"¥¥",tip:"The Wagyu burger is obviously the move.",openH:11,closeH:21,images:img("food")},
    {name:"Niseko Gelato",nameJp:"ニセコジェラート",cat:"eating",travelMin:10,activityMin:25,rating:4.6,desc:"Artisan gelato with Niseko milk. Lavender honey, melon, and fresh milk flavors.",mapQuery:"Niseko+Gelato",cost:"¥",tip:"The fresh milk flavor is the sleeper hit.",openH:10,closeH:18,images:img("farm")},
    {name:"B.C.C. Whiterock Pizza",nameJp:"ホワイトロック",cat:"eating",travelMin:12,activityMin:45,rating:4.4,desc:"Huge shareable pizzas loved by locals and visitors between Hirafu and Kutchan.",mapQuery:"BCC+Whiterock+Niseko",cost:"¥¥",tip:"Order one less than you think — they're enormous.",openH:11,closeH:14,images:img("food")},
    {name:"Hanayoshi Sushi",nameJp:"花よし",cat:"eating",travelMin:10,activityMin:50,rating:4.5,desc:"Owner-chef personally visits the market each morning. The freshest fish in Niseko, guaranteed.",mapQuery:"Hanayoshi+Sushi+Niseko",cost:"¥¥",tip:"Ask what he picked up at the market this morning — that's what to order.",openH:17,closeH:22,images:img("sushi")},
    {name:"Bar Gyu+ (Fridge Door)",nameJp:"バーギュウ",cat:"drinking",travelMin:5,activityMin:75,rating:4.6,pop:true,desc:"Hidden speakeasy behind a fridge door. Rare Japanese whiskies, craft brews, hot and cold cocktails.",mapQuery:"Bar+Gyu+Niseko+Hirafu",cost:"¥¥",tip:"250m down from traffic lights into lower village. Look for the fridge.",openH:17,closeH:24,images:img("whisky")},
    {name:"Wild Bill's",nameJp:"ワイルドビルズ",cat:"drinking",travelMin:5,activityMin:75,rating:4.4,pop:true,desc:"Legendary après-ski bar. Live music, dancing, Mexican food, packed international crowd.",mapQuery:"Wild+Bills+Niseko",cost:"¥¥",tip:"Thursday nights have the best live music — packed by 10PM.",openH:16,closeH:24,images:img("bar")},
    {name:"Niseko Confidential",nameJp:"ニセココンフィデンシャル",cat:"drinking",travelMin:5,activityMin:75,rating:4.6,desc:"From Tokyo Confidential creators. Stylish cocktail bar with A5 Wagyu course. Most sophisticated après in Niseko.",mapQuery:"Niseko+Confidential+Hirafu",cost:"¥¥¥",tip:"The cocktails are award-winning — not typical ski bar drinks.",openH:17,closeH:24,images:img("bar")},
    {name:"Tepache Mexican",nameJp:"テパチェ",cat:"drinking",travelMin:5,activityMin:60,rating:4.5,desc:"Hokkaido's largest agave collection. Mezcal, modern Mexican plates, tequila-fuelled fiesta.",mapQuery:"Tepache+Niseko+Hirafu",cost:"¥¥",tip:"The mezcal flight is an education — ask the bartender to guide you.",openH:17,closeH:24,images:img("bar")},
    {name:"Toshiro's Bar",nameJp:"トシローズバー",cat:"drinking",travelMin:5,activityMin:60,rating:4.5,desc:"Award-winning cocktail and whisky bar. Fine spirits from all over the world.",mapQuery:"Toshiros+Bar+Niseko",cost:"¥¥",tip:"Let Toshiro make something off-menu — he reads what you want.",openH:18,closeH:24,images:img("whisky")},
    {name:"Half Note Bar",nameJp:"ハーフノート",cat:"drinking",travelMin:5,activityMin:60,rating:4.3,desc:"Live music venue in Hirafu. Trivia, bingo, and event nights.",mapQuery:"Half+Note+Bar+Niseko",cost:"¥¥",tip:"Trivia night is surprisingly competitive.",openH:17,closeH:24,images:img("night")},
    {name:"Niseko Taproom",nameJp:"ニセコタップルーム",cat:"drinking",travelMin:10,activityMin:75,rating:4.5,desc:"Microbrewery pouring fresh Hokkaido craft ales. Smoked porter is perfection.",mapQuery:"Niseko+Taproom+Hirafu",cost:"¥¥",tip:"Ask for a tasting flight.",openH:15,closeH:23,images:img("beer")},
    {name:"Niseko Distillery",nameJp:"ニセコ蒸溜所",cat:"drinking",travelMin:15,activityMin:45,rating:4.4,desc:"Local distillery producing gin and soon whisky. Tours and tastings.",mapQuery:"Niseko+Distillery",cost:"¥¥",tip:"The botanical gin uses Hokkaido ingredients you won't find elsewhere.",openH:10,closeH:17,images:img("whisky")},
    {name:"Outdoor Ice Bar",nameJp:"アイスバー",cat:"drinking",travelMin:10,activityMin:45,rating:4.5,desc:"Seasonal pop-up made entirely of ice. Drinks in ice glasses. Magical at dusk.",mapQuery:"Niseko+Ice+Bar",cost:"¥¥",tip:"Go at dusk when they light the ice walls — glows blue.",openH:16,closeH:22,images:img("ice")},
    {name:"Hidden Stand",nameJp:"ヒドゥンスタンド",cat:"coffee",travelMin:5,activityMin:35,rating:4.7,pop:true,desc:"Hidden gem café. Some of Hokkaido's best coffee plus homemade pastries. Adorable dog Kobe is the bar(k)ista.",mapQuery:"Hidden+Stand+Coffee+Niseko",cost:"¥",tip:"The banana bread sells out early.",openH:8,closeH:16,images:img("coffee")},
    {name:"Sprout Coffee",nameJp:"スプラウト",cat:"coffee",travelMin:12,activityMin:35,rating:4.6,desc:"Kutchan Station's only specialty roaster. Single-origin beans roasted on-site.",mapQuery:"Sprout+Coffee+Kutchan",cost:"¥",tip:"The flat white with Niseko milk is ridiculous.",openH:8,closeH:17,images:img("coffee")},
    {name:"Green Farm Café",nameJp:"グリーンファーム",cat:"coffee",travelMin:12,activityMin:35,rating:4.4,desc:"Organic café on a working farm. Seasonal drinks with farm-grown herbs.",mapQuery:"Green+Farm+Cafe+Niseko",cost:"¥",tip:"The lavender latte in winter is unexpectedly perfect.",openH:9,closeH:17,images:img("cafe")},
    {name:"Graubünden Swiss Café",nameJp:"グラウビュンデン",cat:"coffee",travelMin:5,activityMin:30,rating:4.3,desc:"Swiss-inspired café. Homemade sandwiches, granola, excellent coffee.",mapQuery:"Graubunden+Cafe+Niseko",cost:"¥",tip:"Best grab-and-go breakfast in Hirafu.",openH:7,closeH:16,images:img("cafe")},
    {name:"Akaru Gallery Restaurant",nameJp:"アカル",cat:"cultural",travelMin:10,activityMin:50,rating:4.4,desc:"Restaurant and art gallery. Inventive vegetarian-friendly fare by a husband-wife duo alongside rotating artwork.",mapQuery:"Akaru+Restaurant+Niseko",cost:"¥¥",tip:"One of the few places in Niseko with serious vegetarian options.",openH:17,closeH:22,images:img("art")},
    {name:"Glass Studio",nameJp:"硝子工房",cat:"cultural",travelMin:20,activityMin:60,rating:4.3,desc:"Blow your own glass ornament or cup. Ship worldwide.",mapQuery:"Glass+Studio+Niseko",cost:"¥¥",tip:"Makes a meaningful souvenir you actually made yourself.",openH:9,closeH:17,images:img("glass")},
    {name:"Kimono Snow Walk",nameJp:"着物体験",cat:"cultural",travelMin:10,activityMin:60,rating:4.4,desc:"Traditional winter kimono in the snow-covered village for photos.",mapQuery:"Niseko+Kimono+Experience",cost:"¥¥",tip:"Photos in kimono against snow are incredible.",openH:10,closeH:16,images:img("temple")},
    {name:"Soga Shrine",nameJp:"曽我神社",cat:"historical",travelMin:20,activityMin:30,rating:4.1,desc:"Mountain shrine surrounded by ancient trees. Deep, peaceful.",mapQuery:"Soga+Shrine+Niseko",cost:"Free",tip:"The torii framed by snow-covered trees is unforgettable.",openH:6,closeH:18,images:img("shrine")},
    {name:"Kutchan History Museum",nameJp:"倶知安風土館",cat:"historical",travelMin:15,activityMin:40,rating:4.0,desc:"Ainu settlement to ski resort development. Fascinating old ski equipment.",mapQuery:"Kutchan+Museum",cost:"¥",tip:"The ski gear evolution display is surprisingly interesting.",openH:9,closeH:17,images:img("museum")},
    {name:"Niseko Railway Heritage",nameJp:"ニセコ鉄道遺産",cat:"historical",travelMin:12,activityMin:30,rating:4.1,desc:"Preserved Meiji-era railway station and train cars.",mapQuery:"Niseko+Railway+Station",cost:"Free",tip:"The station building is a Meiji-era gem.",openH:8,closeH:17,images:img("history")},
    {name:"Snowshoe Trek",nameJp:"スノーシュー",cat:"adventure",travelMin:15,activityMin:120,rating:4.7,pop:true,desc:"Guided trek through old-growth birch forest. Spot fox and deer tracks.",mapQuery:"Niseko+Snowshoe+Tour",cost:"¥¥",tip:"Morning tours have the best chance of Ezo red foxes.",openH:7,closeH:15,images:img("snow")},
    {name:"Backcountry Cat Skiing",nameJp:"キャットスキー",cat:"adventure",travelMin:20,activityMin:180,rating:4.9,desc:"Snowcat to untouched powder inaccessible by lift. The ultimate Niseko experience.",mapQuery:"Niseko+Cat+Skiing",cost:"¥¥¥",tip:"Book months ahead — sells out fastest.",openH:8,closeH:15,images:img("adventure")},
    {name:"Horseback Snow Riding",nameJp:"乗馬体験",cat:"adventure",travelMin:20,activityMin:60,rating:4.3,desc:"Hokkaido native horses through snowy meadows. Beginner-friendly.",mapQuery:"Niseko+Horse+Riding",cost:"¥¥",tip:"No riding experience needed.",openH:9,closeH:15,images:img("adventure")},
    {name:"Snow Rafting",nameJp:"スノーラフティング",cat:"fun",travelMin:15,activityMin:40,rating:4.4,desc:"Rubber raft pulled by snowmobile. Pure adrenaline.",mapQuery:"Niseko+Snow+Rafting",cost:"¥¥",tip:"Hold tight through the turns.",openH:9,closeH:16,images:img("adventure")},
    {name:"Niseko Gondola Views",nameJp:"ゴンドラ観光",cat:"fun",travelMin:10,activityMin:45,rating:4.3,desc:"Scenic gondola for non-skiers. Heated viewing deck at top.",mapQuery:"Niseko+Village+Gondola",cost:"¥¥",tip:"Heated deck means you don't need to brave the wind.",openH:9,closeH:16,images:img("mtn")},
    {name:"Hirafu Night Walk",nameJp:"ひらふ夜散歩",cat:"fun",travelMin:5,activityMin:45,rating:4.2,desc:"The lit-up strip at night — window shopping, people watching, tiny hidden bars.",mapQuery:"Hirafu+Main+Street+Niseko",cost:"Free",tip:"Side alleys have the best hidden bars — follow stairs up.",openH:17,closeH:23,images:img("night")},
    {name:"Annupuri Onsen",nameJp:"アンヌプリ温泉",cat:"relaxing",travelMin:15,activityMin:60,rating:4.5,desc:"Quiet onsen away from Hirafu crowds. Milky mineral water, birch trees.",mapQuery:"Niseko+Annupuri+Onsen",cost:"¥",tip:"The locals' choice — half the price, twice the peace.",openH:7,closeH:21,images:img("onsen")},
    {name:"Konbu Onsen",nameJp:"昆布温泉",cat:"relaxing",travelMin:20,activityMin:60,rating:4.6,desc:"Forest onsen with unique silky water. Skin comes out impossibly soft.",mapQuery:"Konbu+Onsen+Niseko",cost:"¥",tip:"The water texture is completely different from other onsen.",openH:8,closeH:21,images:img("onsen")},
    {name:"Park Hyatt Spa",nameJp:"パークハイアットスパ",cat:"relaxing",travelMin:15,activityMin:90,rating:4.7,desc:"World-class spa. Full treatment menu with volcanic hot stones.",mapQuery:"Park+Hyatt+Niseko+Spa",cost:"¥¥¥",tip:"The most luxurious spa in all of Niseko — splurge-worthy.",openH:10,closeH:20,images:img("spa")},
    {name:"Hirafu Main Street",nameJp:"ひらふ通り",cat:"shopping",travelMin:5,activityMin:45,rating:4.3,desc:"Ski shops, boutiques, convenience stores, souvenir spots.",mapQuery:"Hirafu+Main+Street+Niseko",cost:"Varies",tip:"Rhythm Niseko has the best secondhand ski gear.",openH:9,closeH:22,images:img("shop")},
    {name:"Niseko Cheese Factory",nameJp:"チーズ工房",cat:"shopping",travelMin:15,activityMin:30,rating:4.5,desc:"Artisan Hokkaido cheese from the maker. Tasting available.",mapQuery:"Niseko+Cheese+Factory",cost:"Varies",tip:"Smoked camembert travels well — incredible gift.",openH:9,closeH:17,images:img("farm")},
    {name:"Kutchan Town Shopping",nameJp:"倶知安買い物",cat:"shopping",travelMin:15,activityMin:45,rating:4.2,desc:"Where locals shop. Non-tourist prices on everything.",mapQuery:"Kutchan+Town+Center",cost:"Varies",tip:"Prices 30-40% cheaper than anything in Hirafu.",openH:9,closeH:18,images:img("shop")},
    {name:"Niseko Night Market",nameJp:"ナイトマーケット",cat:"events",travelMin:5,activityMin:60,rating:4.5,desc:"Seasonal evening market with crafts, hot food stalls, live music.",mapQuery:"Niseko+Village+Night+Market",cost:"¥",tip:"The yakitori stalls are the real draw.",openH:17,closeH:21,eventWindow:"Dec–Mar weekends",images:img("night")},
    {name:"Hanazono Lantern Walk",nameJp:"花園ランタン",cat:"events",travelMin:15,activityMin:45,rating:4.6,desc:"Guided walk through a lantern-lit forest trail.",mapQuery:"Hanazono+Lantern+Walk+Niseko",cost:"¥¥",tip:"Book 7PM — darkness makes the lanterns more impactful.",openH:17,closeH:20,eventWindow:"Dec–Mar nightly",images:img("fireworks")},
    {name:"Après Concert Series",nameJp:"アプレスキーコンサート",cat:"events",travelMin:10,activityMin:60,rating:4.3,desc:"Weekly live music at various venues. Jazz, acoustic, local bands.",mapQuery:"Niseko+Live+Music+Concert",cost:"¥",tip:"Check Niseko United events page — lineup changes weekly.",openH:18,closeH:22,eventWindow:"Dec–Mar weekly",images:img("night")},
    // ── ESSENTIALS ──
    {name:"Seicomart Hirafu",nameJp:"セイコーマートひらふ",cat:"essentials",travelMin:5,activityMin:15,rating:4.3,pop:true,desc:"Hokkaido's beloved convenience store on the main street. Hot food, toiletries, medicine, and the famous ¥100 wine. Better snack selection than Lawson.",mapQuery:"Seicomart+Hirafu+Niseko",cost:"¥",tip:"Their hot katsu sandwich and coffee combo is the best quick lunch in Hirafu.",openH:6,closeH:23,images:img("shop")},
    {name:"Lawson Hirafu",nameJp:"ローソンひらふ",cat:"essentials",travelMin:5,activityMin:15,rating:4.1,desc:"Convenience store with ATM, basic medicine, snacks, hot drinks, and toiletries. Open 24/7.",mapQuery:"Lawson+Hirafu+Niseko",cost:"¥",tip:"The ATM accepts international cards. Good for Strong Zero runs at 2am.",openH:0,closeH:24,images:img("shop")},
    {name:"Kutchan Co-op Supermarket",nameJp:"くっちゃんコープ",cat:"essentials",travelMin:15,activityMin:30,rating:4.2,desc:"Full supermarket in Kutchan town. Fresh produce, meat, deli, household items, and pharmacy section. Real grocery prices (way cheaper than resort).",mapQuery:"Coop+Supermarket+Kutchan",cost:"¥",tip:"Stock up here if you have a kitchen — prices are 40-50% cheaper than Hirafu shops.",openH:9,closeH:21,images:img("shop")},
    {name:"Niseko Pharmacy",nameJp:"ニセコ薬局",cat:"essentials",travelMin:15,activityMin:15,rating:4.0,desc:"Pharmacy in Kutchan with over-the-counter medicine, first aid, cold remedies, and health supplies.",mapQuery:"Pharmacy+Kutchan+Niseko",cost:"¥",tip:"Japanese cold medicine (パブロン Pabron) works incredibly well — ask for it by name.",openH:9,closeH:18,images:img("shop")},
    {name:"Niseko Hirafu Ski Shop Supplies",nameJp:"ひらふスキーショップ",cat:"essentials",travelMin:5,activityMin:20,rating:4.1,desc:"Multiple shops on the main street stock sunscreen, hand warmers, lip balm, toe warmers, neck gaiters, and forgotten winter essentials.",mapQuery:"Rhythm+Niseko+Hirafu",cost:"¥¥",tip:"Rhythm has the widest selection — including last-minute gear rental.",openH:8,closeH:21,images:img("shop")},
    // ── LIQUOR ──
    {name:"Seicomart Hirafu Liquor",nameJp:"セイコーマート酒",cat:"liquor",travelMin:5,activityMin:10,rating:4.3,pop:true,desc:"Best bang-for-buck alcohol in Niseko. Famous ¥100 wine, Sapporo Classic (Hokkaido-only), local sake, Chu-Hi, and craft beer options.",mapQuery:"Seicomart+Hirafu+Niseko",cost:"¥",tip:"Sapporo Classic is only sold in Hokkaido — grab a six-pack for the room.",openH:6,closeH:23,images:img("wine")},
    {name:"Niseko Wine & Spirits",nameJp:"ニセコワイン",cat:"liquor",travelMin:10,activityMin:20,rating:4.4,desc:"Dedicated wine and spirits shop with Hokkaido wines from Yoichi and余市, Japanese whisky, and craft sake.",mapQuery:"Niseko+Wine+Shop",cost:"¥¥",tip:"Yoichi wines are rarely exported — this is your chance to try them.",openH:10,closeH:20,images:img("wine")},
    {name:"Kutchan Liquor Store",nameJp:"倶知安酒店",cat:"liquor",travelMin:15,activityMin:20,rating:4.2,desc:"Full liquor store in Kutchan town with local prices (much cheaper than Hirafu). Wide sake, whisky, and beer selection.",mapQuery:"Liquor+Store+Kutchan",cost:"¥",tip:"Local prices — a bottle of good sake here costs half what it does in the village.",openH:10,closeH:21,images:img("beer")},
    {name:"Lawson Strong Zero & Craft Beer",nameJp:"ローソン酒",cat:"liquor",travelMin:5,activityMin:10,rating:4.0,desc:"24-hour convenience store alcohol. Strong Zero, Sapporo Classic, Kirin, Asahi, canned highballs, and mini whisky bottles.",mapQuery:"Lawson+Hirafu+Niseko",cost:"¥",tip:"The canned whisky highballs are surprisingly good — and ¥200 each.",openH:0,closeH:24,images:img("beer")},
  ],
  sapporo: [
    {name:"Nijo Market",nameJp:"二条市場",cat:"mustsee",travelMin:10,activityMin:60,rating:4.6,pop:true,desc:"Historic fish market. Uni, crab, and seafood donburi at the source.",mapQuery:"Nijo+Market+Sapporo",cost:"¥¥",tip:"The uni is Hokkaido's best — sweet, creamy, zero fishiness.",openH:7,closeH:18,images:img("market")},
    {name:"Genghis Khan Daruma",nameJp:"だるま",cat:"mustsee",travelMin:10,activityMin:60,rating:4.8,pop:true,desc:"Hokkaido's signature lamb BBQ on a dome. Bucket-list essential.",mapQuery:"Daruma+Genghis+Khan+Sapporo",cost:"¥¥",tip:"Arrive 15min before opening or expect 30+ min wait.",openH:11,closeH:23,images:img("bbq")},
    {name:"Mt. Moiwa Ropeway",nameJp:"もいわ山ロープウェイ",cat:"mustsee",travelMin:20,activityMin:60,rating:4.7,pop:true,desc:"Best panoramic view of Sapporo. Night city lights are spectacular.",mapQuery:"Mt+Moiwa+Ropeway+Sapporo",cost:"¥¥",tip:"Go at sunset — daytime panorama and night view in one visit.",openH:11,closeH:22,images:img("mtn")},
    {name:"Odori Park & TV Tower",nameJp:"大通公園",cat:"mustsee",travelMin:10,activityMin:45,rating:4.5,desc:"Sapporo's central park with TV Tower observation deck.",mapQuery:"Odori+Park+Sapporo+TV+Tower",cost:"¥",tip:"Night views from the tower are dramatically better than daytime.",openH:9,closeH:22,images:img("city")},
    {name:"Ramen Yokocho",nameJp:"ラーメン横丁",cat:"eating",travelMin:10,activityMin:40,rating:4.5,pop:true,desc:"Legendary ramen alley with 17 shops. Birthplace of Sapporo miso ramen.",mapQuery:"Sapporo+Ramen+Yokocho",cost:"¥",tip:"Shirakaba Sanso has the most unique broth.",openH:11,closeH:23,images:img("ramen")},
    {name:"Soup Curry Suage",nameJp:"スープカレーすあげ",cat:"eating",travelMin:10,activityMin:45,rating:4.6,pop:true,desc:"Sapporo's signature dish — fragrant curry broth with crispy fried chicken.",mapQuery:"Suage+Soup+Curry+Sapporo",cost:"¥",tip:"Spice level 3 is the sweet spot.",openH:11,closeH:22,images:img("food")},
    {name:"Jogai Market Seafood",nameJp:"場外市場海鮮丼",cat:"eating",travelMin:15,activityMin:45,rating:4.7,desc:"Seafood bowls at the wholesale market. Even fresher than Nijo.",mapQuery:"Sapporo+Jogai+Market",cost:"¥¥",tip:"The mixed bowl with uni is the local's order.",openH:6,closeH:15,images:img("sushi")},
    {name:"Soba Making at Mondo",nameJp:"そば打ち体験",cat:"eating",travelMin:10,activityMin:90,rating:4.7,desc:"Hands-on soba class at a real soba shop. Make, cut, and eat your own noodles.",mapQuery:"Mondo+Soba+Experience+Sapporo",cost:"¥¥",tip:"Sapporo's most popular food experience — book ahead.",openH:10,closeH:18,images:img("food")},
    {name:"Zangi Naruto",nameJp:"ザンギなると",cat:"eating",travelMin:10,activityMin:30,rating:4.4,desc:"Hokkaido's crispier, bolder fried chicken. Recipe unchanged for decades.",mapQuery:"Naruto+Zangi+Sapporo",cost:"¥",tip:"The secret batter recipe is decades old.",openH:11,closeH:22,images:img("food")},
    {name:"Seafood Buffet Nanda",nameJp:"ナンダ海鮮ブッフェ",cat:"eating",travelMin:10,activityMin:75,rating:4.6,desc:"All-you-can-eat crab, uni, and fresh seafood. Crab pincer meat comes out perfectly intact.",mapQuery:"Nanda+Seafood+Buffet+Sapporo",cost:"¥¥¥",tip:"The quality of crab blows away any other buffet.",openH:11,closeH:22,images:img("sushi")},
    {name:"Sapporo Beer Garden BBQ",nameJp:"サッポロビール園ジンギスカン",cat:"eating",travelMin:15,activityMin:75,rating:4.5,desc:"All-you-can-drink beer + all-you-can-eat BBQ in the iconic red brick complex.",mapQuery:"Sapporo+Beer+Garden+Genghis+Khan",cost:"¥¥",tip:"Star Hall is the better venue — bigger and more atmospheric.",openH:11,closeH:21,images:img("bbq")},
    {name:"Sapporo Beer Museum",nameJp:"ビール博物館",cat:"drinking",travelMin:15,activityMin:60,rating:4.5,pop:true,desc:"Iconic red brick brewery with limited-edition tastings you can't get elsewhere.",mapQuery:"Sapporo+Beer+Museum",cost:"¥",tip:"Star Hall next door has all-you-can-drink combos.",openH:10,closeH:18,images:img("beer")},
    {name:"Susukino Bar Crawl",nameJp:"すすきの",cat:"drinking",travelMin:10,activityMin:120,rating:4.7,pop:true,desc:"Japan's northernmost entertainment district. 4,000 establishments.",mapQuery:"Susukino+Sapporo",cost:"¥¥",tip:"Bars on upper floors with no English signs are the best.",openH:18,closeH:24,images:img("bar")},
    {name:"Nikka Whisky Yoichi",nameJp:"余市蒸溜所",cat:"drinking",travelMin:55,activityMin:90,rating:4.8,pop:true,desc:"Birthplace of Japanese whisky. Free tours and tastings.",mapQuery:"Nikka+Whisky+Yoichi+Distillery",cost:"Free",tip:"Distillery-only bottlings at the shop are collector's items.",openH:9,closeH:17,images:img("whisky")},
    {name:"Wine & Cheese Bar",nameJp:"ワイン＆チーズ",cat:"drinking",travelMin:10,activityMin:60,rating:4.4,desc:"Hokkaido wine and artisan cheese pairings from Yoichi.",mapQuery:"Sapporo+Wine+Cheese+Bar",cost:"¥¥",tip:"Yoichi pinot noir with smoked camembert is perfection.",openH:17,closeH:23,images:img("wine")},
    {name:"Norbesa Ferris Wheel",nameJp:"ノルベサ観覧車",cat:"drinking",travelMin:10,activityMin:30,rating:4.3,desc:"Ferris wheel on a building in Susukino. Night views from enclosed gondolas.",mapQuery:"Norbesa+Ferris+Wheel+Sapporo",cost:"¥",tip:"Perfect after a few drinks — the view is magical.",openH:11,closeH:23,images:img("city")},
    {name:"Baristart Coffee",nameJp:"バリスタート",cat:"coffee",travelMin:10,activityMin:35,rating:4.7,pop:true,desc:"Sapporo's best café. Each drink uses fresh Hokkaido milk from rotating local farms.",mapQuery:"Baristart+Coffee+Sapporo",cost:"¥",tip:"Arguably the best latte in the city.",openH:8,closeH:19,images:img("coffee")},
    {name:"Morihico Coffee",nameJp:"森彦コーヒー",cat:"coffee",travelMin:15,activityMin:40,rating:4.6,desc:"Hidden in a converted house among trees. Slow-drip coffee, deeply atmospheric.",mapQuery:"Morihico+Coffee+Sapporo",cost:"¥",tip:"Feels like stepping into a Ghibli film.",openH:10,closeH:20,images:img("cafe")},
    {name:"Saturdays Chocolate",nameJp:"サタデーズチョコレート",cat:"coffee",travelMin:10,activityMin:35,rating:4.5,desc:"Bean-to-bar chocolate café. Single-origin drinking chocolate — thick and intense.",mapQuery:"Saturdays+Chocolate+Sapporo",cost:"¥",tip:"Nothing like regular hot cocoa — it's an experience.",openH:10,closeH:19,images:img("cafe")},
    {name:"FAbULOUS Coffee",nameJp:"ファビュラス",cat:"coffee",travelMin:10,activityMin:30,rating:4.5,desc:"Minimalist third-wave café. Outstanding single-origin pour-overs rotated seasonally.",mapQuery:"FAbULOUS+Coffee+Sapporo",cost:"¥",tip:"They rotate origins every few weeks.",openH:9,closeH:18,images:img("cafe")},
    {name:"Moerenuma Park",nameJp:"モエレ沼公園",cat:"cultural",travelMin:30,activityMin:60,rating:4.5,desc:"Isamu Noguchi's sculpture park. Glass pyramid, earth mounds. Free snowshoe rentals.",mapQuery:"Moerenuma+Park+Sapporo",cost:"Free",tip:"The glass pyramid interior feels like an anime set piece.",openH:7,closeH:19,images:img("park")},
    {name:"AOAO Sapporo Aquarium",nameJp:"アオアオ札幌",cat:"cultural",travelMin:10,activityMin:60,rating:4.4,desc:"Modern urban aquarium (opened 2023). Digital art, cold-water species, mesmerizing jellyfish, touch pools.",mapQuery:"AOAO+Sapporo+Aquarium",cost:"¥¥",tip:"The jellyfish room is mesmerizing — allow extra time.",openH:10,closeH:20,images:img("city")},
    {name:"Hill of the Buddha",nameJp:"頭大仏",cat:"cultural",travelMin:25,activityMin:45,rating:4.6,desc:"Tadao Ando-designed lavender hill concealing a 13.5m stone Buddha. Only the head peeks out. Surreal.",mapQuery:"Hill+of+the+Buddha+Sapporo",cost:"¥",tip:"In winter the snowy approach makes it even more otherworldly.",openH:9,closeH:16,images:img("temple")},
    {name:"Hokkaido Museum of Art",nameJp:"道立近代美術館",cat:"cultural",travelMin:15,activityMin:60,rating:4.4,desc:"Major art museum with Hokkaido and indigenous art collections.",mapQuery:"Hokkaido+Museum+Modern+Art",cost:"¥",tip:"Check for special winter exhibitions.",openH:9,closeH:17,images:img("art")},
    {name:"Kimono Experience",nameJp:"着物体験",cat:"cultural",travelMin:10,activityMin:60,rating:4.4,desc:"Traditional kimono with professional help and studio photos.",mapQuery:"Sapporo+Kimono+Experience",cost:"¥¥",tip:"Choose a winter pattern — the seasonal designs are stunning.",openH:10,closeH:17,images:img("temple")},
    {name:"Hokkaido Shrine",nameJp:"北海道神宮",cat:"historical",travelMin:20,activityMin:45,rating:4.7,pop:true,desc:"Major shrine in Maruyama Park forest. Red foxes sometimes wander the grounds.",mapQuery:"Hokkaido+Shrine+Sapporo",cost:"Free",tip:"The forest approach through Maruyama Park is magical.",openH:7,closeH:17,images:img("shrine")},
    {name:"Historical Village",nameJp:"北海道開拓の村",cat:"historical",travelMin:30,activityMin:90,rating:4.5,desc:"Open-air museum with 52 relocated historic buildings. Horse-drawn sleighs in winter.",mapQuery:"Historical+Village+of+Hokkaido",cost:"¥",tip:"The horse-drawn sleigh through the village in snow is unforgettable.",openH:9,closeH:16,images:img("history")},
    {name:"Hokkaido Museum",nameJp:"北海道博物館",cat:"historical",travelMin:25,activityMin:75,rating:4.4,desc:"Ainu culture, natural history, and pioneer story.",mapQuery:"Hokkaido+Museum+Sapporo",cost:"¥",tip:"Don't rush through the Ainu section.",openH:9,closeH:17,images:img("museum")},
    {name:"Red Brick Building",nameJp:"赤れんが庁舎",cat:"historical",travelMin:10,activityMin:30,rating:4.3,desc:"Neo-Baroque 1888 building with beautiful interior stained glass. Free.",mapQuery:"Sapporo+Red+Brick+Building",cost:"Free",tip:"The interior is unexpectedly beautiful — go inside.",openH:8,closeH:18,images:img("history")},
    {name:"Clock Tower",nameJp:"時計台",cat:"historical",travelMin:10,activityMin:20,rating:4.0,desc:"Iconic 1878 clock tower. Famously underwhelming outside, charming inside.",mapQuery:"Sapporo+Clock+Tower",cost:"¥",tip:"Go inside — it's genuinely charming.",openH:8,closeH:17,images:img("history")},
    {name:"Takino Snow World",nameJp:"滝野スノーワールド",cat:"adventure",travelMin:25,activityMin:120,rating:4.6,desc:"Massive snow park. Japan's longest tube sled (200m). Free tubing, snowshoeing, sledding.",mapQuery:"Takino+Snow+World+Sapporo",cost:"¥",tip:"The 200m tube sled is thrilling for adults too.",openH:9,closeH:16,images:img("snow")},
    {name:"Hitsujigaoka Snow Park",nameJp:"羊ヶ丘スノーパーク",cat:"adventure",travelMin:20,activityMin:90,rating:4.3,desc:"Snow park at the Dr. Clark statue. Tube sliding, snow striders, snowman building.",mapQuery:"Hitsujigaoka+Snow+Park+Sapporo",cost:"¥",tip:"The vast white field with Dr. Clark statue is the most iconic Sapporo photo.",openH:9,closeH:16,images:img("snow")},
    {name:"North Snowland Chitose",nameJp:"ノーススノーランド",cat:"adventure",travelMin:40,activityMin:120,rating:4.4,desc:"20+ types of snow play — tube sliders, 4-wheel buggies, snow rafting, mini snowmobiles.",mapQuery:"North+Snowland+Chitose",cost:"¥",tip:"The snow rafting is the highlight.",openH:9,closeH:16,eventWindow:"Dec 30–Mar 5",images:img("snow")},
    {name:"Shiroi Koibito Park",nameJp:"白い恋人パーク",cat:"fun",travelMin:25,activityMin:75,rating:4.3,desc:"Chocolate factory theme park. Cookie decorating workshop.",mapQuery:"Shiroi+Koibito+Park+Sapporo",cost:"¥¥",tip:"The cookie workshop makes a great gift.",openH:10,closeH:17,images:img("choco")},
    {name:"ROYCE Chocolate Town",nameJp:"ロイズカカオタウン",cat:"fun",travelMin:30,activityMin:60,rating:4.5,desc:"Newer ROYCE experience. Factory tours, tastings, chocolate museum. More immersive than Shiroi Koibito.",mapQuery:"ROYCE+Cacao+Chocolate+Town",cost:"¥¥",tip:"The fresh chocolate here is noticeably better than packaged.",openH:10,closeH:17,images:img("choco")},
    {name:"Maruyama Zoo",nameJp:"円山動物園",cat:"fun",travelMin:20,activityMin:90,rating:4.3,desc:"Polar bears, red pandas, snow monkeys. The polar bear swimming tunnel is mesmerizing.",mapQuery:"Maruyama+Zoo+Sapporo",cost:"¥",tip:"The polar bear tunnel captivates kids and adults.",openH:9,closeH:16,images:img("bear")},
    {name:"Retro Game Arcade",nameJp:"レトロゲーセン",cat:"fun",travelMin:10,activityMin:45,rating:4.4,desc:"Multi-floor arcade in Susukino. 80s/90s cabinets, crane games, purikura.",mapQuery:"Susukino+Arcade+Sapporo",cost:"¥",tip:"Bring ¥100 coins — 3rd floor has the classics.",openH:10,closeH:24,images:img("city")},
    {name:"Hoheikyo Onsen",nameJp:"豊平峡温泉",cat:"relaxing",travelMin:45,activityMin:90,rating:4.7,pop:true,desc:"100% natural unprocessed spring — rare even in Japan. Outdoor bath for 200 people. Famous Indian curry on-site.",mapQuery:"Hoheikyo+Onsen+Sapporo",cost:"¥",tip:"The curry is legendary — eat before or after your soak.",openH:10,closeH:22,images:img("onsen")},
    {name:"Jozankei Onsen",nameJp:"定山渓温泉",cat:"relaxing",travelMin:40,activityMin:90,rating:4.6,desc:"Mountain hot spring village in a river gorge. Multiple ryokan day-use baths.",mapQuery:"Jozankei+Onsen+Sapporo",cost:"¥¥",tip:"Combine with Hoheikyo nearby for the ultimate onsen day trip.",openH:7,closeH:21,images:img("onsen")},
    {name:"Toyohira River Walk",nameJp:"豊平川散歩",cat:"relaxing",travelMin:10,activityMin:45,rating:4.2,desc:"Scenic winter river walk. Snow-covered riverbanks surprisingly serene.",mapQuery:"Toyohira+River+Sapporo",cost:"Free",tip:"End at Baristart Coffee nearby for the perfect combo.",openH:7,closeH:20,images:img("park")},
    {name:"Tanuki Koji Arcade",nameJp:"狸小路",cat:"shopping",travelMin:10,activityMin:90,rating:4.4,desc:"7-block covered arcade. Don Quijote, retro games, specialty shops.",mapQuery:"Tanuki+Koji+Sapporo",cost:"Varies",tip:"Block 3 retro arcades. Block 7 local food shops.",openH:10,closeH:22,images:img("shop")},
    {name:"JR Tower Stellar Place",nameJp:"ステラプレイス",cat:"shopping",travelMin:5,activityMin:60,rating:4.3,desc:"Sapporo Station complex. Fashion, food court, and T38 observatory on floor 38.",mapQuery:"Stellar+Place+JR+Tower+Sapporo",cost:"Varies",tip:"T38 has 360° views — better than the TV Tower.",openH:10,closeH:21,images:img("shop")},
    {name:"Nijo Market Souvenirs",nameJp:"二条市場おみやげ",cat:"shopping",travelMin:10,activityMin:30,rating:4.3,desc:"Dried scallops, crab, seafood snacks, Hokkaido specialties.",mapQuery:"Nijo+Market+Sapporo",cost:"Varies",tip:"Dried scallops are the best value souvenir in Hokkaido.",openH:7,closeH:18,images:img("market")},
    {name:"Snow Festival",nameJp:"雪まつり",cat:"events",travelMin:10,activityMin:90,rating:4.9,pop:true,desc:"Odori Park snow and ice sculptures. Once-in-a-lifetime if visiting early February.",mapQuery:"Sapporo+Snow+Festival+Odori",cost:"Free",tip:"Go day and night. Evening illuminations are stunning.",openH:8,closeH:22,eventWindow:"Feb 4–11, 2026",images:img("ice")},
    {name:"White Illumination",nameJp:"ホワイトイルミネーション",cat:"events",travelMin:10,activityMin:45,rating:4.6,desc:"Millions of LEDs transform Odori Park and Ekimae-dori.",mapQuery:"Sapporo+White+Illumination",cost:"Free",tip:"The light tunnel on Ekimae-dori is most photogenic.",openH:16,closeH:22,eventWindow:"Nov 2025–Mar 2026",images:img("fireworks")},
    {name:"Shiroi Koibito Illumination",nameJp:"白い恋人イルミネーション",cat:"events",travelMin:25,activityMin:45,rating:4.4,desc:"Chocolate park adorned with lights and music. Free entry to grounds.",mapQuery:"Shiroi+Koibito+Park+Illumination",cost:"Free",tip:"The limited-edition nama chocolate sand is event-only.",openH:16,closeH:22,eventWindow:"Nov 2025–Mar 2026",images:img("fireworks")},
    {name:"Munich Christmas Market",nameJp:"ミュンヘンクリスマス市",cat:"events",travelMin:10,activityMin:60,rating:4.5,desc:"German-style market in Odori Park. Glühwein, sausages, crafts.",mapQuery:"Sapporo+Christmas+Market+Odori",cost:"¥",tip:"The glühwein uses real German spice blends.",openH:11,closeH:21,eventWindow:"Late Nov–Dec 25",images:img("night")},
    {name:"Lake Shikotsu Ice Festival",nameJp:"支笏湖氷濤まつり",cat:"events",travelMin:50,activityMin:90,rating:4.7,desc:"Massive ice structures lit from within. Glows blue and purple at night.",mapQuery:"Lake+Shikotsu+Ice+Festival",cost:"¥",tip:"Go after dark — nighttime illumination is the main event.",openH:10,closeH:22,eventWindow:"Late Jan–mid Feb",images:img("ice")},
    // ── ESSENTIALS ──
    {name:"Matsumoto Kiyoshi Drugstore",nameJp:"マツモトキヨシ",cat:"essentials",travelMin:10,activityMin:20,rating:4.4,pop:true,desc:"Japan's biggest drugstore chain. Over-the-counter medicine, skincare, vitamins, cosmetics, toiletries. Tax-free for tourists.",mapQuery:"Matsumoto+Kiyoshi+Tanuki+Koji+Sapporo",cost:"¥",tip:"Show your passport for tax-free purchases over ¥5,000. Japanese skincare is incredible.",openH:10,closeH:22,images:img("shop")},
    {name:"Don Quijote Sapporo",nameJp:"ドン・キホーテ",cat:"essentials",travelMin:10,activityMin:30,rating:4.3,pop:true,desc:"The legendary discount mega-store. Everything: medicine, snacks, electronics, souvenirs, cosmetics, alcohol, costumes. Chaotic and wonderful.",mapQuery:"Don+Quijote+Tanuki+Koji+Sapporo",cost:"¥",tip:"Tax-free floor upstairs. The sheer variety is overwhelming — go with a list or you'll be there for hours.",openH:0,closeH:24,images:img("shop")},
    {name:"Sapporo Drug Store",nameJp:"サッポロドラッグストアー",cat:"essentials",travelMin:10,activityMin:15,rating:4.2,desc:"Local Hokkaido drugstore chain. Medicine, first aid, cold remedies, toiletries. Staff familiar with tourist needs.",mapQuery:"Sapporo+Drug+Store",cost:"¥",tip:"If you need Pabron (cold medicine) or Salonpas (pain patches), this is the place.",openH:9,closeH:22,images:img("shop")},
    {name:"Seicomart Sapporo",nameJp:"セイコーマート",cat:"essentials",travelMin:5,activityMin:10,rating:4.2,desc:"Hokkaido's ubiquitous convenience store. Everywhere in Sapporo. Hot food, ATM, toiletries, basic medicine.",mapQuery:"Seicomart+Sapporo",cost:"¥",tip:"They're on nearly every block. The hot katsu sandwich is criminally underrated.",openH:6,closeH:23,images:img("shop")},
    {name:"Daiso 100-Yen Shop",nameJp:"ダイソー",cat:"essentials",travelMin:10,activityMin:25,rating:4.1,desc:"Everything for ¥100 (~$0.70). Travel toiletries, phone accessories, stationery, kitchen items, souvenirs. Incredible value.",mapQuery:"Daiso+Sapporo+Station",cost:"¥",tip:"The travel-size toiletries section is a lifesaver if you forgot anything.",openH:10,closeH:21,images:img("shop")},
    // ── LIQUOR ──
    {name:"Tanuki Koji Liquor Shops",nameJp:"狸小路酒屋",cat:"liquor",travelMin:10,activityMin:25,rating:4.4,pop:true,desc:"Several dedicated liquor stores in the covered arcade. Hokkaido sake, Japanese whisky, Yoichi wine, craft beer. Proper selection with knowledgeable staff.",mapQuery:"Tanuki+Koji+Sake+Shop+Sapporo",cost:"¥¥",tip:"Ask for Hokkaido-only sake — many excellent labels never leave the island.",openH:10,closeH:21,images:img("wine")},
    {name:"Don Quijote Alcohol Floor",nameJp:"ドンキ酒コーナー",cat:"liquor",travelMin:10,activityMin:20,rating:4.3,desc:"Massive alcohol section: Japanese whisky (including rare finds), sake, wine, craft beer, shochu. Some of the best prices in the city.",mapQuery:"Don+Quijote+Tanuki+Koji+Sapporo",cost:"¥",tip:"They occasionally have rare Japanese whisky bottles at retail price — always check.",openH:0,closeH:24,images:img("whisky")},
    {name:"Sapporo Beer Garden Shop",nameJp:"ビール園ショップ",cat:"liquor",travelMin:15,activityMin:15,rating:4.3,desc:"Gift shop at the Sapporo Beer Museum. Limited-edition Sapporo beers, brewery-only labels, and branded glassware.",mapQuery:"Sapporo+Beer+Museum+Shop",cost:"¥¥",tip:"The brewery-only Kaitaku-shi beer is worth bringing home.",openH:10,closeH:18,images:img("beer")},
    {name:"Seicomart ¥100 Wine",nameJp:"セイコーマートワイン",cat:"liquor",travelMin:5,activityMin:10,rating:4.1,desc:"Hokkaido's convenience store with the famous ¥100 wine, Sapporo Classic, local sake, Chu-Hi, and an absurd variety of canned highballs.",mapQuery:"Seicomart+Sapporo",cost:"¥",tip:"The ¥100 wine is a Hokkaido institution. Also grab Sapporo Classic — it's not sold outside Hokkaido.",openH:6,closeH:23,images:img("wine")},
  ],
};
const fmt = (h, m) => { const hh = ((h % 24) + 24) % 24; return `${hh === 0 ? 12 : hh > 12 ? hh - 12 : hh}:${String(Math.max(0, Math.min(59, m))).padStart(2, "0")} ${hh >= 12 ? "PM" : "AM"}`; };
const fmtD = m => { const h = Math.floor(m / 60), mm = m % 60; return h === 0 ? `${mm}m` : mm === 0 ? `${h}h` : `${h}h ${mm}m`; };
const isOp = (a, ar) => ar >= a.openH && (ar + a.activityMin / 60) <= a.closeH + 0.5;
const Petals = () => (<div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>{Array.from({ length: 12 }, (_, i) => (<div key={i} style={{ position: "absolute", left: `${(i * 8.5) % 100}%`, top: -20, width: 8 + (i % 4) * 2, height: (8 + (i % 4) * 2) * 0.7, background: "radial-gradient(ellipse,rgba(255,183,197,0.65),rgba(255,140,160,0.2))", borderRadius: "50% 0 50% 50%", animation: `pf ${7 + (i % 4) * 2}s ${(i * 0.6) % 7}s linear infinite`, filter: "blur(0.5px)" }} />))}</div>);

// ─── CARD ───
const Cd = ({ a, color, i, dH, dM, tMode, noTime, isClosest, mapLetter }) => {
  const mult = travelMult(tMode);
  const adjTravel = Math.round(a.travelMin * mult);
  const tot = adjTravel * 2 + a.activityMin;
  const dd = dH + dM / 60, ar = dd + adjTravel / 60, bk = dd + tot / 60;
  const cat = CATEGORIES.find(c => c.id === a.cat);
  const v = a._verified;
  const map = (v?.mapsUrl || a._mapsUrl) ? (v?.mapsUrl || a._mapsUrl) : `https://www.google.com/maps/search/?api=1&query=${a.mapQuery}`;
  const [showHrs, setShowHrs] = useState(false);

  // Determine open/closed based on PLANNED ARRIVAL TIME, or CURRENT TIME when noTime
  const now = new Date();
  const currentH = now.getHours() + now.getMinutes() / 60;
  const arrivalH = noTime ? currentH : ar;
  const effectiveOpenH = v?.openH ?? a.openH;
  const effectiveCloseH = v?.closeH ?? a.closeH;
  let openAtArrival = null;
  if (effectiveOpenH != null && effectiveCloseH != null) {
    if (effectiveCloseH === 0 && effectiveOpenH === 0) {
      openAtArrival = false; // Closed today
    } else if (effectiveCloseH === 24 || effectiveCloseH === 0) {
      openAtArrival = arrivalH >= effectiveOpenH; // 24hr
    } else if (effectiveCloseH > effectiveOpenH) {
      openAtArrival = arrivalH >= effectiveOpenH && arrivalH < effectiveCloseH;
    } else {
      // Wraps past midnight (e.g. 17-2)
      openAtArrival = arrivalH >= effectiveOpenH || arrivalH < effectiveCloseH;
    }
  }

  const hoursLines = v?.hours || [];
  const hasHours = hoursLines.length > 0;

  return (
    <div data-activity={a.name} style={{ background: v?.status === 'temp_closed' ? "rgba(255,100,50,0.06)" : "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)", border: `1px solid ${v?.status === 'temp_closed' ? 'rgba(255,100,50,0.2)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 16, padding: "20px 22px", animation: `si 0.5s ${i * 0.07}s both cubic-bezier(0.22,1,0.36,1)`, position: "relative", overflow: "hidden", transition: "border-color 0.3s" }} onMouseEnter={e => e.currentTarget.style.borderColor = color + "44"} onMouseLeave={e => e.currentTarget.style.borderColor = v?.status === 'temp_closed' ? "rgba(255,100,50,0.2)" : "rgba(255,255,255,0.08)"}>
      {v?.status === 'temp_closed' && <div style={{ background: "rgba(255,100,50,0.15)", border: "1px solid rgba(255,100,50,0.3)", borderRadius: 10, padding: "8px 14px", marginBottom: 14, fontFamily: "'Dela Gothic One'", fontSize: 13, color: "#ff8844", display: "flex", alignItems: "center", gap: 6 }}>⚠️ Temporarily Closed — verify before visiting</div>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 4 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Dela Gothic One'", fontSize: 19, color: "#fff", marginBottom: 2 }}>{mapLetter && <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", background: "#1a1030", border: `2px solid ${color}`, fontFamily: "'Dela Gothic One'", fontSize: 12, color, marginRight: 8, verticalAlign: "middle", flexShrink: 0 }}>{mapLetter}</span>}{a.name}<CopyBtn text={a.name} color={color} /><WebBtn query={a.name + ' ' + (a.nameJp || '') + ' Hokkaido'} color={color} /><InstaBtn query={a.nameJp || a.name} color={color} /></div>
          <div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: color, opacity: 0.8, letterSpacing: 1 }}>{a.nameJp}<CopyBtn text={a.nameJp} color={color} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "auto auto", gap: 5, flexShrink: 0, justifyItems: "end" }}>
          {a.pop && <div style={{ background: "rgba(255,100,100,0.2)", border: "1px solid rgba(255,100,100,0.4)", borderRadius: 20, padding: "3px 10px", fontFamily: "'Dela Gothic One'", fontSize: 11, color: "#ff8888", whiteSpace: "nowrap" }}>🔥 Popular</div>}
          {isClosest && <div style={{ background: `${color}20`, border: `1px solid ${color}40`, borderRadius: 20, padding: "3px 10px", fontFamily: "'Dela Gothic One'", fontSize: 11, color: color, whiteSpace: "nowrap" }}>📍 Closest</div>}
          {openAtArrival === true && <button onClick={(e) => { e.stopPropagation(); setShowHrs(p => !p); }} style={{ background: "rgba(50,200,100,0.15)", border: "1px solid rgba(50,200,100,0.3)", borderRadius: 20, padding: "3px 10px", fontFamily: "'Dela Gothic One'", fontSize: 11, color: "#44cc66", whiteSpace: "nowrap", cursor: "pointer" }}>{noTime ? "● Open Now" : `● Open at ${fmt(Math.floor(ar), Math.round((ar % 1) * 60))}`}</button>}
          {openAtArrival === false && <button onClick={(e) => { e.stopPropagation(); setShowHrs(p => !p); }} style={{ background: "rgba(255,80,80,0.15)", border: "1px solid rgba(255,80,80,0.3)", borderRadius: 20, padding: "3px 10px", fontFamily: "'Dela Gothic One'", fontSize: 11, color: "#ff6666", whiteSpace: "nowrap", cursor: "pointer" }}>{noTime ? "● Closed Now" : `● Closed at ${fmt(Math.floor(ar), Math.round((ar % 1) * 60))}`}</button>}
          {cat && <div style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "4px 12px", display: "flex", alignItems: "center", gap: 5, fontFamily: "'Zen Kaku Gothic New'", fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 600, whiteSpace: "nowrap" }}><span style={{ fontSize: 14 }}>{cat.emoji}</span> {cat.label}</div>}
          <div style={{ background: `linear-gradient(135deg,${color},${color}cc)`, color: "#000", fontFamily: "'Dela Gothic One'", fontSize: 13, padding: "4px 11px", borderRadius: 20, whiteSpace: "nowrap" }}>★ {a.rating}</div>
        </div>
      </div>
      {showHrs && hasHours && (
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", marginBottom: 10, marginTop: 6, animation: "fu 0.2s both" }}>
          <div style={{ fontFamily: "'Dela Gothic One'", fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: 2, marginBottom: 6 }}>HOURS OF OPERATION</div>
          {hoursLines.map((line, li) => {
            const isToday = line.startsWith(["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()]);
            return <div key={li} style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: isToday ? color : "rgba(255,255,255,0.5)", lineHeight: 1.7, fontWeight: isToday ? 700 : 400 }}>{isToday ? "▸ " : ""}{line}</div>;
          })}
        </div>
      )}
      {showHrs && !hasHours && (
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px 14px", marginBottom: 10, marginTop: 6, fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
          Hours: {fmt(effectiveOpenH, 0)} – {fmt(effectiveCloseH > 24 ? effectiveCloseH - 24 : effectiveCloseH, 0)} (from listing)
        </div>
      )}
      <div style={{ marginTop: 12 }}><LiveGallery activity={a} color={color} /></div>
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
        {v && v.status === 'open' && <div style={{ background: "rgba(50,200,100,0.1)", border: "1px solid rgba(50,200,100,0.2)", borderRadius: 8, padding: "5px 10px", fontFamily: "'Zen Kaku Gothic New'", fontSize: 11, color: "rgba(50,200,100,0.7)" }}>✓ Verified</div>}
        <ShareBtn activities={[a]} title={a.name} locationName="Hokkaido" tMode={tMode} color={color} label="📤 Share" small={true} dH={dH} dM={dM} noTime={noTime} mult={mult} />
        <a href={map} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "auto", background: `${color}20`, border: `1px solid ${color}40`, borderRadius: 8, padding: "5px 14px", fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: color, textDecoration: "none" }}>📍 Map</a>
      </div>
    </div>
  );
};

// ─── MAP CARD ───
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const MapCard = ({ activities, locData, color, onClose, onSelect }) => {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !locData) return;
    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    // Load Leaflet JS
    const initMap = () => {
      const L = window.L;
      if (!L || leafletMap.current) return;
      const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([locData.lat, locData.lng], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
      L.control.zoom({ position: 'bottomleft' }).addTo(map);
      L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map).addAttribution('© OpenStreetMap');

      // Base marker
      const baseIcon = L.divIcon({ className: '', html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:14px">🏠</div>`, iconSize: [28, 28], iconAnchor: [14, 14] });
      L.marker([locData.lat, locData.lng], { icon: baseIcon }).addTo(map).bindPopup(`<b>${locData.name} Base</b>`);

      // Activity markers
      const bounds = [[locData.lat, locData.lng]];
      activities.forEach((a, i) => {
        const [lat, lng] = getCoords(a, locData);
        bounds.push([lat, lng]);
        const letter = i < 26 ? LETTERS[i] : `${i + 1}`;
        const cat = CATEGORIES.find(c => c.id === a.cat);
        const icon = L.divIcon({ className: '', html: `<div style="width:26px;height:26px;border-radius:50%;background:#1a1030;border:2px solid ${color};box-shadow:0 2px 8px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-family:'Dela Gothic One',sans-serif;font-size:11px;font-weight:700;color:${color}">${letter}</div>`, iconSize: [26, 26], iconAnchor: [13, 13] });
        const marker = L.marker([lat, lng], { icon }).addTo(map);
        marker.bindPopup(`<div style="font-family:sans-serif;min-width:140px"><b>${letter}. ${a.name}</b><br><span style="font-size:12px;color:#666">${a.nameJp}</span><br><span style="font-size:12px">★ ${a.rating} · ${cat ? cat.emoji : ''} ${cat ? cat.label : ''}</span><br><span style="font-size:12px;color:#888">${a.travelMin}min travel · ${a.activityMin}min activity</span></div>`);
        marker.on('click', () => { if (onSelect) onSelect(a.name); });
      });
      if (bounds.length > 1) map.fitBounds(bounds, { padding: [30, 30] });
      leafletMap.current = map;
    };

    if (window.L) { initMap(); }
    else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setTimeout(initMap, 50);
      document.head.appendChild(script);
    }

    return () => { if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; } };
  }, [activities, locData]);

  const recenter = () => {
    if (!leafletMap.current || !locData) return;
    const bounds = [[locData.lat, locData.lng]];
    activities.forEach(a => { bounds.push(getCoords(a, locData)); });
    leafletMap.current.fitBounds(bounds, { padding: [30, 30] });
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "fu 0.3s both" }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 600, maxHeight: "80vh", background: "#0e0e22", border: `1px solid ${color}40`, borderRadius: 20, overflow: "hidden", position: "relative", boxShadow: `0 8px 40px ${color}20` }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${color}20` }}>
          <div style={{ fontFamily: "'Dela Gothic One'", fontSize: 14, color }}>🗺 {activities.length} Activities</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={recenter} style={{ background: `${color}20`, border: `1px solid ${color}40`, borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontFamily: "'Zen Kaku Gothic New'", fontSize: 12, color }}>⊕ Recenter</button>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>✕</button>
          </div>
        </div>
        <div ref={mapRef} style={{ width: "100%", height: "min(60vh, 450px)" }} />
        <div style={{ padding: "10px 18px", maxHeight: 120, overflow: "auto", borderTop: `1px solid ${color}20` }}>
          {activities.slice(0, 26).map((a, i) => (
            <button key={a.name} onClick={() => { onClose(); setTimeout(() => onSelect && onSelect(a.name), 100); }} style={{ display: "inline-block", background: `${color}10`, border: `1px solid ${color}25`, borderRadius: 6, padding: "3px 8px", margin: "2px 4px 2px 0", cursor: "pointer", fontFamily: "'Zen Kaku Gothic New'", fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
              <span style={{ fontFamily: "'Dela Gothic One'", color, marginRight: 4 }}>{LETTERS[i]}</span>{a.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const MapBtn = ({ onClick, color }) => (
  <button onClick={onClick} style={{ background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12, color, fontFamily: "'Dela Gothic One'", transition: "all 0.2s", display: "inline-flex", alignItems: "center", gap: 5 }}>🗺 Map</button>
);

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
  useEffect(() => { if (noTime && tab === "extra") setTab("single"); }, [noTime]);

  // Scroll to top on screen change — aggressive iOS Safari fix
  const topRef = useRef(null);
  useEffect(() => {
    // Belt and suspenders: try every scroll method iOS respects
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (topRef.current) topRef.current.scrollIntoView();
    // Deferred backup for iOS Safari layout timing
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
    });
  }, [scr]);

  // Header clock toggle
  const [showClock, setShowClock] = useState(false);
  const [mapActivities, setMapActivities] = useState(null); // array of activities to show on map, or null
  const scrollToActivity = useCallback((name) => {
    const el = document.querySelector(`[data-activity="${CSS.escape(name)}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);
  const [clockStr, setClockStr] = useState("");
  useEffect(() => {
    if (!showClock) return;
    const tick = () => {
      const now = new Date();
      const str = now.toLocaleString("en-US", { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, weekday: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZoneName: "short" });
      setClockStr(str);
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, [showClock]);

  // ── Activity Verification ──
  // Initialize from localStorage so permanently closed items are filtered immediately
  const [verified, setVerified] = useState(() => {
    try { const s = localStorage.getItem('hq_verified'); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState(null);
  const verifiedLoc = useRef(null);

  // Persist verified results so perm_closed survives page reloads
  useEffect(() => {
    if (Object.keys(verified).length > 0) {
      try { localStorage.setItem('hq_verified', JSON.stringify(verified)); } catch {}
    }
  }, [verified]);

  useEffect(() => {
    if (!loc || verifiedLoc.current === loc) return;
    verifiedLoc.current = loc;
    setVerifying(true);
    setVerifyError(null);
    const activities = DA[loc].map(a => ({ name: a.name, nameJp: a.nameJp, mapQuery: a.mapQuery }));
    fetch('/api/verify-activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activities, location: loc }),
    })
      .then(r => { if (!r.ok) throw new Error('Verification unavailable'); return r.json(); })
      .then(data => {
        if (data.results) setVerified(prev => ({ ...prev, ...data.results }));
      })
      .catch(() => setVerifyError('Could not verify — showing cached data'))
      .finally(() => setVerifying(false));
  }, [loc]);

  // Merge verified data into an activity (override hours/rating if Google has fresher data)
  const mergeVerified = useCallback((a) => {
    const v = verified[a.mapQuery];
    if (!v || v.status === 'error' || v.status === 'not_found') return a;
    const merged = { ...a };
    if (v.rating && v.ratingCount > 5) merged.rating = v.rating;
    if (v.openH !== null && v.openH !== undefined) merged.openH = v.openH;
    if (v.closeH !== null && v.closeH !== undefined) merged.closeH = v.closeH;
    if (v.mapsUrl) merged._mapsUrl = v.mapsUrl;
    merged._verified = v;
    return merged;
  }, [verified]);

  const L = loc ? LOCATIONS[loc] : null;
  const dep = dH + dM / 60;
  const backStr = fmt(Math.floor(dep + time / 60), Math.round(((dep + time / 60) % 1) * 60));
  const toggle = id => setCats(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const mult = travelMult(tMode);

  const filtered = useMemo(() => {
    if (!loc) return [];
    return DA[loc].map(mergeVerified).filter(a => {
      // Filter out permanently closed places
      if (a._verified?.status === 'perm_closed') return false;
      const adjTravel = Math.round(a.travelMin * mult);
      if (!noTime && adjTravel > maxTravel) return false;
      if (!noTime && adjTravel * 2 + a.activityMin > time) return false;
      if (cats.size > 0 && !cats.has(a.cat)) return false;
      if (free && a.cost !== "Free") return false;
      if (!noTime && !isOp(a, dep + adjTravel / 60)) return false;
      return true;
    }).sort((a, b) => sort === "rating" ? b.rating - a.rating : sort === "time" ? (Math.round(a.travelMin * mult) * 2 + a.activityMin) - (Math.round(b.travelMin * mult) * 2 + b.activityMin) : Math.round(a.travelMin * mult) - Math.round(b.travelMin * mult));
  }, [loc, time, cats, free, sort, dep, mult, maxTravel, noTime, mergeVerified]);

  const grouped = useMemo(() => {
    if (!filtered.length) return { popular: [], closest: [], rest: [] };
    const popSet = new Set();
    const closeSet = new Set();
    const byRating = [...filtered].sort((a, b) => b.rating - a.rating);
    const popular = byRating.filter(a => a.rating >= 4.5 || a.pop).slice(0, 5);
    popular.forEach(a => popSet.add(a.name));
    const byDist = [...filtered].sort((a, b) => Math.round(a.travelMin * mult) - Math.round(b.travelMin * mult));
    const closest = byDist.filter(a => !popSet.has(a.name)).slice(0, 5);
    closest.forEach(a => closeSet.add(a.name));
    const rest = filtered.filter(a => !popSet.has(a.name) && !closeSet.has(a.name));
    return { popular, closest, rest };
  }, [filtered, mult]);

  const extra = useMemo(() => {
    if (!loc || noTime) return [];
    return DA[loc].map(mergeVerified).filter(a => {
      if (a._verified?.status === 'perm_closed') return false;
      const adj = Math.round(a.travelMin * mult);
      const t = adj * 2 + a.activityMin;
      if (t <= time) return false;
      if (cats.size > 0 && !cats.has(a.cat)) return false;
      if (free && a.cost !== "Free") return false;
      if (!isOp(a, dep + adj / 60)) return false;
      return true;
    }).sort((a, b) => (Math.round(a.travelMin * mult) * 2 + a.activityMin) - (Math.round(b.travelMin * mult) * 2 + b.activityMin));
  }, [loc, time, cats, free, dep, mult, noTime, mergeVerified]);

  const combos = useMemo(() => {
    if (!loc || filtered.length < 2) return [];
    const r = [];

    if (noTime) {
      // No-timing mode: pair by proximity + category diversity + rating
      for (let i = 0; i < Math.min(filtered.length, 20); i++) {
        const a1 = filtered[i], adj1 = Math.round(a1.travelMin * mult);
        for (let j = i + 1; j < Math.min(filtered.length, 20); j++) {
          const a2 = filtered[j], adj2 = Math.round(a2.travelMin * mult);
          const tb = Math.max(5, Math.round((adj1 + adj2) / 2)); // estimated travel between
          const tot = adj1 + a1.activityMin + tb + a2.activityMin + adj2;
          r.push({ acts: [a1, a2], travs: [tb], tot, avg: +((a1.rating + a2.rating) / 2).toFixed(1), uc: new Set([a1.cat, a2.cat]).size });
        }
      }
    } else {
      // Timed mode: respect departure time and budget
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
    }

    const seen = new Set();
    return r.map(c => ({ ...c, sc: c.avg * 10 + c.uc * 5 - c.tot * 0.02, k: c.acts.map(a => a.name).sort().join("|") })).filter(c => { if (seen.has(c.k)) return false; seen.add(c.k); return true; }).sort((a, b) => b.sc - a.sc).slice(0, 12);
  }, [filtered, dep, time, loc, mult, noTime]);

  return (
    <div style={{ minHeight: "100vh", background: L ? L.bg : "linear-gradient(135deg,#0a0a1a 0%,#1a0a2e 50%,#0a1628 100%)", color: "#fff", position: "relative", transition: "background 0.6s" }}>
      <div ref={topRef} style={{ position: "absolute", top: 0, left: 0, height: 1, width: 1 }} />
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap');@keyframes pf{0%{transform:translateY(-20px) rotate(0) translateX(0);opacity:0}10%{opacity:1}90%{opacity:.6}100%{transform:translateY(100vh) rotate(360deg) translateX(60px);opacity:0}}@keyframes si{from{opacity:0;transform:translateY(30px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes fu{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes bi{0%{transform:translateX(-50%) scale(.3);opacity:0}50%{transform:translateX(-50%) scale(1.05)}100%{transform:translateX(-50%) scale(1);opacity:1}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}input[type="range"]{-webkit-appearance:none;width:100%;height:6px;border-radius:3px;outline:none;background:rgba(255,255,255,.1)}input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:${L ? L.color : "#FFE66D"};cursor:pointer;box-shadow:0 0 12px ${L ? L.color + "88" : "#FFE66D88"}}*{box-sizing:border-box}a{color:inherit}select{background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:8px 12px;font-family:'Zen Kaku Gothic New';font-size:14px;outline:none;cursor:pointer}select option{background:#1a1a2e;color:#fff}`}</style>
      <Petals />

      {/* MAP OVERLAY */}
      {mapActivities && L && <MapCard activities={mapActivities} locData={LOCATIONS[loc]} color={L.color} onClose={() => setMapActivities(null)} onSelect={scrollToActivity} />}

      {/* HEADER */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,10,26,0.75)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {scr !== "loc" && <button onClick={() => { if (scr === "results") { setScr("filters"); } else { setScr("loc"); setLoc(null); setShowInfo(false); } }} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, color: "#fff", padding: "6px 12px", cursor: "pointer", fontFamily: "'Zen Kaku Gothic New'", fontSize: 14 }}>← 戻る</button>}
          <button onClick={() => setShowClock(p => !p)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 8 }}>
            {showClock ? (
              <span style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{clockStr}</span>
            ) : (
              <>
                <span style={{ fontFamily: "'Dela Gothic One'", fontSize: 16, color: "#fff" }}>{L ? L.nameJp : "北海道"}</span>
                <span style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: "rgba(255,255,255,0.45)" }}>HOKKAIDO QUEST</span>
              </>
            )}
          </button>
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

          <button onClick={() => { setScr("results"); window.scrollTo(0, 0); }} style={{ width: "100%", background: `linear-gradient(135deg,${L.color},${L.accent}cc)`, border: "none", borderRadius: 14, padding: "16px 24px", cursor: "pointer", fontFamily: "'Dela Gothic One'", fontSize: 18, color: "#000", letterSpacing: 1, boxShadow: `0 4px 24px ${L.color}40`, transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>FIND ADVENTURES → {filtered.length} results</button>
        </div>}

        {/* RESULTS */}
        {scr === "results" && L && <div style={{ paddingTop: 24, animation: "fu 0.4s both" }}>
          <LocationBar loc={loc} color={L.color} />

          {verifying && <div style={{ background: `${L.color}10`, border: `1px solid ${L.color}20`, borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: L.color, display: "flex", alignItems: "center", gap: 8 }}><span style={{ animation: "pulse 1.2s infinite" }}>📡</span> Verifying activity hours and status with Google...</div>}
          {!verifying && Object.keys(verified).length > 0 && (() => {
            const locActs = DA[loc] || [];
            const tempCl = locActs.filter(a => verified[a.mapQuery]?.status === 'temp_closed').length;
            const permCl = locActs.filter(a => verified[a.mapQuery]?.status === 'perm_closed').length;
            const okCount = locActs.filter(a => verified[a.mapQuery]?.status === 'open').length;
            return (tempCl > 0 || permCl > 0) ? (
              <div style={{ background: "rgba(255,150,50,0.08)", border: "1px solid rgba(255,150,50,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                ✓ <span style={{ color: "rgba(50,200,100,0.8)" }}>{okCount} verified</span>
                {tempCl > 0 && <> · <span style={{ color: "#ff8844" }}>⚠️ {tempCl} temporarily closed</span></>}
                {permCl > 0 && <> · <span style={{ color: "#ff6666" }}>❌ {permCl} permanently closed (hidden)</span></>}
              </div>
            ) : okCount > 0 ? (
              <div style={{ background: "rgba(50,200,100,0.06)", border: "1px solid rgba(50,200,100,0.15)", borderRadius: 10, padding: "8px 14px", marginBottom: 14, fontFamily: "'Zen Kaku Gothic New'", fontSize: 12, color: "rgba(50,200,100,0.6)" }}>✓ {okCount} activities verified — hours and ratings up to date</div>
            ) : null;
          })()}
          {verifyError && <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px 14px", marginBottom: 14, fontFamily: "'Zen Kaku Gothic New'", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>ℹ️ {verifyError}</div>}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", marginBottom: 20, overflow: "hidden", position: "relative", zIndex: 2 }}>
            {[{ k: "single", l: `🎯 All (${filtered.length})`, show: true }, { k: "combo", l: `⛓️ Combos (${combos.length})`, show: true }, { k: "extra", l: `⏳ Extra (${extra.length})`, show: !noTime }].filter(t => t.show).map(t => (
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

          {tab === "single" && (filtered.length > 0 ? <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "relative", zIndex: 2 }}>
            {grouped.popular.length > 0 && <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                <div style={{ fontFamily: "'Dela Gothic One'", fontSize: 16, color: "#ff8888", display: "flex", alignItems: "center", gap: 6 }}>🔥 Most Popular</div>
                <div style={{ flex: 1, height: 1, background: "rgba(255,100,100,0.15)" }} />
                <MapBtn onClick={() => setMapActivities(grouped.popular)} color={L.color} />
                <ShareBtn activities={grouped.popular} title="Most Popular" locationName={L.name} tMode={tMode} color={L.color} label="📤 Share All" dH={dH} dM={dM} noTime={noTime} mult={mult} />
                <div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{grouped.popular.length}</div>
              </div>
              {grouped.popular.map((a, i) => <Cd key={a.name} a={a} color={L.color} i={i} dH={dH} dM={dM} tMode={tMode} noTime={noTime} mapLetter={mapActivities && mapActivities.includes(a) ? LETTERS[mapActivities.indexOf(a)] : null} />)}
            </>}
            {grouped.closest.length > 0 && <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                <div style={{ fontFamily: "'Dela Gothic One'", fontSize: 16, color: L.color, display: "flex", alignItems: "center", gap: 6 }}>📍 Closest to You</div>
                <div style={{ flex: 1, height: 1, background: `${L.color}20` }} />
                <MapBtn onClick={() => setMapActivities(grouped.closest)} color={L.color} />
                <ShareBtn activities={grouped.closest} title="Closest Activities" locationName={L.name} tMode={tMode} color={L.color} label="📤 Share All" dH={dH} dM={dM} noTime={noTime} mult={mult} />
                <div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{grouped.closest.length}</div>
              </div>
              {grouped.closest.map((a, i) => <Cd key={a.name} a={a} color={L.color} i={i + grouped.popular.length} dH={dH} dM={dM} tMode={tMode} noTime={noTime} isClosest={true} mapLetter={mapActivities && mapActivities.includes(a) ? LETTERS[mapActivities.indexOf(a)] : null} />)}
            </>}
            {grouped.rest.length > 0 && <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                <div style={{ fontFamily: "'Dela Gothic One'", fontSize: 16, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 6 }}>🗾 More Activities</div>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
                <MapBtn onClick={() => setMapActivities(grouped.rest)} color={L.color} />
                <ShareBtn activities={grouped.rest} title="More Activities" locationName={L.name} tMode={tMode} color={L.color} label="📤 Share All" dH={dH} dM={dM} noTime={noTime} mult={mult} />
                <div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{grouped.rest.length}</div>
              </div>
              {grouped.rest.map((a, i) => <Cd key={a.name} a={a} color={L.color} i={i + grouped.popular.length + grouped.closest.length} dH={dH} dM={dM} tMode={tMode} noTime={noTime} mapLetter={mapActivities && mapActivities.includes(a) ? LETTERS[mapActivities.indexOf(a)] : null} />)}
            </>}
          </div> : <Emp />)}

          {tab === "extra" && !noTime && (extra.length > 0 ? <div style={{ position: "relative", zIndex: 2 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}><div style={{ background: `${L.color}08`, border: `1px solid ${L.color}20`, borderRadius: 12, padding: "12px 16px", flex: 1, fontFamily: "'Zen Kaku Gothic New'", fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>These match your vibe but need more than <strong style={{ color: L.color }}>{fmtD(time)}</strong>. Plan for a longer break.</div><div style={{ marginLeft: 10, flexShrink: 0, display: "flex", gap: 8 }}><MapBtn onClick={() => setMapActivities(extra)} color={L.color} /><ShareBtn activities={extra} title="Extra Time Activities" locationName={L.name} tMode={tMode} color={L.color} label="📤 Share All" dH={dH} dM={dM} noTime={noTime} mult={mult} /></div></div><div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{extra.map((a, i) => { const adj = Math.round(a.travelMin * mult); const ov = (adj * 2 + a.activityMin) - time; return (<div key={a.name} style={{ position: "relative" }}><div style={{ position: "absolute", top: 14, left: 14, zIndex: 6, background: "linear-gradient(135deg,#ff4444,#cc0000)", borderRadius: 8, padding: "4px 10px", fontFamily: "'Dela Gothic One'", fontSize: 12, color: "#fff" }}>+{fmtD(ov)} over</div><Cd a={a} color={L.color} i={i} dH={dH} dM={dM} tMode={tMode} noTime={false} mapLetter={mapActivities && mapActivities.includes(a) ? LETTERS[mapActivities.indexOf(a)] : null} /></div>); })}</div></div> : <Emp msg="All matching activities fit — nice!" />)}

          {tab === "combo" && (combos.length > 0 ? <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: -6 }}><MapBtn onClick={() => { const unique = []; const seen = new Set(); combos.forEach(c => c.acts.forEach(a => { if (!seen.has(a.name)) { seen.add(a.name); unique.push(a); } })); setMapActivities(unique); }} color={L.color} /><ShareBtn activities={combos.flatMap(c => c.acts)} title={`${combos.length} Combos`} locationName={L.name} tMode={tMode} color={L.color} label="📤 Share All Combos" dH={dH} dM={dM} noTime={noTime} mult={mult} /></div>
            {combos.map((c, ci) => {
              const isE = expC === ci;
              // Build timeline (used only in timed mode)
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
                      <div style={{ background: `${L.color}20`, borderRadius: 8, padding: "5px 12px", fontFamily: "'Dela Gothic One'", fontSize: 13, color: L.color }}>⌛ ~{fmtD(c.tot)} total</div>
                      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "5px 12px", fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{c.acts.length} stops</div>
                      {noTime && c.acts.some(a => a.cat !== c.acts[0].cat) && <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "5px 12px", fontFamily: "'Zen Kaku Gothic New'", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>🎯 Mix</div>}
                      <span style={{ marginLeft: "auto", color: L.color, fontSize: 13, transform: isE ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.3s", display: "inline-block" }}>▶</span>
                    </div>
                  </button>
                  {isE && <div style={{ padding: "0 22px 22px", animation: "fu 0.3s both" }}>
                    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "16px 18px", marginBottom: 16, borderLeft: `3px solid ${L.color}40` }}>
                      <div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 12, color: "rgba(255,255,255,0.35)", letterSpacing: 2, marginBottom: 12 }}>{noTime ? "ITINERARY" : "TIMELINE"}</div>
                      {noTime ? (
                        /* ─── NoTime mode: simplified flow ─── */
                        c.acts.map((a, si) => (
                          <div key={si} style={{ marginBottom: si < c.acts.length - 1 ? 14 : 0 }}>
                            <div style={{ display: "flex", gap: 10 }}>
                              <div style={{ width: 30, flexShrink: 0, textAlign: "right", fontFamily: "'Dela Gothic One'", fontSize: 13, color: L.color }}>{si + 1}.</div>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: L.color, flexShrink: 0, marginTop: 5, boxShadow: `0 0 8px ${L.color}60` }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: "'Dela Gothic One'", fontSize: 15 }}>{a.name}<CopyBtn text={a.name} color={L.color} /><WebBtn query={a.name + ' ' + (a.nameJp || '') + ' Hokkaido'} color={L.color} /><InstaBtn query={a.nameJp || a.name} color={L.color} /></div>
                                <div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{a.activityMin}min · {a.cost} · {tMode === "walking" ? "🚶" : tMode === "bus" ? "🚌" : "🚗"} {Math.round(a.travelMin * mult)}min from base</div>
                                <div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: L.color, opacity: 0.7, fontStyle: "italic", marginTop: 4 }}>💡 {a.tip}</div>
                              </div>
                            </div>
                            {si < c.acts.length - 1 && (
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                                <div style={{ width: 30, flexShrink: 0 }} />
                                <div style={{ width: 8, display: "flex", justifyContent: "center", flexShrink: 0 }}><div style={{ width: 1, height: 18, background: `${L.color}30` }} /></div>
                                <div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{tMode === "walking" ? "🚶" : tMode === "bus" ? "🚌" : "🚗"} ~{c.travs[si]}min between stops</div>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        /* ─── Timed mode: full timeline with clock ─── */
                        <>
                          {tl.map((s, si) => (<div key={si} style={{ marginBottom: si < tl.length - 1 ? 14 : 0 }}><div style={{ display: "flex", gap: 10 }}><div style={{ width: 55, flexShrink: 0, textAlign: "right", fontFamily: "'Dela Gothic One'", fontSize: 13, color: L.color }}>{fmt(Math.floor(s.ar), Math.round((s.ar % 1) * 60))}</div><div style={{ width: 8, height: 8, borderRadius: "50%", background: L.color, flexShrink: 0, marginTop: 4, boxShadow: `0 0 8px ${L.color}60` }} /><div><div style={{ fontFamily: "'Dela Gothic One'", fontSize: 15 }}>{s.a.name}<CopyBtn text={s.a.name} color={L.color} /><WebBtn query={s.a.name + ' ' + (s.a.nameJp || '') + ' Hokkaido'} color={L.color} /><InstaBtn query={s.a.nameJp || s.a.name} color={L.color} /></div><div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{s.a.activityMin}min · {s.a.cost}</div><div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: L.color, opacity: 0.7, fontStyle: "italic", marginTop: 4 }}>💡 {s.a.tip}</div></div></div>{si < tl.length - 1 && <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}><div style={{ width: 55, flexShrink: 0, textAlign: "right", fontFamily: "'Zen Kaku Gothic New'", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{fmt(Math.floor(s.dn), Math.round((s.dn % 1) * 60))}</div><div style={{ width: 8, display: "flex", justifyContent: "center", flexShrink: 0 }}><div style={{ width: 1, height: 18, background: `${L.color}30` }} /></div><div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{tMode === "walking" ? "🚶" : tMode === "bus" ? "🚌" : "🚗"} {c.travs[si]}min</div></div>}</div>))}
                          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}><div style={{ width: 55, flexShrink: 0, textAlign: "right", fontFamily: "'Dela Gothic One'", fontSize: 13, color: L.color }}>{fmt(Math.floor(ret), Math.round((ret % 1) * 60))}</div><div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.3)", flexShrink: 0 }} /><div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 14, color: "rgba(255,255,255,0.55)" }}>🏠 Back</div></div>
                        </>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {c.acts.map((a, ai) => <a key={ai} href={`https://www.google.com/maps/search/?api=1&query=${a.mapQuery}`} target="_blank" rel="noopener noreferrer" style={{ background: `${L.color}15`, border: `1px solid ${L.color}30`, borderRadius: 8, padding: "6px 12px", fontFamily: "'Zen Kaku Gothic New'", fontSize: 13, color: L.color, textDecoration: "none" }}>📍 {a.name}</a>)}
                      <ShareBtn activities={c.acts} title={c.acts.map(a => a.name).join(" → ")} locationName={L.name} tMode={tMode} color={L.color} label="📤 Share Combo" dH={dH} dM={dM} noTime={noTime} mult={mult} />
                    </div>
                  </div>}
                </div>
              );
            })}
          </div> : <Emp msg={noTime ? "Select at least 2 categories to see combos." : "No combos fit — try more time or broader filters."} />)}

          <div style={{ height: 40 }} />
        </div>}
      </div>
    </div>
  );
}

const Emp = ({ msg }) => (<div style={{ textAlign: "center", padding: "60px 20px", animation: "fu 0.5s both" }}><div style={{ fontSize: 48, marginBottom: 16 }}>🎌</div><div style={{ fontFamily: "'Dela Gothic One'", fontSize: 18, color: "rgba(255,255,255,0.6)" }}>{msg || "No matches"}</div><div style={{ fontFamily: "'Zen Kaku Gothic New'", fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 8, lineHeight: 1.6 }}>Try adjusting your filters.</div></div>);
