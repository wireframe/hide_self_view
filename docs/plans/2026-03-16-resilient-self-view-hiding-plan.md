# Resilient Self-View Hiding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite the Google Meet self-view hiding extension to use direct DOM hiding instead of fragile click simulation.

**Architecture:** Extract user name from page-embedded data, find the self-view tile via aria-label matching, walk up the DOM to find the tile container, and hide it with `display: none`. MutationObserver re-applies hiding when the DOM changes.

**Tech Stack:** Vanilla JavaScript (browser extension content script), Vitest + jsdom (testing)

---

### Task 1: Set up test infrastructure

**Files:**
- Create: `package.json`
- Create: `test/content.test.js`

**Step 1: Create package.json with test dependencies**

```json
{
  "private": true,
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^3.1.1",
    "jsdom": "^26.1.0"
  }
}
```

**Step 2: Create test file with fixture loading helper**

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { resolve } from 'path';

const FIXTURE_PATH = resolve(__dirname, 'fixtures/google-meet-call.html');
const fixtureHtml = readFileSync(FIXTURE_PATH, 'utf-8');

function loadFixture() {
  const dom = new JSDOM(fixtureHtml, { runScripts: 'dangerously' });
  return dom.window.document;
}

describe('fixture loads correctly', () => {
  it('contains expected participant buttons', () => {
    const doc = loadFixture();
    const buttons = doc.querySelectorAll('[aria-label^="More options for"]');
    expect(buttons.length).toBe(3);
  });
});
```

**Step 3: Install dependencies and run test**

Run: `npm install && npm test`
Expected: PASS — fixture loads and contains 3 "More options for" buttons

**Step 4: Commit**

```
git add package.json test/content.test.js
git commit -m "Add test infrastructure with vitest and jsdom"
```

---

### Task 2: Implement and test `extractUserName()`

**Files:**
- Modify: `content.js`
- Modify: `test/content.test.js`

**Step 1: Write the failing tests**

Add to `test/content.test.js`:

```js
import { extractUserName } from '../content.js';

