// 끝까지 흐름 검증 (Playwright headless Chromium, 가짜 시계 page.clock, 데스크톱 + 모바일 390×844).
// 실행: npm i && npx playwright install chromium && python3 -m http.server 8787 (다른 터미널) && npm run test:e2e
// 스크린샷·결과는 tests/e2e/shots/ 에 남는다 (git 에는 넣지 않음).
import { chromium, devices } from 'playwright';
import fs from 'node:fs';
const base = process.env.BASE || 'http://localhost:8787/';
const OUT = new URL('./shots/', import.meta.url).pathname; fs.mkdirSync(OUT, { recursive: true });
const results = []; let fails = 0;
function check(name, ok, detail) { results.push({ name, ok: !!ok, detail }); if (!ok) fails++; console.log((ok ? 'OK  ' : 'FAIL') + ' ' + name + (detail ? '  — ' + detail : '')); }
const HANGUL = /[\uac00-\ud7a3]/;
const START = new Date('2026-11-11T10:00:00+01:00');

async function newPage(browser, mobile) {
  // serviceWorkers:'block' — the app shell SW would answer image requests from its cache and bypass page.route (the thumbnail-failure test needs the 404 to reach the page)
  const ctx = await browser.newContext(Object.assign({ serviceWorkers: 'block' }, mobile ? { ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } : { viewport: { width: 1280, height: 900 } }));
  // the treat button pulses (CSS scale animation), which Playwright reads as 'not stable': freeze that one animation in tests
  await ctx.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '.btn.big{animation:none!important}'; document.head.appendChild(s); }); });
  const page = await ctx.newPage();
  page.setDefaultTimeout(12000);
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|api\/feedback|api\/backup|501|405/.test(m.text())) errors.push(m.text()); });
  page.on('dialog', (d) => d.accept());
  await page.clock.install({ time: START });
  await page.goto(base, { waitUntil: 'load' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });
  await page.clock.runFor(1000);
  return { ctx, page, errors };
}
const txt = (page, sel) => page.locator(sel).first().textContent().then((s) => (s || '').trim());
const vis = (page, sel) => page.locator(sel).first().isVisible();

const browser = await chromium.launch();

