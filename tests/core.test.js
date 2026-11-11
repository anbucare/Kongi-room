// 순수 규칙 테스트: XP·레벨, 포모도로 상태기계, 스트릭, 성장 해금, 시간 표기. core.js 는 앱이 실제로 쓰는 파일이다.
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../core.js');

test('XP: 체험(데모)은 0, 실제 집중은 분당 1 + 완주 5', () => {
  assert.equal(C.xpForFocus(30, true, true), 0, '30초 체험은 XP 없음');
  assert.equal(C.xpForFocus(25 * 60, true, false), 25 + 5);
  assert.equal(C.xpForFocus(50 * 60, true), 55);
  assert.equal(C.xpForFocus(4 * 60, true), 4, '5분 미만 완주는 완주 보너스 없음');
  assert.equal(C.xpForFocus(90, false), 1, '중단 시 분 단위만');
});

test('XP: 중단해도 1분 이상이면 절반 저장, 1분 미만·체험은 0', () => {
  assert.equal(C.xpForStop(59), 0);
  assert.equal(C.xpForStop(10 * 60), 5);
  assert.equal(C.xpForStop(10 * 60, true), 0);
});

test('레벨: 체험 두 번으로는 Lv.2 가 되지 않고, 60/180/420 XP 에서 오른다', () => {
  let xp = 0;
  xp += C.xpForFocus(30, true, true) + C.xpForFocus(30, true, true);
  assert.equal(C.levelInfo(xp).level, 1);
  assert.equal(C.levelInfo(59).level, 1);
  assert.equal(C.levelInfo(60).level, 2);
  assert.equal(C.levelInfo(180).level, 3);
  assert.equal(C.levelInfo(420).level, 4);
  assert.equal(C.levelInfo(-5).level, 1);
  assert.equal(C.levelPct(30), 50);
  assert.equal(C.levelPct(420), 100);
  // 25분 집중 두 번(각 30 XP) + 간식 2회(각 2 XP) = 64 XP -> Lv.2
  const two = 2 * (C.xpForFocus(25 * 60, true) + C.XP_RULE.treat);
  assert.equal(C.levelInfo(two).level, 2);
  assert.equal(C.LEVELS.length, 4);
  for (let i = 1; i < C.LEVELS.length; i++) assert.equal(C.LEVELS[i].minXp, C.LEVELS[i - 1].maxXp, '레벨 구간이 이어져야 함');
});

test('보물 등급: 15/25/50/120분 기준', () => {
  assert.equal(C.tierOf(5), 0);
  assert.equal(C.tierOf(15), 15);
  assert.equal(C.tierOf(49), 25);
  assert.equal(C.tierOf(130), 120);
});

test('몰입 단계: 0~10% 자리 잡기, 10~35% 식빵, 그 뒤 꿀잠', () => {
  assert.equal(C.stageFor(0), 1);
  assert.equal(C.stageFor(0.099), 1);
  assert.equal(C.stageFor(0.1), 2);
  assert.equal(C.stageFor(0.35), 3);
  assert.equal(C.stageFor(0.99), 3);
});

test('시간 표기: 초 단위 포함, 세 언어', () => {
  assert.equal(C.fmtDur(0, 'ko'), '0초');
  assert.equal(C.fmtDur(30, 'ko'), '30초');
  assert.equal(C.fmtDur(90, 'ko'), '1분 30초');
  assert.equal(C.fmtDur(3600, 'ko'), '1시간');
  assert.equal(C.fmtDur(3661, 'ko'), '1시간 1분', '1시간 이상이면 초는 생략');
  assert.equal(C.fmtDur(90, 'en'), '1m 30s');
  assert.equal(C.fmtDur(90, 'de'), '1 Min. 30 Sek.');
  assert.equal(C.fmtDur(-3, 'en'), '0s');
});

test('포모도로: 4회마다 긴 휴식, 그 외 짧은 휴식', () => {
  const s = Object.assign({}, C.POMO_DEF, { short: 5, long: 15, every: 4 });
  assert.deepEqual(C.pomoNextBreak(0, s), { long: false, min: 5 });
  assert.deepEqual(C.pomoNextBreak(3, s), { long: false, min: 5 });
  assert.deepEqual(C.pomoNextBreak(4, s), { long: true, min: 15 });
  assert.deepEqual(C.pomoNextBreak(8, s), { long: true, min: 15 });
  assert.equal(C.pomoEvery({ every: 1 }), 2, '긴 휴식 주기는 최소 2');
  assert.deepEqual(C.pomoNextBreak(2, { short: 3, long: 10, every: 2 }), { long: true, min: 10 });
});

