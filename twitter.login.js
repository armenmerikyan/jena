const puppeteer = require('puppeteer');
require('dotenv').config();

const username = process.env.TWITTER_USER;
const password = process.env.TWITTER_PASS;
const handle = process.argv[2];

if (!handle) {
  console.error('❌ Please provide a Twitter/X handle as an argument');
  process.exit(1);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Set headers and user-agent
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/123.0.0.0 Safari/537.36'
  );

  await page.setExtraHTTPHeaders({
    'accept-language': 'en-US,en;q=0.9',
  });

  await page.setViewport({ width: 1280, height: 1024 });

  await page.goto('https://x.com/login', { waitUntil: 'networkidle2' });

  // Enter username
  await page.waitForSelector('input[name="text"]');
  await page.type('input[name="text"]', username);
  await page.keyboard.press('Enter');
  await sleep(2000);

  // Enter password
  await page.waitForSelector('input[name="password"]');
  await page.type('input[name="password"]', password);
  await page.keyboard.press('Enter');

  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  console.log(`✅ Logged in as: ${username}`);

  // Navigate to profile
  const profileUrl = `https://x.com/${handle}`;
  console.log(`🔍 Navigating to profile: ${profileUrl}`);
  await page.goto(profileUrl, { waitUntil: 'networkidle2' });

  // Scroll to load tweets
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await sleep(1500);
  }

  // Extract latest 30 tweets
  const tweets = await page.evaluate(() => {
    const articles = Array.from(document.querySelectorAll('article'));
    return articles.map(article => {
      const textBlocks = Array.from(article.querySelectorAll('div[lang]'));
      return textBlocks.map(el => el.innerText).join(' ');
    }).filter(Boolean).slice(0, 30);
  });

  console.log(`\n📝 Latest 30 tweets by @${handle}:\n`);
  tweets.forEach((tweet, index) => {
    console.log(`${index + 1}. ${tweet}\n`);
  });

  await browser.close();
})();
