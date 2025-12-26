1. Architecture Decisions

This project is designed using a client–server architecture with a clear separation of responsibilities between the Chrome extension (frontend) and the Node.js backend.

- Chrome Extension (Client-Side)

Runs directly in the user’s browser.

Captures fully rendered HTML from LinkedIn and Instagram profile pages.

Sends the captured HTML along with the profile URL to the backend.

Displays the extracted structured data in the popup UI.

Why this approach?

LinkedIn and Instagram are client-side rendered websites.

Scraping directly from the backend would not work reliably due to dynamic loading and authentication.

Capturing HTML from the browser ensures we scrape the same content the user sees.

- Backend (Server-Side)

Built using Node.js and Express.

Receives raw HTML from the extension.

Detects the platform (LinkedIn or Instagram).

Uses Cheerio to parse and extract structured profile data.

Returns clean JSON to the extension.

Why Cheerio?

Lightweight and fast

jQuery-like syntax

Ideal for server-side HTML parsing

🔹 Modular Scraper Design

Each platform has its own scraper:

linkedin.scraper.js

instagram.scraper.js

This makes the system:

Easy to maintain

Easy to extend to new platforms

Resistant to UI changes on one platform affecting others

2. URL Detection Logic

The platform is detected using regular expressions based on the active tab’s URL.

const linkedinPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/[^\/\?]+/i;
const instagramPattern = /^https?:\/\/(www\.)?instagram\.com\/[^\/\?]+/i;

Detection Flow:
1.The Chrome extension captures the current tab URL.
2.The URL is sent to the backend along with the HTML.
3.The backend checks the URL against predefined regex patterns.
4.Based on the match, the correct scraper is selected.

Supported URLs:
https://www.linkedin.com/in/username
https://www.instagram.com/username

Unsupported URLs:
LinkedIn company pages
Instagram posts or reels
Any non-profile pages

3. How to Test LinkedIn vs Instagram Scraping

Prerequisites
1.Node.js installed
2.Chrome browser
3.Backend server running on http://localhost:3000
4.Chrome extension loaded in Developer Mode

Testing LinkedIn Profile Scraping
1.Open Chrome
2.Navigate to a LinkedIn profile page
3.Open the Chrome extension popup
4.Confirm the platform badge shows LinkedIn
5.Click “Send Page to Backend”
6.Verify extracted data appears in the popup:
-Name
-Headline
-Location
-Followers
-Connections

Testing Instagram Profile Scraping
1.Navigate to an Instagram profile page
2.Open the Chrome extension popup
3.Confirm the platform badge shows Instagram
4.Click “Send Page to Backend”
5.Verify extracted data appears in the popup:
-Username
-Display Name
-Bio
-Followers
-Following
-Posts