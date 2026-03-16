import { describe, it, expect } from 'vitest';
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
