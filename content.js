// Extracts the logged-in user's display name from Google Meet's embedded page data.
// Google Meet embeds user info in AF_initDataCallback({key: 'ds:10', ...})
// where data[6] is the display name.
function extractUserName(doc) {
  for (const script of doc.querySelectorAll('script')) {
    const text = script.textContent;
    const match = text.match(/AF_initDataCallback\(\{key:\s*'ds:10'.*?data:\s*(\[.*?\])\s*,\s*sideChannel/s);
    if (match) {
      try {
        const data = JSON.parse(match[1]);
        return data[6] || null;
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractUserName };
}
