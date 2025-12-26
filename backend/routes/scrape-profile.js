const express = require('express');
const router = express.Router();
const { detectPlatform } = require('../utils/platform-detector');
const { scrapeLinkedIn } = require('../scrapers/linkedin.scraper');
const { scrapeInstagram } = require('../scrapers/instagram.scraper');

router.post('/', async (req, res, next) => {
  try {
    const { url, html } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required and must be a string' });
    }

    if (!html || typeof html !== 'string') {
      return res.status(400).json({ error: 'HTML is required and must be a string' });
    }

    const platform = detectPlatform(url);

    if (!platform) {
      return res.status(400).json({
        error: 'Unsupported URL. Only LinkedIn and Instagram profile pages are supported.',
        url: url
      });
    }

    let scrapedData;
    try {
      if (platform === 'linkedin') {
        scrapedData = scrapeLinkedIn(html, url);
      } else if (platform === 'instagram') {
        scrapedData = scrapeInstagram(html, url);
      } else {
        return res.status(400).json({ error: `Unsupported platform: ${platform}` });
      }
    } catch (scrapeError) {
      console.error(`Scraping error for ${platform}:`, scrapeError);
      return res.status(500).json({
        error: `Failed to scrape ${platform} profile`,
        details: scrapeError.message
      });
    }

    res.json({
      success: true,
      platform: platform,
      url: url,
      data: scrapedData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Route error:', error);
    next(error);
  }
});

module.exports = router;


