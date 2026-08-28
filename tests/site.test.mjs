import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync('src/pages/index.astro', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const ci = readFileSync('.github/workflows/ci.yml', 'utf8');
const deploy = readFileSync('.github/workflows/deploy.yml', 'utf8');

const join = readFileSync('src/pages/join.astro', 'utf8');
const poll = readFileSync('src/pages/poll.astro', 'utf8');

test('Astro source owns a complete, discoverable document', () => {
  assert.match(source, /<!doctype html>/i);
  assert.match(source, /<title>/);
  assert.match(source, /<meta name="description"/);
  assert.match(source, /<link rel="canonical"/);
  assert.match(source, /<link rel="icon" href="\/favicon\.svg"/);
  assert.doesNotMatch(source, /index\.html\?raw|set:html/);
  assert.equal(existsSync('public/favicon.svg'), true);
  assert.equal(existsSync('public/robots.txt'), true);
});

test('landing page contains product-specific sections and boundary copy', () => {
  assert.match(source, /id="review"/);
  assert.match(source, /id="boundaries"/);
  assert.match(source, /id="research"/);
  assert.match(source, /Live send defaults closed/i);
  assert.match(source, /href="\/join"/);
  assert.match(join, /H0 \(null\)/);
  assert.match(join, /not<\/em> statistically significant clustering/);
  assert.match(source, /href="\/poll"/);
  assert.match(poll, /operator-pasted Tinder or TikTok/);
  assert.match(poll, /never log into those sites/);
  assert.match(join, /Content-Security-Policy/);
  assert.match(poll, /no-referrer/);
});

test('dependencies and builds are reproducible', () => {
  assert.equal(pkg.devDependencies.astro, '7.2.1');
  assert.equal(pkg.devDependencies.typescript, '6.0.3');
  assert.equal(existsSync('package-lock.json'), true);
  assert.equal(pkg.scripts.build, 'astro build && node scripts/verify-built-site.mjs');
  assert.equal(existsSync('scripts/verify-built-site.mjs'), true);
  assert.equal(pkg.scripts.check, 'astro check');
});

test('CI and deploy run tests before checks and builds', () => {
  for (const workflow of [ci, deploy]) {
    assert.match(workflow, /npm ci --ignore-scripts/);
    assert.ok(workflow.indexOf('npm ci') < workflow.indexOf('npm test'));
    assert.ok(workflow.indexOf('npm test') < workflow.indexOf('npm run check'));
    assert.ok(workflow.indexOf('npm run check') < workflow.indexOf('npm run build'));
  }
});

test('third-party actions are pinned to full commit SHAs', () => {
  for (const workflow of [ci, deploy]) {
    const references = [...workflow.matchAll(/uses:\s+([^\s#]+)/g)].map((match) => match[1]);
    assert.ok(references.length > 0);
    for (const reference of references) assert.match(reference, /@[0-9a-f]{40}$/);
  }
});
