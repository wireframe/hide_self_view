import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { resolve } from 'path';
import { extractUserName, findSelfViewTile, hideSelfView, createDebouncedHider } from '../content.js';

const FIXTURE_PATH = resolve(__dirname, 'fixtures/google-meet-call.html');
const fixtureHtml = readFileSync(FIXTURE_PATH, 'utf-8');

function loadFixture() {
  const dom = new JSDOM(fixtureHtml);
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

describe('fixture loads correctly', () => {
  it('contains expected participant buttons', () => {
    const doc = loadFixture();
    const buttons = doc.querySelectorAll('[aria-label^="More options for"]');
    expect(buttons.length).toBe(3);
  });
});

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

describe('findSelfViewTile', () => {
  it('finds the tile containing the self-view button', () => {
    const doc = loadFixture();
    const userName = extractUserName(doc);
    const tile = findSelfViewTile(doc, userName);
    expect(tile).not.toBeNull();
    const selfButton = tile.querySelector('[aria-label="More options for Test User"]');
    expect(selfButton).not.toBeNull();
  });

  it('does not return a tile containing other participants', () => {
    const doc = loadFixture();
    const userName = extractUserName(doc);
    const tile = findSelfViewTile(doc, userName);
    const aliceButton = tile.querySelector('[aria-label="More options for Alice Smith"]');
    expect(aliceButton).toBeNull();
  });

  it('returns null when self-view button is absent', () => {
    const dom = new JSDOM('<!DOCTYPE html><html><body><button aria-label="More options for Someone Else"></button></body></html>');
    const tile = findSelfViewTile(dom.window.document, 'Nonexistent User');
    expect(tile).toBeNull();
  });
});

describe('hideSelfView', () => {
  it('hides the self-view tile', () => {
    const doc = loadFixture();
    hideSelfView(doc);
    const selfButton = doc.querySelector('[aria-label="More options for Test User"]');
    expect(isAncestorHidden(selfButton)).toBe(true);
  });

  it('does not hide other participant tiles', () => {
    const doc = loadFixture();
    hideSelfView(doc);
    const aliceButton = doc.querySelector('[aria-label="More options for Alice Smith"]');
    expect(isAncestorHidden(aliceButton)).toBe(false);
  });

  it('is idempotent — multiple calls do not cause errors', () => {
    const doc = loadFixture();
    hideSelfView(doc);
    hideSelfView(doc);
    hideSelfView(doc);
    const selfButton = doc.querySelector('[aria-label="More options for Test User"]');
    expect(isAncestorHidden(selfButton)).toBe(true);
  });

  it('re-hides after DOM rebuild', () => {
    const doc = loadFixture();
    hideSelfView(doc);

    const selfButton = doc.querySelector('[aria-label="More options for Test User"]');
    const tile = findSelfViewTile(doc, 'Test User');
    tile.style.display = '';

    expect(isAncestorHidden(selfButton)).toBe(false);

    hideSelfView(doc);
    expect(isAncestorHidden(selfButton)).toBe(true);
  });

  it('does nothing when user name cannot be extracted', () => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    expect(() => hideSelfView(dom.window.document)).not.toThrow();
  });
});

describe('createDebouncedHider', () => {
  it('returns a function', () => {
    const hider = createDebouncedHider(() => {});
    expect(typeof hider).toBe('function');
  });
});
