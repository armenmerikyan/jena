const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const username = process.env.TWITTER_USER;
const password = process.env.TWITTER_PASS;
const email = process.env.TWITTER_EMAIL;
const handle = process.argv[2];
const cookiesPath = path.resolve(__dirname, 'cookies.json');

if (!handle) {
  console.error('❌ Please provide a Twitter/X handle as an argument');
  process.exit(1);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/123.0.0.0 Safari/537.36'
  );
  await page.setExtraHTTPHeaders({ 'accept-language': 'en-US,en;q=0.9' });
  await page.setViewport({ width: 1280, height: 1024 });

  if (fs.existsSync(cookiesPath)) {
    const cookies = JSON.parse(fs.readFileSync(cookiesPath));
    await page.setCookie(...cookies);
  }

  await page.goto('https://x.com/home', { waitUntil: 'networkidle2' });

  const isLoggedIn = await page.evaluate(() => {
    return !!document.querySelector('a[href="/home"]');
  });

  if (!isLoggedIn) {
    console.log('🔐 Logging in...');
    await page.goto('https://x.com/login', { waitUntil: 'networkidle2' });

    await page.waitForSelector('input[name="text"]', { timeout: 10000 });
    await page.type('input[name="text"]', username);
    await page.keyboard.press('Enter');
    await sleep(3000);

    const nextInput = await page.waitForSelector('input[name="text"], input[name="email"]', { timeout: 10000 });

    const labelText = await page.evaluate(input => {
      const label = input.closest('div');
      return label ? label.innerText.toLowerCase() : '';
    }, nextInput);

    if (labelText.includes('email') && email) {
      console.log('📧 Email requested. Entering email...');
      await nextInput.type(email);
      await page.keyboard.press('Enter');
      await sleep(3000);
    } else {
      console.log('➡️ No email requested. Proceeding to password.');
    }

    try {
      await page.waitForSelector('input[name="password"]', { timeout: 15000 });
      await page.type('input[name="password"]', password);
      await page.keyboard.press('Enter');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    } catch (err) {
      console.error('❌ Could not enter password or continue login.');
      await page.screenshot({ path: 'login_error.png' });
      await browser.close();
      process.exit(1);
    }

    const cookies = await page.cookies();
    fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));

    console.log(`✅ Logged in and cookies saved.`);
  } else {
    console.log(`✅ Already logged in with saved cookies.`);
  }

  const profileUrl = `https://x.com/${handle}`;
  console.log(`🔍 Navigating to profile: ${profileUrl}`);
  await page.goto(profileUrl, { waitUntil: 'networkidle2' });

  // Wait for tweet articles to load
  await page.waitForSelector('article div[lang]', { timeout: 15000 });

  // Scroll to load more tweets
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await sleep(1500);
  }

  // Optional screenshot for debugging
  await page.screenshot({ path: 'tweets_loaded.png', fullPage: true });

  const tweetCount = await page.evaluate(() => document.querySelectorAll('article').length);
  console.log(`🔎 Found ${tweetCount} tweet articles.`);

  const tweets = await page.evaluate(() => {
    const articles = Array.from(document.querySelectorAll('article'));
    return articles.map(article => {
      const textBlocks = Array.from(article.querySelectorAll('div[lang]'));
      return textBlocks.map(el => el.innerText).join(' ');
    }).filter(Boolean).slice(0, 30);
  });

  console.log(`\n📝 Latest 30 tweets by @${handle}:\n`);
  if (tweets.length === 0) {
    console.log("⚠️ No tweets found. Check selector or page content.");
  } else {
    tweets.forEach((tweet, index) => {
      console.log(`${index + 1}. ${tweet}\n`);
    });
  }

  await browser.close();
})();
