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

// Finds the self-view tile container by walking up from the user's "More options" button.
// Stops when the parent contains other participant tiles (identified by data-participant-id
// or other "More options for" buttons). The self-view tile never has data-participant-id.
function findSelfViewTile(doc, userName) {
  const selfButton = doc.querySelector(`[aria-label="More options for ${userName}"]`);
  if (!selfButton) {
    return null;
  }

  let current = selfButton;
  let tile = null;
  while (current.parentElement) {
    const parent = current.parentElement;
    if (parent.querySelector('[data-participant-id]')) {
      tile = current;
      break;
    }
    const otherButtons = parent.querySelectorAll('[aria-label^="More options for"]');
    const hasOtherParticipants = Array.from(otherButtons).some(
      btn => btn.getAttribute('aria-label') !== `More options for ${userName}`
    );
    if (hasOtherParticipants) {
      tile = current;
      break;
    }
    current = parent;
  }
  if (!tile) {
    return null;
  }
  // Walk up past sizing/positioning wrappers that visually contain the tile.
  // Stop at any ancestor that has explicit width/height or inset positioning,
  // since those are the visual containers we want to include when hiding.
  while (tile.parentElement) {
    const parentStyle = tile.parentElement.style;
    const hasLayout = parentStyle && (parentStyle.width || parentStyle.height || parentStyle.inset);
    if (!hasLayout) {
      break;
    }
    // Don't walk into a container that holds other participants
    if (tile.parentElement.querySelector('[data-participant-id]')) {
      break;
    }
    tile = tile.parentElement;
  }
  return tile;
}

// Hides the self-view tile by setting display:none on the identified tile element.
function hideSelfView(doc) {
  const userName = extractUserName(doc);
  if (!userName) {
    console.log('Could not extract user name from page data.');
    return;
  }
  const tile = findSelfViewTile(doc, userName);
  if (!tile) {
    console.log('Self-view tile not found.');
    return;
  }
  tile.style.display = 'none';
  console.log('Self-view hidden for: ' + userName);
}

// Creates a debounced version of the hide function to avoid excessive DOM operations.
function createDebouncedHider(hideFn, delay) {
  let timeoutId = null;
  return function() {
    if (timeoutId) { clearTimeout(timeoutId); }
    timeoutId = setTimeout(hideFn, delay || 500);
  };
}

// Browser extension entry point
if (typeof window !== 'undefined' && typeof module === 'undefined') {
  var cachedUserName = null;

  function hideWithCachedName() {
    if (!cachedUserName) {
      cachedUserName = extractUserName(document);
    }
    if (!cachedUserName) {
      return;
    }
    var tile = findSelfViewTile(document, cachedUserName);
    if (tile) {
      tile.style.display = 'none';
    }
  }

  var debouncedHide = createDebouncedHider(hideWithCachedName, 500);

  var observer = new MutationObserver(debouncedHide);

  function start() {
    hideSelfView(document);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) {
    start();
  } else {
    document.addEventListener('DOMContentLoaded', start);
  }

  window.addEventListener('beforeunload', function() {
    observer.disconnect();
    cachedUserName = null;
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractUserName, findSelfViewTile, hideSelfView, createDebouncedHider };
}
