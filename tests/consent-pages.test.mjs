import assert from 'node:assert/strict';
import test from 'node:test';
import { auditConsentPage } from '../scripts/audit-consent-pages.mjs';

const base = `<!doctype html><html><head>
<title>Study enrollment</title>
<meta name="description" content="Voluntary, consent-aware enrollment">
<link rel="canonical" href="https://messaging-intel.github.io/join">
<meta name="referrer" content="no-referrer">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; connect-src 'none'; script-src 'none'; form-action 'none'">
</head><body><a href="#main">Skip to content</a><main id="main"><h1>Join</h1></main></body></html>`;

test('the canonical privacy-preserving static page passes', () => {
  assert.deepEqual(auditConsentPage(base, 'join'), []);
});

const rejected = [
  ['canonical mismatch', base.replace('/join">', '/poll">'), 'canonical URL'],
  ['missing no-referrer policy', base.replace('no-referrer', 'origin'), 'no-referrer'],
  ['network enabled in CSP', base.replace("connect-src 'none'", "connect-src https:"), "connect-src 'none'"],
  ['scripts enabled in CSP', base.replace("script-src 'none'", "script-src 'self'"), "script-src 'none'"],
  ['interactive form', base.replace('<h1>Join</h1>', '<form></form>'), 'active markup'],
  ['inline event handler', base.replace('<h1>Join</h1>', '<h1 onclick="alert(1)">Join</h1>'), 'inline event'],
  ['missing landmark', base.replace('id="main"', 'id="start"'), 'main landmark'],
  ['duplicate fragment target', base.replace('</main>', '<span id="main"></span></main>'), 'duplicate fragment'],
  ['broken skip link', base.replace('href="#main"', 'href="#not-present"'), 'unresolved fragment'],
  ['missing description', base.replace('name="description"', 'name="removed"'), 'missing description'],
];

for (const [name, candidate, expected] of rejected) {
  test(`consent-page audit rejects ${name}`, () => {
    assert(
      auditConsentPage(candidate, 'join').some((error) => error.includes(expected)),
      `expected rejection for ${name}`,
    );
  });
}
