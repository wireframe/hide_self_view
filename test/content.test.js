import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { resolve } from 'path';
import { extractUserName } from '../content.js';

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
