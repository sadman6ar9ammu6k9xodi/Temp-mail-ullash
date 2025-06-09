const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.get('/gen', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto('https://gmailnator.com', { waitUntil: 'networkidle2' });

    // Generate Email বাটনে ক্লিক করা
    await page.waitForSelector('#btn-gen');
    await page.click('#btn-gen');

    // ইমেইলটা পেতে অপেক্ষা করা
    await page.waitForSelector('#email');
    const email = await page.$eval('#email', el => el.textContent.trim());

    await browser.close();

    res.json({ email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'ইমেইল তৈরি করতে সমস্যা হয়েছে।' });
  }
});

app.get('/inbox', async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: 'ইমেইল প্রদান করুন।' });

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto('https://gmailnator.com', { waitUntil: 'networkidle2' });

    // Email ইনপুটে টাইপ করা
    await page.waitForSelector('#email-input');
    await page.focus('#email-input');
    await page.keyboard.type(email, { delay: 100 });

    // Inbox বাটনে ক্লিক করা
    await page.click('#btn-check');

    // মেসেজ লোড হতে অপেক্ষা
    await page.waitForSelector('.mail-list-item');

    // মেসেজ ডাটা সংগ্রহ
    const messages = await page.$$eval('.mail-list-item', items =>
      items.map(item => {
        const from = item.querySelector('.from')?.textContent.trim() || 'Unknown';
        const subject = item.querySelector('.subject')?.textContent.trim() || 'No Subject';
        return { from, subject };
      })
    );

    await browser.close();

    if (messages.length === 0) {
      return res.json({ message: 'ইনবক্স খালি আছে।' });
    }

    res.json({ email, messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'ইনবক্স পড়তে সমস্যা হয়েছে।' });
  }
});

app.listen(port, () => {
  console.log(`Server চলছে: http://localhost:${port}`);
});
