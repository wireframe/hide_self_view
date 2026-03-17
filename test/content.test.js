import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { resolve } from 'path';
import { extractUserName, findSelfViewTile, hideSelfView, createDebouncedHider, walkUpParents, containsOtherParticipants } from '../content.js';

const FIXTURES_DIR = resolve(__dirname, 'fixtures');

function loadFixture(filename) {
  const html = readFileSync(resolve(FIXTURES_DIR, filename), 'utf-8');
  const dom = new JSDOM(html);
  return dom.window.document;
}

function isAncestorHidden(element) {
  let el = element;
  while (el) {
    if (el.style && el.style.display === 'none') return true;
    el = el.parentElement;
  }
  return false;
}

function allOtherParticipantsVisible(doc) {
  const buttons = doc.querySelectorAll('[aria-label^="More options for"]');
  for (const btn of buttons) {
    if (btn.getAttribute('aria-label') === 'More options for Test User') continue;
    if (isAncestorHidden(btn)) return false;
  }
  return true;
}

// ── Separate-section layout (original fixture) ─────────────────────
// Self-view is in a distinct DOM section from participants who have
// data-participant-id. This was the original supported layout.

describe('separate-section layout (google-meet-call)', () => {
  function loadDoc() { return loadFixture('google-meet-call.html'); }

  it('contains expected participant buttons', () => {
    const doc = loadDoc();
    const buttons = doc.querySelectorAll('[aria-label^="More options for"]');
    expect(buttons.length).toBe(3);
  });

  it('extracts user name from ds:10 script', () => {
    expect(extractUserName(loadDoc())).toBe('Test User');
  });

  it('findSelfViewTile returns the self-view tile', () => {
    const doc = loadDoc();
    const tile = findSelfViewTile(doc, 'Test User');
    expect(tile).not.toBeNull();
    expect(tile.querySelector('[aria-label="More options for Test User"]')).not.toBeNull();
  });

  it('findSelfViewTile tile does not contain other participants', () => {
    const doc = loadDoc();
    const tile = findSelfViewTile(doc, 'Test User');
    expect(tile.querySelector('[aria-label="More options for Alice Smith"]')).toBeNull();
  });

  it('hideSelfView hides self-view', () => {
    const doc = loadDoc();
    hideSelfView(doc);
    expect(isAncestorHidden(doc.querySelector('[aria-label="More options for Test User"]'))).toBe(true);
  });

  it('hideSelfView does not hide other participants', () => {
    const doc = loadDoc();
    hideSelfView(doc);
    expect(allOtherParticipantsVisible(doc)).toBe(true);
  });

  it('walkUpParents(tile, 2) hides self-view without hiding others', () => {
    const doc = loadDoc();
    const tile = findSelfViewTile(doc, 'Test User');
    walkUpParents(tile, 2).style.display = 'none';

    expect(isAncestorHidden(doc.querySelector('[aria-label="More options for Test User"]'))).toBe(true);
    expect(allOtherParticipantsVisible(doc)).toBe(true);
  });
});

// ── Large meeting layout ────────────────────────────────────────────
// All 9 participants (including self-view) are sibling dkjMxf tiles
// inside the same <main> grid. Self-view has data-participant-id.
// This is the layout that triggered the original bug: walkUpParents(tile, 2)
// reached <main> and hid every video tile.

describe('large meeting layout (google-meet-large-call)', () => {
  function loadDoc() { return loadFixture('google-meet-large-call.html'); }

  it('contains 9 participant buttons', () => {
    const doc = loadDoc();
    const buttons = doc.querySelectorAll('[aria-label^="More options for"]');
    expect(buttons.length).toBe(9);
  });

  it('extracts user name from ds:10 script', () => {
    expect(extractUserName(loadDoc())).toBe('Test User');
  });

  it('findSelfViewTile returns the self-view tile', () => {
    const doc = loadDoc();
    const tile = findSelfViewTile(doc, 'Test User');
    expect(tile).not.toBeNull();
    expect(tile.querySelector('[aria-label="More options for Test User"]')).not.toBeNull();
  });

  it('findSelfViewTile tile does not contain other participants', () => {
    const doc = loadDoc();
    const tile = findSelfViewTile(doc, 'Test User');
    expect(tile.querySelector('[aria-label="More options for Alice Smith"]')).toBeNull();
  });

  it('hideSelfView hides self-view', () => {
    const doc = loadDoc();
    hideSelfView(doc);
    expect(isAncestorHidden(doc.querySelector('[aria-label="More options for Test User"]'))).toBe(true);
  });

  it('hideSelfView does not hide other participants', () => {
    const doc = loadDoc();
    hideSelfView(doc);
    expect(allOtherParticipantsVisible(doc)).toBe(true);
  });

  it('walkUpParents(tile, 2) hides self-view without hiding others', () => {
    const doc = loadDoc();
    const tile = findSelfViewTile(doc, 'Test User');
    walkUpParents(tile, 2).style.display = 'none';

    expect(isAncestorHidden(doc.querySelector('[aria-label="More options for Test User"]'))).toBe(true);
    expect(allOtherParticipantsVisible(doc)).toBe(true);
  });

  it('walkUpParents stops at dkjMxf, not <main>', () => {
    const doc = loadDoc();
    const tile = findSelfViewTile(doc, 'Test User');
    const target = walkUpParents(tile, 2);
    const mainEl = doc.querySelector('main.axUSnc');
    expect(target).not.toBe(mainEl);
  });
});

