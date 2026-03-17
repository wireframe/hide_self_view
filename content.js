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
  return tile || null;
}

// Walks up parent levels from a starting element, stopping early if the next
// parent contains other participant tiles (data-participant-id or other
// "More options for" buttons beyond the self-view's own).
function walkUpParents(element, levels) {
  var current = element;
  for (var i = 0; i < levels && current.parentElement; i++) {
    var parent = current.parentElement;
    if (containsOtherParticipants(parent, current)) {
      break;
    }
    current = parent;
  }
  return current;
}

// Checks whether a parent element contains other participants' content
// (data-participant-id tiles or "More options for" buttons) that are NOT
// descendants of selfBranch. Used by walkUpParents to avoid hiding containers
// that hold other participants' video tiles.
function containsOtherParticipants(parent, selfBranch) {
  var participantTiles = parent.querySelectorAll('[data-participant-id]');
  for (var j = 0; j < participantTiles.length; j++) {
    if (!selfBranch.contains(participantTiles[j])) {
      return true;
    }
  }
  var buttons = parent.querySelectorAll('[aria-label^="More options for"]');
  for (var k = 0; k < buttons.length; k++) {
    if (!selfBranch.contains(buttons[k])) {
      return true;
    }
  }
  return false;
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
      walkUpParents(tile, 2).style.display = 'none';
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
  module.exports = { extractUserName, findSelfViewTile, hideSelfView, createDebouncedHider, walkUpParents, containsOtherParticipants };
}