test('포모도로 상태기계: 집중→완료→간식→휴식→(자동)다음 집중, 4회 뒤 긴 휴식으로 사이클 초기화', () => {
  const s = Object.assign({}, C.POMO_DEF, { autoBreak: true, autoFocus: true, every: 4 });
  let st = { ui: 'setup', cycle: 0 };
  for (let i = 1; i <= 4; i++) {
    st = C.pomoReduce(st, 'start', s); assert.equal(st.ui, 'focus');
    st = C.pomoReduce(st, 'complete', s); assert.equal(st.ui, 'done'); assert.equal(st.cycle, i); assert.equal(st.auto, true, '자동 간식·휴식');
    st = C.pomoReduce(st, 'treat', s); assert.equal(st.ui, 'after');
    st = C.pomoReduce(st, 'break', s); assert.equal(st.ui, 'break');
    if (i < 4) { assert.equal(st.long, false); assert.equal(st.min, 5); assert.equal(st.cycle, i); }
    else { assert.equal(st.long, true, '4번째는 긴 휴식'); assert.equal(st.min, 15); assert.equal(st.cycle, 0, '긴 휴식 뒤 사이클 초기화'); }
    st = C.pomoReduce(st, 'breakEnd', s); assert.equal(st.ui, i < 4 ? 'focus' : 'focus', '자동 시작이면 바로 집중');
    if (i === 4) break;
    st = C.pomoReduce(st, 'stop', s); st = { ui: 'setup', cycle: st.cycle }; // 다음 반복은 setup 에서 시작
  }
});

test('포모도로 상태기계: 자동 시작이 꺼져 있으면 휴식 뒤 설정 화면, 중단은 사이클을 늘리지 않음, 체험은 사이클에 안 들어감', () => {
  const s = Object.assign({}, C.POMO_DEF, { autoBreak: false, autoFocus: false });
  let st = C.pomoReduce({ ui: 'setup', cycle: 1 }, 'start', s);
  st = C.pomoReduce(st, 'stop', s);
  assert.deepEqual(st, { ui: 'setup', cycle: 1 });
  st = C.pomoReduce(C.pomoReduce(st, 'start', s), 'complete', s);
  assert.equal(st.auto, false);
  st = C.pomoReduce(C.pomoReduce(st, 'treat', s), 'break', s);
  st = C.pomoReduce(st, 'breakEnd', s);
  assert.equal(st.ui, 'setup');
  const demo = C.pomoReduce(C.pomoReduce({ ui: 'setup', cycle: 2 }, { type: 'start', demo: true }, s), 'complete', s);
  assert.equal(demo.cycle, 2, '체험 완료는 사이클을 늘리지 않음');
  assert.equal(demo.auto, false, '체험 뒤에는 자동 휴식 없음');
  assert.equal(C.pomoReduce({ ui: 'focus', cycle: 0 }, 'treat', s).ui, 'focus', '맞지 않는 이벤트는 무시');
  assert.equal(C.pomoReduce({ ui: 'break', cycle: 3 }, 'skipBreak', s).ui, 'setup');
});

test('스트릭: 어제 이어 오늘이면 +1, 하루 비면 1부터, 같은 날 두 번은 그대로', () => {
  const today = '2026-11-11', yest = '2026-11-10';
  assert.equal(C.streakValid(null, today, yest), 0);
  assert.equal(C.streakValid({ count: 3, last: yest }, today, yest), 3);
  assert.equal(C.streakValid({ count: 3, last: '2026-11-08' }, today, yest), 0);
  let s = C.streakBump({ count: 0, best: 0, last: null }, today, yest);
  assert.deepEqual(s, { count: 1, best: 1, last: today });
  s = C.streakBump(s, today, yest);
  assert.equal(s.count, 1, '같은 날 두 번 완주해도 1');
  s = C.streakBump({ count: 4, best: 4, last: yest }, today, yest);
  assert.deepEqual(s, { count: 5, best: 5, last: today });
  s = C.streakBump({ count: 4, best: 9, last: '2026-11-01' }, today, yest);
  assert.deepEqual(s, { count: 1, best: 9, last: today });
  assert.equal(C.dayKey(new Date(2026, 0, 5)), '2026-01-05');
});

test('성장: 누적 분으로 장식·계절이 순서대로 열리고, 다음 해금을 알려준다', () => {
  assert.equal(C.seasonFor(0).id, 'spring');
  assert.equal(C.seasonFor(300).id, 'summer');
  assert.equal(C.seasonFor(1799).id, 'autumn');
  assert.equal(C.seasonFor(1800).id, 'winter');
  const list = C.unlockList();
  for (let i = 1; i < list.length; i++) assert.ok(list[i].min >= list[i - 1].min, '해금 목록은 오름차순');
  assert.equal(C.nextUnlock(0).id, 'flower');
  assert.equal(C.nextUnlock(50).id, 'yarn');
  assert.equal(C.nextUnlock(120).id, 'portrait');
  assert.equal(C.nextUnlock(240).id, 'summer');
  assert.equal(C.nextUnlock(5000), null);
});
