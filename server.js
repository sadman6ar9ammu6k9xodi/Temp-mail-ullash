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
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('https://www.emailnator.com', { waitUntil: 'networkidle2' });

    // জেনারেট বাটনে ক্লিক
    await page.waitForSelector('button.generate-btn');
    await page.click('button.generate-btn');

    // নতুন ইমেইল সিলেক্টর থেকে লোড হওয়া ইমেইল নিয়ে আসা
    await page.waitForSelector('#email-list li');
    const email = await page.$eval('#email-list li', el => el.textContent.trim());

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
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('https://www.emailnator.com', { waitUntil: 'networkidle2' });

    // ইমেইল ইনপুটে টাইপ করা
    await page.waitForSelector('input[type="text"]');
    await page.type('input[type="text"]', email, { delay: 50 });

    // Add email বাটনে ক্লিক করা
    await page.click('button.add-email-btn');

    // ইনবক্স লোডের জন্য অপেক্ষা
    await page.waitForTimeout(3000);

    // মেসেজ সংগ্রহ
    const messages = await page.$$eval('.message-item', nodes =>
      nodes.map(n => ({
        from: n.querySelector('.from')?.textContent.trim() || 'Unknown',
        subject: n.querySelector('.subject')?.textContent.trim() || 'No Subject'
      }))
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
  console.log(`🚀 Server চলছে: http://localhost:${port}`);
});
