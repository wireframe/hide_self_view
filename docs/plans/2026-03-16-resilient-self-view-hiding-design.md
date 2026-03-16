# Resilient Self-View Hiding Design

## Problem

The current implementation relies on counting generic `aria-label="More options"` buttons and using a positional offset to find the self-view's menu button. Google Meet changed these labels to personalized ones (`"More options for Ryan Sonnek"`), breaking the offset logic entirely. The extension no longer hides the self-view.

Beyond this specific breakage, the click-simulation approach (open menu -> click Minimize) is inherently fragile due to timing dependencies, animation waits, and multi-step DOM interaction.

## Approach: DOM Hiding via Parent Walk

Replace the menu-click approach with direct DOM hiding. Find the self-view tile and set `display: none` on it.

### Algorithm

1. **Extract the user's display name** from `AF_initDataCallback({key: 'ds:10', ...})` script data embedded in the page. This contains the logged-in user's name and email.

2. **Find the self-view button** using:
   ```js
   document.querySelector(`[aria-label="More options for ${userName}"]`)
   ```

3. **Walk up `parentElement`** from the button until we find the tile container. The tile container is identified structurally: it's the ancestor whose parent also contains other participant tiles (other `[aria-label^="More options for"]` buttons). The element just before that boundary is the self-view tile.

4. **Hide the tile** with `element.style.display = 'none'`.

5. **Re-run on DOM changes** via `MutationObserver` (debounced) to handle participants joining/leaving or layout changes that rebuild the DOM.

### Why This Is Resilient

- **No obfuscated class names.** The current code would need `qRU4mf`, `T7uFbc`, etc. which Google can change at any time.
- **No positional offset counting.** The old approach assumed the self-view button was at `elements.length - 2`, which broke when Google changed their button structure.
- **No click simulation.** No menu opening, no animation timing, no multi-step sequences.
- **Aria-labels are stable.** Accessibility attributes are a public contract and change far less frequently than internal class names.
- **Structural detection.** The parent walk uses DOM relationships (parent contains other participant buttons) rather than any specific attribute values.

### Edge Cases

- **Name not found in page data:** Fall back to checking if there's a tile with the "Reframe" button or "Others might see more of your background" label, which are unique to the self-view.
- **Self-view re-appears after DOM rebuild:** MutationObserver re-runs the hiding logic.
- **User navigates between meetings:** `beforeunload` resets state so hiding runs fresh on the next meeting.

## Testing Strategy

Tests use a scrubbed HTML fixture (`test/fixtures/google-meet-call.html`) captured from a real Google Meet call with all names and PII replaced. The fixture contains:

- 2 other-participant tiles (wrapped in `T7uFbc` containers)
- 1 self-view tile (in a separate DOM section)
- `AF_initDataCallback` with `ds:10` key containing the test user's name and email
- Real Google Meet DOM nesting and class structure

### Test Cases

1. **`extractUserName()` parses name from page data** — Loads fixture, verifies function returns `"Test User"` from the embedded `AF_initDataCallback` script data.

2. **`extractUserName()` returns null when data is missing** — Tests with an empty DOM to verify graceful failure.

3. **`findSelfViewTile()` identifies the correct tile** — Given the user's name, verifies the function returns the self-view tile container (the one containing `"More options for Test User"`) and not a different participant's tile.

4. **`findSelfViewTile()` returns null when self-view is absent** — Tests with a DOM that has other participants but no self-view tile.

5. **`hideSelfViewTile()` hides the self-view tile** — Verifies the self-view tile gets `display: none` applied.

6. **`hideSelfViewTile()` does not hide other participant tiles** — After hiding, verifies other participant tiles remain visible.

7. **Hiding re-applies after DOM rebuild** — Simulates a DOM mutation (participant join/leave), verifies the MutationObserver re-triggers hiding on the new self-view tile.

8. **Hiding is idempotent** — Running `hideSelfView()` multiple times does not cause errors or DOM corruption.

### Test Setup

- Use a test runner that supports DOM manipulation (jsdom or similar).
- Load `test/fixtures/google-meet-call.html` as the document for each test.
- Import functions from `content.js` for unit-level testing.

## Changes Required

- Rewrite `content.js` to replace the click-simulation approach with the DOM-hiding approach.
- Remove `clickMoreOptionsButton()`, `clickMinimizeButton()`, and `dismissDialog()`.
- Add `extractUserName()` to parse the user's name from page data.
- Add `findSelfViewTile()` implementing the parent walk algorithm.
- Add `hideSelfViewTile()` to apply `display: none`.
- Keep `MutationObserver` with debouncing to avoid excessive re-runs.
- Add `test/` directory with test fixture and test file.
- Add `package.json` with test dependencies (test runner, jsdom).