describe('extractUserName', () => {
  it('parses user name from AF_initDataCallback script', () => {
    const doc = loadFixture();
    const name = extractUserName(doc);
    expect(name).toBe('Test User');
  });

  it('returns null when ds:10 data is missing', () => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    const name = extractUserName(dom.window.document);
    expect(name).toBeNull();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `extractUserName` is not exported

**Step 3: Implement `extractUserName()` in content.js**

Replace the entire content of `content.js` with:

```js
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

// Module exports for testing (no-op in browser extension context)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractUserName };
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```
git add content.js test/content.test.js
git commit -m "Add extractUserName to parse user name from page data"
```

---

### Task 3: Implement and test `findSelfViewTile()`

**Files:**
- Modify: `content.js`
- Modify: `test/content.test.js`

**Step 1: Write the failing tests**

Add to `test/content.test.js`:

```js
import { extractUserName, findSelfViewTile } from '../content.js';

describe('findSelfViewTile', () => {
  it('finds the tile containing the self-view button', () => {
    const doc = loadFixture();
    const userName = extractUserName(doc);
    const tile = findSelfViewTile(doc, userName);

    expect(tile).not.toBeNull();
    // The tile should contain the self-view button
    const selfButton = tile.querySelector('[aria-label="More options for Test User"]');
    expect(selfButton).not.toBeNull();
  });

  it('does not return a tile containing other participants', () => {
    const doc = loadFixture();
    const userName = extractUserName(doc);
    const tile = findSelfViewTile(doc, userName);

    // The tile should NOT contain other participants' buttons
    const aliceButton = tile.querySelector('[aria-label="More options for Alice Smith"]');
    expect(aliceButton).toBeNull();
  });

  it('returns null when self-view button is absent', () => {
    const dom = new JSDOM('<!DOCTYPE html><html><body><button aria-label="More options for Someone Else"></button></body></html>');
    const tile = findSelfViewTile(dom.window.document, 'Nonexistent User');
    expect(tile).toBeNull();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `findSelfViewTile` is not exported

**Step 3: Implement `findSelfViewTile()` in content.js**

Add before the module.exports block in `content.js`:

```js
// Finds the self-view tile container by walking up from the user's "More options" button.
// The tile container is the deepest ancestor that contains ONLY the self-view's
// "More options for" button and no other participants' buttons.
function findSelfViewTile(doc, userName) {
  const selfButton = doc.querySelector(`[aria-label="More options for ${userName}"]`);
  if (!selfButton) {
    return null;
  }

  let current = selfButton;
  while (current.parentElement) {
    const parent = current.parentElement;
    const allButtons = parent.querySelectorAll('[aria-label^="More options for"]');
    const hasOtherParticipants = Array.from(allButtons).some(
      btn => btn.getAttribute('aria-label') !== `More options for ${userName}`
    );
    if (hasOtherParticipants) {
      return current;
    }
    current = parent;
  }

  // Reached the root without finding other participants — return the deepest
  // non-trivial ancestor (the element just below documentElement)
  return current;
}
```

Update the module.exports:

```js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractUserName, findSelfViewTile };
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```
git add content.js test/content.test.js
git commit -m "Add findSelfViewTile using parent walk algorithm"
```

---

### Task 4: Implement and test `hideSelfView()`

**Files:**
- Modify: `content.js`
- Modify: `test/content.test.js`

**Step 1: Write the failing tests**

Add to `test/content.test.js`:

```js
import { extractUserName, findSelfViewTile, hideSelfView } from '../content.js';

describe('hideSelfView', () => {
  it('hides the self-view tile', () => {
    const doc = loadFixture();
    hideSelfView(doc);

    const selfButton = doc.querySelector('[aria-label="More options for Test User"]');
    // Walk up to find the hidden ancestor
    let el = selfButton;
    let hidden = false;
    while (el) {
      if (el.style && el.style.display === 'none') {
        hidden = true;
        break;
      }
      el = el.parentElement;
    }
    expect(hidden).toBe(true);
  });

  it('does not hide other participant tiles', () => {
    const doc = loadFixture();
    hideSelfView(doc);

    const aliceButton = doc.querySelector('[aria-label="More options for Alice Smith"]');
    let el = aliceButton;
    let hidden = false;
    while (el) {
      if (el.style && el.style.display === 'none') {
        hidden = true;
        break;
      }
      el = el.parentElement;
    }
    expect(hidden).toBe(false);
  });

  it('is idempotent — multiple calls do not cause errors', () => {
    const doc = loadFixture();
    hideSelfView(doc);
    hideSelfView(doc);
    hideSelfView(doc);

    // Should still work — no errors thrown, self-view still hidden
    const selfButton = doc.querySelector('[aria-label="More options for Test User"]');
    let el = selfButton;
    let hidden = false;
    while (el) {
      if (el.style && el.style.display === 'none') {
        hidden = true;
        break;
      }
      el = el.parentElement;
    }
    expect(hidden).toBe(true);
  });

  it('does nothing when user name cannot be extracted', () => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    // Should not throw
    expect(() => hideSelfView(dom.window.document)).not.toThrow();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `hideSelfView` is not exported or not implemented

**Step 3: Implement `hideSelfView()` in content.js**

Add before the module.exports block:

```js
// Finds and hides the self-view tile.
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
```

Update the module.exports:

```js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractUserName, findSelfViewTile, hideSelfView };
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```
git add content.js test/content.test.js
git commit -m "Add hideSelfView to hide the self-view tile"
```

---

### Task 5: Add browser extension wiring (MutationObserver, event listeners)

**Files:**
- Modify: `content.js`

**Step 1: Write a test for the debounce behavior**

Add to `test/content.test.js`:

```js
import { createDebouncedHider } from '../content.js';

describe('createDebouncedHider', () => {
  it('returns a function', () => {
    const hider = createDebouncedHider(() => {});
    expect(typeof hider).toBe('function');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `createDebouncedHider` not exported

**Step 3: Add browser wiring to content.js**

Add after `hideSelfView` and before module.exports:

```js
// Creates a debounced version of hideSelfView to avoid excessive re-runs
// from MutationObserver firing on every DOM change.
function createDebouncedHider(hideFn, delay) {
  let timeoutId = null;
  return function() {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(hideFn, delay || 500);
  };
}

// Browser extension entry point — only runs in actual browser context
if (typeof window !== 'undefined' && typeof module === 'undefined') {
  const debouncedHide = createDebouncedHider(function() {
    hideSelfView(document);
  }, 500);

  window.addEventListener('load', function() {
    hideSelfView(document);
  });

  window.addEventListener('beforeunload', function() {
    observer.disconnect();
  });

  var observer = new MutationObserver(debouncedHide);
  observer.observe(document.body, { childList: true, subtree: true });
}
```

Update the module.exports:

```js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractUserName, findSelfViewTile, hideSelfView, createDebouncedHider };
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```
git add content.js test/content.test.js
git commit -m "Add MutationObserver wiring with debounce"
```

---

### Task 6: Add .gitignore entry and clean up

**Files:**
- Modify: `.gitignore`

**Step 1: Add node_modules to .gitignore**

Check current `.gitignore` and add `node_modules/` if not present.

**Step 2: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 3: Commit**

```
git add .gitignore
git commit -m "Add node_modules to gitignore"
```

---

### Task 7: Final verification

**Step 1: Run the full test suite one final time**

Run: `npm test`
Expected: All tests PASS

**Step 2: Review content.js is complete and clean**

Verify:
- No old click-simulation code remains (`clickMoreOptionsButton`, `clickMinimizeButton`, `dismissDialog` are all removed)
- Functions are clean and focused (extractUserName, findSelfViewTile, hideSelfView, createDebouncedHider)
- Browser wiring only runs in browser context (not during tests)
- Module exports only run in Node.js context (not in browser)