// ---------- 1. 30s demo → treat → no level-up, numbers reflect immediately ----------
{
  const { page, errors, ctx } = await newPage(browser, false);
  check('첫 화면 한 줄 설명 + 다음 행동', (await txt(page, '#lead')).includes('25분') && (await txt(page, '#lead')).includes('→'));
  check('상태줄: 레벨·오늘·목표·스트릭·책·해금 6칸', await page.locator('#statusbar .stat').count() === 6);
  check('스트릭 배지 노출', await vis(page, '#streakBadge') && (await txt(page, '#streakTop')).includes('🔥'));
  check('다음 해금 표시', (await txt(page, '#unlockSub')).length > 0 && (await txt(page, '#lvNext')).includes('XP'));
  const demoBox = await page.locator('#demoBtn').boundingBox(), startBox = await page.locator('#startBtn').boundingBox();
  check('30초 체험 버튼 크게(≥44px, 시작 버튼과 나란히)', demoBox.height >= 44 && demoBox.width >= 120, `${Math.round(demoBox.width)}x${Math.round(demoBox.height)} vs start ${Math.round(startBox.width)}x${Math.round(startBox.height)}`);
  for (let i = 0; i < 2; i++) {
    await page.click('#demoBtn');
    check(`체험 ${i + 1}: 집중 화면·일시정지 버튼`, await vis(page, '#ui-focus') && await vis(page, '#pauseBtn'));
    await page.clock.runFor(31_000);
    check(`체험 ${i + 1}: 완료 화면`, await vis(page, '#ui-done'));
    const reward = await txt(page, '#doneReward');
    check(`체험 ${i + 1}: 보상 문구에 XP 없음 명시`, /체험/.test(reward) && !/\+\d+ XP/.test(reward), reward);
    check(`체험 ${i + 1}: 세션 수 즉시 반영(간식 전)`, (await txt(page, '#todaySub')).includes(`체험 ${i + 1}회`), await txt(page, '#todaySub'));
    check(`체험 ${i + 1}: 오늘 시간이 "0분"으로 보이지 않음`, !/0분/.test(await txt(page, '#todaySum')), await txt(page, '#todaySum'));
    await page.click('#treatBtn');
    await page.clock.runFor(6_000);
    check(`체험 ${i + 1}: 간식 후 화면`, await vis(page, '#ui-after'));
    await page.click('#nextBtn');
  }
  check('체험 두 번 뒤에도 Lv.1 유지', (await txt(page, '#lvLabel')).includes('Lv.1'), await txt(page, '#lvLabel'));
  check('체험은 책(완주)으로 안 쌓임', (await txt(page, '#booksTop')).includes('0') || /0/.test(await txt(page, '#booksTop')), await txt(page, '#booksTop'));
  check('체험 뒤 콘솔 오류 없음', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// ---------- 2. 25 min: pause → resume, stop dialog freezes clock, partial time saved ----------
{
  const { page, errors, ctx } = await newPage(browser, false);
  await page.click('#startBtn');
  await page.clock.runFor(60_000);
  check('25분 시작 1분 뒤 24:00(±1초 올림)', /^24:0[01]$/.test(await txt(page, '#clock')), await txt(page, '#clock'));
  await page.click('#pauseBtn');
  check('일시정지 안내 표시', await vis(page, '#pausedNote') && (await txt(page, '#pauseBtn')).includes('이어'), await txt(page, '#pauseBtn'));
  await page.clock.runFor(30_000);
  const frozen = await txt(page, '#clock');
  check('일시정지 중 시계 멈춤', /^24:0[01]$/.test(frozen), frozen);
  await page.click('#pauseBtn');
  await page.clock.runFor(10_000);
  check('이어하기 뒤 다시 흐름 23:50(±1초)', /^23:5[01]$/.test(await txt(page, '#clock')), await txt(page, '#clock'));
  await page.click('#stopBtn');
  check('그만하기 확인 창', await vis(page, '#stopModal'));
  await page.clock.runFor(20_000);
  const frozen2 = await txt(page, '#clock');
  check('확인 창이 떠 있는 동안 시계 멈춤', /^23:5[01]$/.test(frozen2), frozen2);
  await page.click('#keepBtn');
  await page.clock.runFor(10_000);
  check('계속 집중하기 뒤 재개 23:40(±1초)', /^23:4[01]$/.test(await txt(page, '#clock')), await txt(page, '#clock'));
  await page.click('#stopBtn'); await page.click('#confirmStop');
  await page.clock.runFor(1500);
  const msg = await txt(page, '#setupMsg');
  check('부분 집중 시간 저장 안내 (1분 20초)', /1분 20초/.test(msg) && /XP/.test(msg), msg);
  check('상태줄 오늘 시간에 부분 집중 반영', /1분 20초/.test(await txt(page, '#todaySum')) && /부분 집중 1회/.test(await txt(page, '#todaySub')), (await txt(page, '#todaySum')) + ' / ' + (await txt(page, '#todaySub')));
  check('중단 뒤 콩이 삐짐(등 돌림)', (await page.getAttribute('#cat', 'data-pose')) === 'back', await page.getAttribute('#cat', 'data-pose'));
  check('25분 흐름 콘솔 오류 없음', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// ---------- 3. Auto pomodoro: 5-min focus → auto treat → auto short break → auto next focus; 2nd → long break ----------
{
  const { page, errors, ctx } = await newPage(browser, false);
  await page.click('#pomoSet summary');
  await page.selectOption('#pmEvery', '2');
  await page.selectOption('#pmShort', '3');
  await page.selectOption('#pmLong', '10');
  if (!(await page.isChecked('#pmAutoFocus'))) await page.click('#pmAutoFocus');
  check('포모도로 설정: 자동 휴식·자동 다음 집중 켜짐', (await page.isChecked('#pmAutoBreak')) && (await page.isChecked('#pmAutoFocus')));
  await page.fill('#customMin', '5');
  await page.click('#startBtn');
  check('사이클 표시 0/2', (await txt(page, '#cycleBoxF')).includes('0/2'), await txt(page, '#cycleBoxF'));
  await page.clock.runFor(5 * 60_000 + 500);
  check('5분 완주 → 완료 화면', await vis(page, '#ui-done'));
  const rw = await txt(page, '#doneReward');
  check('보상: 5분 · +10 XP (분당1+완주5)', /5분/.test(rw) && /\+10 XP/.test(rw), rw);
  check('자동 간식 카운트다운 안내', /\d+초/.test(await txt(page, '#autoNote')), await txt(page, '#autoNote'));
  await page.clock.runFor(16_000);
  await page.clock.runFor(6_000);
  check('15초 뒤 자동 간식 → 간식 후 화면', await vis(page, '#ui-after'));
  await page.clock.runFor(7_000);
  check('6초 뒤 자동 짧은 휴식(3분)', (await vis(page, '#ui-break')) && (await txt(page, '#breakClock')).startsWith('0'), await txt(page, '#breakClock'));
  const bc = await txt(page, '#breakClock');
  check('휴식 시계 3분 설정 반영', /^0?2:5\d$|^0?3:00$/.test(bc), bc);
  check('휴식 안내에 다음 집중 자동 시작', /자동/.test(await txt(page, '#autoNoteB')), await txt(page, '#autoNoteB'));
  await page.clock.runFor(3 * 60_000 + 1000);
  check('휴식 끝 → 자동으로 다음 집중 시작', await vis(page, '#ui-focus'));
  check('사이클 1/2 · 다음은 짧은 휴식', (await txt(page, '#cycleBoxF')).includes('1/2') && /짧은/.test(await txt(page, '#cycleBoxF')), await txt(page, '#cycleBoxF'));
  await page.clock.runFor(5 * 60_000 + 500);
  await page.clock.runFor(16_000); await page.clock.runFor(6_000); await page.clock.runFor(7_000);
  check('2회 완주 뒤 긴 휴식(10분)', (await vis(page, '#ui-break')) && /^(09:5\d|10:00)$/.test(await txt(page, '#breakClock')), await txt(page, '#breakClock'));
  check('긴 휴식 안내 문구', /긴 휴식|쉬어/.test(await txt(page, '#breakStatus')), await txt(page, '#breakStatus'));
  check('Lv.1 유지 (10+2)*2=24 XP < 60', (await txt(page, '#lvLabel')).includes('Lv.1'), await txt(page, '#lvLabel'));
  check('책 2권', /2/.test(await txt(page, '#booksTop')), await txt(page, '#booksTop'));
  check('스트릭 1일', /1/.test(await txt(page, '#streakTop')), await txt(page, '#streakTop'));
  await page.click('#skipBreak');
  check('포모도로 콘솔 오류 없음', errors.length === 0, errors.join(' | '));
  // level up by many sessions: 25-min ×2 → 64 XP → Lv.2 modal
  await page.evaluate(() => { document.querySelector('#pomoSet').open = true; }); await page.click('#pmAutoBreak'); await page.click('#pmAutoFocus');
  await page.fill('#customMin', '25');
  let leveled = false, lvlText = '';
  const grabLevelUp = async () => { if (await vis(page, '#levelUpModal')) { leveled = true; lvlText = await txt(page, '#lvlMotionDesc'); await page.click('#closeLevelUp'); } };
  for (let i = 0; i < 2; i++) {
    await page.click('#startBtn'); await page.clock.runFor(25 * 60_000 + 500); await grabLevelUp();
    await page.click('#treatBtn'); await page.clock.runFor(6_000); await grabLevelUp();
    await page.click('#nextBtn');
  }
  check('25분 두 번 → Lv.2 레벨업 창(완주 즉시, 해금 행동 안내)', leveled && /해금/.test(lvlText), lvlText);
  check('상태줄 Lv.2', (await txt(page, '#lvLabel')).includes('Lv.2'), await txt(page, '#lvLabel'));
  check('선반에 보물 추가(25분 완주)', (await page.locator('#shelfItems .shelf-item').count()) >= 1);
  await ctx.close();
}

// ---------- 4. Hotspots, mixer, share sheet (WhatsApp), feedback mail fallback, backup export ----------
{
  const { page, errors, ctx } = await newPage(browser, false);
  const pops = async () => page.locator('.hs-pop').count();
  await page.click('#hotspotCoffee'); await page.clock.runFor(300);
  check('머그잔 핫스팟: 효과+말풍선', (await pops()) > 0 && (await vis(page, '#bubble')));
  await page.click('#hotspotPlant'); const plantPops = await pops(); await page.clock.runFor(1500);
  check('화분 핫스팟: 효과+콩이 반응', plantPops > 0 && /화분|창가|식물/.test(await txt(page, '#caption')), await txt(page, '#caption'));
  await page.click('#hotspotBowl'); await page.clock.runFor(1500);
  check('밥그릇 핫스팟: 말풍선/자막', (await vis(page, '#bubble')) || /밥/.test(await txt(page, '#caption')), await txt(page, '#caption'));
  await page.click('#shelf'); await page.clock.runFor(400);
  check('선반 핫스팟: 보물 도감 열림', await vis(page, '#shelfModal') && (await page.locator('.dex-card').count()) === 48);
  await page.keyboard.press('Escape');
  await page.click('#hotspotBook'); await page.clock.runFor(400);
  check('책 핫스팟: 추천 도구 열림', await vis(page, '#toolsModal')); await page.keyboard.press('Escape');
  await page.click('#hotspotRadio'); await page.clock.runFor(400);
  check('🎵 핫스팟: ASMR 믹서 열림', await vis(page, '#radioModal') && (await page.locator('.mix-range').count()) === 12);
  check('공간·시간대 사운드 안내', (await txt(page, '#sndNow')).length > 0, await txt(page, '#sndNow'));
  await page.click('.pchip[data-preset="night"]'); await page.clock.runFor(300);
  const rainVal = await page.locator('.mix-val[data-mix="rain"]').textContent();
  check('추천 조합 적용 → 빗소리 50%, 창문 비', rainVal.trim() === '50%' && (await page.locator('#scene.rainy').count()) === 1, rainVal);
  await page.keyboard.press('Escape');
  // share sheet
  let opened = null;
  await page.exposeFunction('__open', (u) => { opened = u; });
  await page.evaluate(() => { window.open = (u) => { window.__open(u); return null; }; });
  await page.click('#openShareBtn'); await page.clock.runFor(800);
  check('공유 시트 열림', await vis(page, '#shareSheet'));
  const order = await page.$$eval('#shareGrid .btn', (b) => b.filter((x) => !x.hidden).map((x) => x.id));
  check('공유 버튼: 링크 복사·WhatsApp·카카오톡·X·Threads 나란히', ['shCopy', 'shWhatsApp', 'shKakao', 'shX', 'shThreads'].every((id) => order.includes(id)), order.join(','));
  const wa = await page.locator('#shWhatsApp').boundingBox();
  check('WhatsApp 버튼 44px 이상', wa && wa.height >= 44, wa && `${Math.round(wa.width)}x${Math.round(wa.height)}`);
  await page.click('#shWhatsApp');
  check('WhatsApp → wa.me 링크(외부 스크립트 없음)', typeof opened === 'string' && opened.startsWith('https://wa.me/?text=') && decodeURIComponent(opened).includes('kongi-room.anbu-pilot.workers.dev'), opened);
  const pv = await page.evaluate(() => { const c = document.querySelector('#sheetPreview'); const x = c.getContext('2d'); const d = x.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return { w: c.width, h: c.height, cssW: c.getBoundingClientRect().width, cssH: c.getBoundingClientRect().height, painted: n / (c.width * c.height) }; });
  check('공유 카드 미리보기(169×300 비율) 캔버스 그려짐', pv.painted > 0.9 && Math.abs(pv.cssW / pv.cssH - 9 / 16) < 0.02, JSON.stringify(pv));
  await page.keyboard.press('Escape');
  // feedback: mail first; in-app send falls back to mail when no API
  const footOrder = await page.$$eval('.foot-links > *', (els) => els.map((e) => e.id || e.tagName));
  check('푸터: 메일 링크가 앱 안 양식보다 먼저', footOrder.indexOf('mailLink') < footOrder.indexOf('feedbackBtn'), footOrder.join(','));
  check('푸터 만든 사람 + mailto', (await txt(page, '.maker-note')).includes('박하나') && (await page.getAttribute('#mailLink', 'href')).startsWith('mailto:hana.park86@outlook.com'));
  check('GitHub 계정 필요 링크 없음', (await page.locator('a[href*="github.com"]').count()) === 0);
  await page.click('#feedbackBtn'); await page.fill('#fbText', '테스트 의견입니다');
  let mailHref = null; await page.exposeFunction('__mail', (h) => { mailHref = h; });
  await page.evaluate(() => { const o = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.href.startsWith('mailto:')) { window.__mail(this.href); return; } return o.call(this); }; });
  await page.click('#fbSend'); await page.clock.runFor(1500); await page.waitForTimeout(300);
  check('API 없는 호스트에서 앱 안 보내기 → 메일 앱으로 열림', typeof mailHref === 'string' && mailHref.startsWith('mailto:hana.park86@outlook.com') && decodeURIComponent(mailHref).includes('테스트 의견입니다'), mailHref);
  mailHref = null; await page.click('#fbMail'); await page.waitForTimeout(200);
  check('메일 앱으로 보내기 버튼 → mailto', typeof mailHref === 'string' && mailHref.includes('subject='), mailHref);
  await page.keyboard.press('Escape');
  // backup export
  await page.click('#backupBtn');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#bkExport')]);
  const p = await dl.path(); const json = JSON.parse(fs.readFileSync(p, 'utf8'));
  check('기록 내보내기 JSON(app=kongi-room, data 있음)', json.app === 'kongi-room' && json.data && typeof json.data === 'object', dl.suggestedFilename());
  check('백업 안내 문구(기기·브라우저 바뀌면 사라질 수 있음)', /사라질 수 있어요/.test(await txt(page, '#localNote')) && /사라질 수 있어요/.test(await txt(page, '.warn-box')));
  await page.keyboard.press('Escape');
  // together: WhatsApp invite
  opened = null;
  await page.click('#togetherBtn'); await page.click('#tgWa'); await page.clock.runFor(300);
  check('함께 집중: WhatsApp 초대 → wa.me + ?tg= 링크', typeof opened === 'string' && opened.startsWith('https://wa.me/?text=') && /tg=/.test(decodeURIComponent(opened)), opened);
  check('함께 집중: 호스트 카운트다운 창', await vis(page, '#joinModal') && /\d\d:\d\d/.test(await txt(page, '#joinClock')), await txt(page, '#joinClock'));
  await page.clock.runFor(61_000);
  check('약속 시각에 집중 자동 시작 + 친구 고양이 실루엣', (await vis(page, '#ui-focus')) && (await vis(page, '#friendCat')), await txt(page, '#friendTag'));
  check('핫스팟·공유·피드백 콘솔 오류 없음', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// ---------- 5. Languages: no Hangul leaks in EN/DE (incl. album cards, daily line, reward) ----------
{
  const { page, errors, ctx } = await newPage(browser, false);
  await page.click('#demoBtn'); await page.clock.runFor(31_000); await page.click('#treatBtn'); await page.clock.runFor(6_000); await page.click('#nextBtn');
  await page.fill('#customMin', '5'); await page.click('#startBtn'); await page.clock.runFor(5 * 60_000 + 500); await page.click('#treatBtn'); await page.clock.runFor(6_000); await page.click('#nextBtn');
  for (const l of ['en', 'de']) {
    await page.selectOption('#langSel', l); await page.clock.runFor(500);
    const body = await page.evaluate(() => document.querySelector('.app').innerText);
    const leak = body.split('\n').filter((ln) => /[\uac00-\ud7a3]/.test(ln) && ln.trim() !== '한국어'); // the language menu lists each language in its own script
    check(`${l}: 메인 화면에 한글 없음`, leak.length === 0, leak.slice(0, 4).join(' / '));
    await page.click('#albumBtn'); await page.clock.runFor(300);
    const album = await page.evaluate(() => document.querySelector('#albumModal').innerText);
    const aleak = album.split('\n').filter((ln) => /[\uac00-\ud7a3]/.test(ln));
    check(`${l}: 앨범 카드(체험·5분) 한글 없음`, aleak.length === 0 && /demo|Demo/.test(album), aleak.slice(0, 3).join(' / '));
    await page.locator('.polaroid-card').first().click(); await page.clock.runFor(300);
    const pol = await page.evaluate(() => document.querySelector('#polaroidDetailModal').innerText);
    check(`${l}: 폴라로이드 창 한글 없음`, !HANGUL.test(pol), pol.split('\n').filter((x) => HANGUL.test(x)).slice(0, 2).join(' / '));
    await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
    await page.click('#openShareBtn'); await page.clock.runFor(600);
    const sheet = await page.evaluate(() => document.querySelector('#shareSheet').innerText);
    check(`${l}: 공유 시트 한글 없음`, !HANGUL.test(sheet), sheet.split('\n').filter((x) => HANGUL.test(x)).slice(0, 2).join(' / '));
    await page.keyboard.press('Escape');
    await page.click('#hotspotRadio'); await page.clock.runFor(300);
    const mixer = await page.evaluate(() => document.querySelector('#radioModal').innerText);
    check(`${l}: 사운드 믹서 한글 없음`, !HANGUL.test(mixer)); await page.keyboard.press('Escape');
    check(`${l}: 문서 제목 번역`, !HANGUL.test(await page.title()), await page.title());
  }
  await page.selectOption('#langSel', 'ko'); await page.clock.runFor(300);
  check('ko 복귀', (await txt(page, '#lead')).includes('콩이'));
  check('언어 전환 콘솔 오류 없음', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// ---------- 6. Lap mode visual ----------
{
  const { page, errors, ctx } = await newPage(browser, false);
  await page.click('#lapToggle'); await page.clock.runFor(300);
  check('무릎냥이 체크 시 미리보기(무릎 시점)', (await page.locator('#scene.lap-view-on').count()) === 1);
  await page.clock.runFor(3000);
  await page.click('#demoBtn'); await page.clock.runFor(1500); await page.waitForTimeout(900); // opacity transition runs on real time
  const lapOn = await page.evaluate(() => ({ cls: document.querySelector('#scene').className, op: getComputedStyle(document.querySelector('#lapView')).opacity, label: document.querySelector('#lapLabel').textContent, catOp: getComputedStyle(document.querySelector('#cat')).opacity }));
  check('무릎 시점 화면: 담요·무릎 위 콩이·라벨, 방 콩이는 숨김', lapOn.cls.includes('lap-view-on') && lapOn.op === '1' && /무릎/.test(lapOn.label) && lapOn.catOp === '0', JSON.stringify(lapOn));
  await page.screenshot({ path: OUT + 'lap-mode.png' });
  await page.clock.runFor(14_000);
  const lap3 = await txt(page, '#lapLabel');
  check('무릎 위 꿀잠 단계 라벨', /꿀잠|골골/.test(lap3), lap3);
  check('무릎냥이 콘솔 오류 없음', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// ---------- 7. Mobile 390×844: reachability, 44px targets, screenshots ----------
{
  const { page, errors, ctx } = await newPage(browser, true);
  const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  check('모바일: 가로 스크롤 없음', noHScroll, await page.evaluate(() => document.documentElement.scrollWidth + ' vs ' + window.innerWidth));
  const hs = await page.$$eval('.hotspot', (els) => els.filter((e) => getComputedStyle(e).display !== 'none').map((e) => { const r = e.getBoundingClientRect(); return [e.id, Math.round(r.width), Math.round(r.height)]; }));
  check('모바일: 방 핫스팟 모두 44px 이상', hs.length >= 5 && hs.every((h) => h[1] >= 44 && h[2] >= 44), JSON.stringify(hs));
  const btns = await page.$$eval('#startBtn,#demoBtn,#togetherBtn,.hdr-right .btn,#intimacyBtn,#goalBtn', (els) => els.map((e) => { const r = e.getBoundingClientRect(); return [e.id || e.textContent.trim().slice(0, 8), Math.round(r.height)]; }));
  check('모바일: 주요 버튼 44px 이상', btns.every((b) => b[1] >= 44), JSON.stringify(btns));
  await page.screenshot({ path: OUT + 'mobile-setup.png', fullPage: true });
  await page.click('#startBtn'); await page.clock.runFor(2000);
  const pb = await page.locator('#pauseBtn').boundingBox();
  check('모바일: 일시정지 버튼 보이고 44px 이상', pb && pb.height >= 44 && pb.y < 844, pb && JSON.stringify([Math.round(pb.x), Math.round(pb.y), Math.round(pb.width), Math.round(pb.height)]));
  await page.screenshot({ path: OUT + 'mobile-focus.png' });
  await page.click('#stopBtn'); await page.click('#confirmStop'); await page.clock.runFor(1500);
  check('모바일: 1분 미만 중단은 기록에 남지 않음', !/부분/.test(await txt(page, '#todaySub')) && /첫 집중 전/.test(await txt(page, '#todaySum')), (await txt(page, '#todaySum')) + ' / ' + (await txt(page, '#todaySub')));
  await page.click('#demoBtn'); await page.clock.runFor(31_000);
  const tb = await page.locator('#treatBtn').boundingBox();
  check('모바일: 간식 버튼 닿음', tb && tb.height >= 44, tb && JSON.stringify([Math.round(tb.y), Math.round(tb.height)]));
  await page.screenshot({ path: OUT + 'mobile-done.png' });
  await page.click('#treatBtn'); await page.clock.runFor(6_000);
  await page.click('#afterShareBtn'); await page.clock.runFor(800);
  const shBtns = await page.$$eval('#shareGrid .btn', (els) => els.filter((e) => !e.hidden).map((e) => { const r = e.getBoundingClientRect(); return [e.id, Math.round(r.height), r.bottom <= window.innerHeight]; }));
  check('모바일: 공유 버튼 모두 44px 이상·화면 안', shBtns.every((b) => b[1] >= 44 && b[2]), JSON.stringify(shBtns));
  await page.screenshot({ path: OUT + 'mobile-share.png' });
  await page.keyboard.press('Escape');
  await page.click('#hotspotRadio'); await page.clock.runFor(400);
  check('모바일: 믹서 열림', await vis(page, '#radioModal'));
  await page.screenshot({ path: OUT + 'mobile-mixer.png' });
  await page.keyboard.press('Escape');
  // broken image placeholder
  await page.route('**/theme_library_thumb.webp', (r) => r.fulfill({ status: 404, body: '' }));
  await page.reload({ waitUntil: 'load' }); await page.clock.runFor(1500);
  await page.click('#themeBtn'); await page.clock.runFor(500); await page.waitForTimeout(400);
  const broken = await page.evaluate(() => { const c = document.querySelector('.theme-card[data-theme="library"]'); const cs = getComputedStyle(c, '::before'); return { cls: c.className, before: cs.content, h: parseFloat(cs.height) }; });
  check('모바일: 썸네일 로딩 실패 시 안내 자리표시', broken.cls.includes('broken') && /불러오지/.test(broken.before) && broken.h > 40, JSON.stringify(broken));
  await page.screenshot({ path: OUT + 'mobile-themes-broken.png' });
  check('모바일 콘솔 오류 없음 (의도한 썸네일 404 제외)', errors.filter((e) => !/theme_library_thumb|Failed to load resource.*404/.test(e)).length === 0, errors.join(' | '));
  await ctx.close();
}

// ---------- 8. Desktop screenshots for the PR ----------
{
  const { page, ctx } = await newPage(browser, false);
  await page.screenshot({ path: OUT + 'desktop-setup.png', fullPage: true });
  await page.selectOption('#todSel', 'night'); await page.clock.runFor(500); await page.waitForTimeout(1500);
  await page.screenshot({ path: OUT + 'desktop-night.png' });
  const nightBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  check('밤 시간대: 어두운 배경색으로 전환', nightBg === 'rgb(42, 33, 29)', nightBg);
  await ctx.close();
}

await browser.close();
fs.writeFileSync(OUT + 'results.json', JSON.stringify(results, null, 1));
console.log(`\n${results.length - fails}/${results.length} checks passed`);
process.exit(fails ? 1 : 0);
