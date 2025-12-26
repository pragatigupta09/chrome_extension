const express = require('express');
const cors = require('cors');
const scrapeProfileRoute = require('./routes/scrape-profile');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/scrape-profile', scrapeProfileRoute);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Profile Scraper API is running' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(` API endpoint: http://localhost:${PORT}/scrape-profile`);
});