// ── Solo call layout ────────────────────────────────────────────────
// Only the self-view is present; no other participants. walkUpParents
// should be free to walk up because there's nothing else to collide with.

describe('solo call layout (google-meet-solo)', () => {
  function loadDoc() { return loadFixture('google-meet-solo.html'); }

  it('contains only self-view button', () => {
    const doc = loadDoc();
    const buttons = doc.querySelectorAll('[aria-label^="More options for"]');
    expect(buttons.length).toBe(1);
    expect(buttons[0].getAttribute('aria-label')).toBe('More options for Test User');
  });

  it('extracts user name from ds:10 script', () => {
    expect(extractUserName(loadDoc())).toBe('Test User');
  });

  it('findSelfViewTile returns the self-view tile', () => {
    const doc = loadDoc();
    const tile = findSelfViewTile(doc, 'Test User');
    expect(tile).not.toBeNull();
  });

  it('hideSelfView hides self-view', () => {
    const doc = loadDoc();
    hideSelfView(doc);
    expect(isAncestorHidden(doc.querySelector('[aria-label="More options for Test User"]'))).toBe(true);
  });

  it('walkUpParents(tile, 2) hides self-view without error', () => {
    const doc = loadDoc();
    const tile = findSelfViewTile(doc, 'Test User');
    walkUpParents(tile, 2).style.display = 'none';
    expect(isAncestorHidden(doc.querySelector('[aria-label="More options for Test User"]'))).toBe(true);
  });
});

// ── containsOtherParticipants unit tests ────────────────────────────

describe('containsOtherParticipants', () => {
  it('returns false when parent only contains selfBranch participants', () => {
    const dom = new JSDOM(`<div id="parent">
      <div id="self"><button aria-label="More options for Me"></button><div data-participant-id="me"></div></div>
    </div>`);
    const doc = dom.window.document;
    const parent = doc.getElementById('parent');
    const selfBranch = doc.getElementById('self');
    expect(containsOtherParticipants(parent, selfBranch)).toBe(false);
  });

  it('returns true when parent contains participant tiles outside selfBranch', () => {
    const dom = new JSDOM(`<div id="parent">
      <div id="self"><div data-participant-id="me"></div></div>
      <div id="other"><div data-participant-id="them"></div></div>
    </div>`);
    const doc = dom.window.document;
    const parent = doc.getElementById('parent');
    const selfBranch = doc.getElementById('self');
    expect(containsOtherParticipants(parent, selfBranch)).toBe(true);
  });

  it('returns true when parent contains other "More options for" buttons outside selfBranch', () => {
    const dom = new JSDOM(`<div id="parent">
      <div id="self"><button aria-label="More options for Me"></button></div>
      <div><button aria-label="More options for Someone Else"></button></div>
    </div>`);
    const doc = dom.window.document;
    const parent = doc.getElementById('parent');
    const selfBranch = doc.getElementById('self');
    expect(containsOtherParticipants(parent, selfBranch)).toBe(true);
  });

  it('returns false when parent has no participant markers at all', () => {
    const dom = new JSDOM(`<div id="parent"><div id="self"><span>hello</span></div></div>`);
    const doc = dom.window.document;
    const parent = doc.getElementById('parent');
    const selfBranch = doc.getElementById('self');
    expect(containsOtherParticipants(parent, selfBranch)).toBe(false);
  });
});

// ── Edge cases ──────────────────────────────────────────────────────

describe('edge cases', () => {
  it('extractUserName returns null when ds:10 data is missing', () => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    expect(extractUserName(dom.window.document)).toBeNull();
  });

  it('findSelfViewTile returns null when self-view button is absent', () => {
    const dom = new JSDOM('<!DOCTYPE html><html><body><button aria-label="More options for Someone Else"></button></body></html>');
    expect(findSelfViewTile(dom.window.document, 'Nonexistent User')).toBeNull();
  });

  it('hideSelfView does nothing when user name cannot be extracted', () => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    expect(() => hideSelfView(dom.window.document)).not.toThrow();
  });

  it('hideSelfView is idempotent', () => {
    const doc = loadFixture('google-meet-call.html');
    hideSelfView(doc);
    hideSelfView(doc);
    hideSelfView(doc);
    expect(isAncestorHidden(doc.querySelector('[aria-label="More options for Test User"]'))).toBe(true);
  });

  it('hideSelfView re-hides after tile style is cleared', () => {
    const doc = loadFixture('google-meet-call.html');
    hideSelfView(doc);

    const tile = findSelfViewTile(doc, 'Test User');
    tile.style.display = '';
    expect(isAncestorHidden(doc.querySelector('[aria-label="More options for Test User"]'))).toBe(false);

    hideSelfView(doc);
    expect(isAncestorHidden(doc.querySelector('[aria-label="More options for Test User"]'))).toBe(true);
  });

  it('createDebouncedHider returns a function', () => {
    expect(typeof createDebouncedHider(() => {})).toBe('function');
  });
});
