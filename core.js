/* 콩이네 방 core: the pure rules of the room (XP, levels, pomodoro cycle, streak, growth, durations).
   No DOM, no storage, no network. The page loads it as window.KONGI_CORE before app.js;
   the unit tests in tests/ require() the same file, so what is tested is what the app runs. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.KONGI_CORE = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const pad = (n) => String(n).padStart(2, '0');

  // ---- XP and intimacy levels ---------------------------------------------------------------
  // 1 XP per real focused minute, +5 for finishing a session of 5 minutes or more, +2 for the treat.
  // A stopped session keeps half of its minute XP once it lasted a minute. Demos earn nothing.
  const XP_RULE = { perMin: 1, finish: 5, treat: 2, petPerDay: 6, finishMinSec: 300, stopMinSec: 60 };
  const LEVELS = [
    { level: 1, name: 'lv1.name', minXp: 0, maxXp: 60, icon: '🌱', desc: 'lv1.desc', motion: 'lv1.motion', spot: 'sofa', pose: 'sleep' },
    { level: 2, name: 'lv2.name', minXp: 60, maxXp: 180, icon: '🌿', desc: 'lv2.desc', motion: 'lv2.motion', spot: 'desk', pose: 'desk' },
    { level: 3, name: 'lv3.name', minXp: 180, maxXp: 420, icon: '🐾', desc: 'lv3.desc', motion: 'lv3.motion', spot: 'rug', pose: 'belly' },
    { level: 4, name: 'lv4.name', minXp: 420, maxXp: 99999, icon: '👑', desc: 'lv4.desc', motion: 'lv4.motion', spot: 'rug', pose: 'belly' }
  ];
  function xpForFocus(sec, finished, demo) {
    if (demo) return 0;
    sec = Math.max(0, sec | 0);
    return Math.floor(sec / 60) * XP_RULE.perMin + (finished && sec >= XP_RULE.finishMinSec ? XP_RULE.finish : 0);
  }
  function xpForStop(sec, demo) {
    if (demo || !(sec >= XP_RULE.stopMinSec)) return 0;
    return Math.floor(xpForFocus(sec, false) / 2);
  }
  function levelInfo(xp) {
    xp = Math.max(0, +xp || 0);
    for (let i = LEVELS.length - 1; i >= 0; i--) if (xp >= LEVELS[i].minXp) return Object.assign({}, LEVELS[i]);
    return Object.assign({}, LEVELS[0]);
  }
  // Progress inside the current level, 0-100.
  function levelPct(xp) {
    const info = levelInfo(xp);
    if (info.level >= LEVELS.length) return 100;
    return Math.min(100, Math.round(((xp - info.minXp) / (info.maxXp - info.minXp)) * 100));
  }

  // ---- treasures: which tier a finished session reaches ---------------------------------------
  const TIERS = [15, 25, 50, 120];
  function tierOf(min) { let tier = 0; for (const x of TIERS) if (min >= x) tier = x; return tier; }

  // ---- focus stages by progress: settle (0-10%), loaf (10-35%), deep sleep (35%-) ------------
  function stageFor(p) { return p < 0.10 ? 1 : p < 0.35 ? 2 : 3; }

  // ---- durations with seconds: "12분 30초" / "12m 30s" / "12 Min. 30 Sek." -----------------
  const DUR_UNITS = { ko: ['시간', '분', '초', ' '], en: ['h', 'm', 's', ' '], de: [' Std.', ' Min.', ' Sek.', ' '] };
  function fmtDur(sec, lang) {
    sec = Math.max(0, Math.round(sec || 0));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), x = sec % 60;
    const U = DUR_UNITS[lang] || DUR_UNITS.ko;
    const out = [];
    if (h) out.push(h + U[0]);
    if (m) out.push(m + U[1]);
    if (x && !h) out.push(x + U[2]);
    if (!out.length) out.push('0' + U[2]);
    return out.join(U[3]);
  }

  // ---- pomodoro cycle ---------------------------------------------------------------------------
  // focus -> (treat) -> short break -> focus ... ; after `every` focuses the break is the long one
  // and the cycle starts over. autoBreak/autoFocus decide whether the next step starts by itself.
  const POMO_DEF = { short: 5, long: 15, every: 4, autoBreak: true, autoFocus: false, sound: true, notify: false };
  function pomoEvery(s) { return Math.max(2, (s && s.every) | 0); }
  function pomoNextBreak(cycle, s) {
    s = s || POMO_DEF; cycle = Math.max(0, cycle | 0);
    const long = cycle > 0 && cycle % pomoEvery(s) === 0;
    return { long, min: long ? s.long : s.short };
  }
  // The state machine the app follows. state: {ui, cycle, long?}  ui: setup|focus|done|after|break
  function pomoReduce(state, event, s) {
    s = s || POMO_DEF;
    const st = Object.assign({ ui: 'setup', cycle: 0 }, state);
    const demo = event && event.demo;
    const type = typeof event === 'string' ? event : event.type;
    switch (st.ui) {
      case 'setup':
        if (type === 'start') return { ui: 'focus', cycle: st.cycle, demo: !!demo };
        break;
      case 'focus':
        if (type === 'complete') return { ui: 'done', cycle: st.demo ? st.cycle : st.cycle + 1, demo: !!st.demo, auto: !st.demo && !!s.autoBreak };
        if (type === 'stop') return { ui: 'setup', cycle: st.cycle };
        break;
      case 'done':
        if (type === 'treat') return { ui: 'after', cycle: st.cycle, demo: !!st.demo, auto: !st.demo && !!s.autoBreak };
        break;
      case 'after':
        if (type === 'break') { const nb = pomoNextBreak(st.cycle, s); return { ui: 'break', cycle: nb.long ? 0 : st.cycle, long: nb.long, min: nb.min }; }
        if (type === 'next') return { ui: 'setup', cycle: st.cycle };
        break;
      case 'break':
        if (type === 'breakEnd') return s.autoFocus ? { ui: 'focus', cycle: st.cycle, demo: false } : { ui: 'setup', cycle: st.cycle };
        if (type === 'skipBreak') return { ui: 'setup', cycle: st.cycle };
        break;
    }
    return st; // anything else leaves the state alone
  }

  // ---- streak: one count per day, kept alive by today or yesterday --------------------------------
  function dayKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function streakValid(s, today, yesterday) {
    if (!s || !s.count || !s.last) return 0;
    return (s.last === today || s.last === yesterday) ? s.count : 0;
  }
  function streakBump(s, today, yesterday) {
    s = Object.assign({ count: 0, best: 0, last: null }, s);
    if (s.last !== today) { s.count = (s.last === yesterday) ? (s.count || 0) + 1 : 1; s.last = today; }
    s.best = Math.max(s.best || 0, s.count);
    return s;
  }

  // ---- growth: room decorations and seasons unlock with lifetime focus minutes --------------------
  const DECOR = [
    { id: 'flower', min: 50, icon: '🌸', at: [60, 41] },
    { id: 'yarn', min: 120, icon: '🧶', at: [63, 88] },
    { id: 'portrait', min: 240, icon: '🖼️', at: [10, 30] },
    { id: 'fish', min: 400, icon: '🐟', at: [33, 60] },
    { id: 'garland', min: 700, icon: '🎐', at: [51, 8] },
    { id: 'crown', min: 1200, icon: '👑', at: [85, 66] }
  ];
  const SEASONS = [{ id: 'spring', min: 0, icon: '🌸' }, { id: 'summer', min: 300, icon: '🌻' }, { id: 'autumn', min: 900, icon: '🍂' }, { id: 'winter', min: 1800, icon: '❄️' }];
  function seasonFor(min) { let s = SEASONS[0]; for (const x of SEASONS) if (min >= x.min) s = x; return s; }
  function unlockList() {
    return DECOR.map((d) => ({ kind: 'decor', id: d.id, min: d.min, icon: d.icon, name: 'dc.' + d.id }))
      .concat(SEASONS.slice(1).map((x) => ({ kind: 'season', id: x.id, min: x.min, icon: x.icon, name: 'season.' + x.id })))
      .sort((a, b) => a.min - b.min);
  }
  function nextUnlock(min) { return unlockList().find((u) => u.min > min) || null; }

  return {
    XP_RULE, LEVELS, xpForFocus, xpForStop, levelInfo, levelPct,
    TIERS, tierOf, stageFor, fmtDur,
    POMO_DEF, pomoEvery, pomoNextBreak, pomoReduce,
    dayKey, streakValid, streakBump,
    DECOR, SEASONS, seasonFor, unlockList, nextUnlock
  };
});
