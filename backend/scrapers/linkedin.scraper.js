const cheerio = require('cheerio');

function scrapeLinkedIn(html, url) {
  const $ = cheerio.load(html);
  const data = {
    name: null,
    headline: null,
    location: null,
    about: null,
    followerCount: null,
    connectionCount: null
  };

  try {
    data.name = $('h1.text-heading-xlarge, h1.pv-text-details__left-panel h1, h1[data-generated-suggestion-target]').first().text().trim() ||
                $('h1').first().text().trim() ||
                $('[data-generated-suggestion-target]').first().text().trim() ||
                $('.pv-text-details__left-panel h1').first().text().trim();

    data.headline = $('.text-body-medium.break-words, .pv-text-details__left-panel .text-body-medium').first().text().trim() ||
                    $('[data-generated-suggestion-target] + .text-body-medium').first().text().trim() ||
                    $('.pv-text-details__left-panel > div.text-body-medium').first().text().trim();

    data.location = $('.text-body-small.inline.t-black--light.break-words, .pv-text-details__left-panel .text-body-small').first().text().trim() ||
                    $('[data-test-id="location"]').text().trim() ||
                    $('.pv-text-details__left-panel span.text-body-small').first().text().trim();

    const aboutSection = $('section:contains("About"), #about, [data-section="about"]').first();
    if (aboutSection.length) {
      data.about = aboutSection.find('.pv-shared-text-with-see-more, .inline-show-more-text, .pv-about__summary-text').text().trim() ||
                   aboutSection.find('.text-body-medium').text().trim();
    }

    const followersText = $('span:contains("followers"), span:contains("Followers")').first().text();
    const followersMatch = followersText.match(/([\d,]+)\s*followers?/i);
    if (followersMatch) {
      data.followerCount = parseInt(followersMatch[1].replace(/,/g, ''), 10);
    }

    const connectionsText = $('span:contains("connections"), span:contains("Connections")').first().text();
    const connectionsMatch = connectionsText.match(/([\d,]+)\+?\s*connections?/i);
    if (connectionsMatch) {
      data.connectionCount = parseInt(connectionsMatch[1].replace(/,/g, ''), 10);
    }

    if (!data.followerCount) {
      const followerEl = $('[data-test-id="followers-count"], .t-black--light:contains("followers")').first();
      const followerText = followerEl.text();
      const match = followerText.match(/([\d,]+)/);
      if (match) {
        data.followerCount = parseInt(match[1].replace(/,/g, ''), 10);
      }
    }

    if (!data.connectionCount) {
      const connectionEl = $('[data-test-id="connections-count"], .t-black--light:contains("connections")').first();
      const connectionText = connectionEl.text();
      const match = connectionText.match(/([\d,]+)/);
      if (match) {
        data.connectionCount = parseInt(match[1].replace(/,/g, ''), 10);
      }
    }

    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string') {
        data[key] = data[key].replace(/\s+/g, ' ').trim() || null;
      }
    });

  } catch (error) {
    console.error('Error scraping LinkedIn:', error);
    throw new Error(`Failed to scrape LinkedIn profile: ${error.message}`);
  }

  return data;
}

module.exports = { scrapeLinkedIn };


