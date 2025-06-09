const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

async function launchBrowser() {
  return await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--single-process',
      '--disable-gpu'
    ],
    defaultViewport: null,
    timeout: 60000,
  });
}

app.get('/gen', async (req, res) => {
  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto('https://gmailnator.com', { waitUntil: 'networkidle2', timeout: 60000 });

    await page.waitForSelector('#btn-gen', { timeout: 30000 });
    await page.click('#btn-gen');

    await page.waitForSelector('#email', { timeout: 30000 });
    const email = await page.$eval('#email', el => el.textContent.trim());

    res.json({ email });
  } catch (error) {
    console.error('Error in /gen:', error);
    res.status(500).json({ error: 'ইমেইল তৈরি করতে সমস্যা হয়েছে।' });
  } finally {
    if (browser) await browser.close();
  }
});

app.get('/inbox', async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: 'ইমেইল প্রদান করুন।' });

  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto('https://gmailnator.com', { waitUntil: 'networkidle2', timeout: 60000 });

    await page.waitForSelector('#email-input', { timeout: 30000 });
    await page.focus('#email-input');
    await page.keyboard.type(email, { delay: 100 });

    await page.click('#btn-check');

    await page.waitForSelector('.mail-list-item', { timeout: 30000 });

    const messages = await page.$$eval('.mail-list-item', items =>
      items.map(item => {
        const from = item.querySelector('.from')?.textContent.trim() || 'Unknown';
        const subject = item.querySelector('.subject')?.textContent.trim() || 'No Subject';
        const snippet = item.querySelector('.snippet')?.textContent.trim() || '';
        return { from, subject, snippet };
      })
    );

    if (messages.length === 0) {
      res.json({ message: 'ইনবক্স খালি আছে।' });
    } else {
      res.json({ email, messages });
    }
  } catch (error) {
    console.error('Error in /inbox:', error);
    res.status(500).json({ error: 'ইনবক্স পড়তে সমস্যা হয়েছে।' });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(port, () => {
  console.log(`Server চলছে: http://localhost:${port}`);
});
