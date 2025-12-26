function detectPlatform(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const linkedinPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/[^\/\?]+/i;
  
  const instagramPattern = /^https?:\/\/(www\.)?instagram\.com\/[^\/\?]+/i;

  if (linkedinPattern.test(url)) {
    return 'linkedin';
  }

  if (instagramPattern.test(url)) {
    return 'instagram';
  }

  return null;
}

module.exports = { detectPlatform };


