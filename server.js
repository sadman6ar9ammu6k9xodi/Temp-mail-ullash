const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());

let savedEmail = null;

app.get('/gen', async (req, res) => {
  try {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://www.emailnator.com', { waitUntil: 'networkidle2' });

    await page.waitForSelector('button.generate-btn');
    await page.click('button.generate-btn');
    await page.waitForSelector('#email-list li');

    const email = await page.$eval('#email-list li', el => el.textContent.trim());
    savedEmail = email;

    await browser.close();
    res.json({ email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ইমেইল তৈরি করতে সমস্যা হয়েছে।' });
  }
});

app.get('/inbox', async (req, res) => {
  const email = req.query.email || savedEmail;
  if (!email) return res.status(400).json({ error: 'ইমেইল দিন।' });

  try {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://www.emailnator.com', { waitUntil: 'networkidle2' });

    await page.waitForSelector('input[type="text"]');
    await page.type('input[type="text"]', email, { delay: 50 });

    await page.click('button.add-email-btn');
    await page.waitForTimeout(2500); // মেইল লোড হওয়ার জন্য সময়

    const messages = await page.$$eval('.message-item', nodes => nodes.map(n => ({
      from: n.querySelector('.from')?.textContent.trim(),
      subject: n.querySelector('.subject')?.textContent.trim()
    })));

    await browser.close();

    res.json({ email, messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ইনবক্স পড়তে সমস্যা হয়েছে।' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Gmailnator API চলছে: http://localhost:${port}`);
});
