import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { resolve } from 'path';
import { extractUserName, findSelfViewTile } from '../content.js';

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
