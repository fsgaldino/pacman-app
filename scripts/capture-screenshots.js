const puppeteer = require('puppeteer');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');
const BASE_URL = 'http://localhost:3001';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 900 });

  console.log('📸 Capturando screenshots...\n');

  // 1. Auth Screen
  console.log('1/6 Auth Screen...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  // Clear localStorage to show auth screen
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-auth.png'), fullPage: false });
  console.log('   ✅ 06-auth.png');

  // 2. Login
  console.log('2/6 Fazendo login...');
  await page.type('#login-email', 'testuser2@test.com');
  await page.type('#login-pass', '123456');
  await page.click('button[type="submit"]');
  await sleep(3000); // Wait for game to load and intro to play

  // 3. Intro Animation
  console.log('3/6 Intro Animation...');
  // Start a new game to trigger intro
  await page.evaluate(() => {
    if (game) {
      game._clearSave();
      game.init(1);
    }
  });
  await sleep(800); // Wait for intro to start
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-intro.png'), fullPage: false });
  console.log('   ✅ 01-intro.png');

  // 4. Wait for gameplay
  console.log('4/6 Gameplay...');
  // Skip intro
  await page.evaluate(() => {
    if (game && game.state === 'INTRO') game._finishIntro();
  });
  await sleep(3000); // Let game play for a bit
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-gameplay.png'), fullPage: false });
  console.log('   ✅ 02-gameplay.png');

  // 5. Pause Screen
  console.log('5/6 Pause Screen...');
  await page.evaluate(() => {
    if (game && game.state === 'PLAYING') game.togglePause();
  });
  await sleep(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-pause.png'), fullPage: false });
  console.log('   ✅ 03-pause.png');

  // 6. Settings Modal
  console.log('6/6 Settings Modal...');
  await page.click('#settings-btn');
  await sleep(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-settings.png'), fullPage: false });
  console.log('   ✅ 04-settings.png');

  // Close settings
  await page.click('#settings-close');
  await sleep(300);

  console.log('\n🎉 Todas as screenshots capturadas com sucesso!');
  console.log(`📁 Salvas em: ${SCREENSHOTS_DIR}`);

  await browser.close();
})().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
