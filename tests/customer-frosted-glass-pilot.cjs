'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const css = fs.readFileSync('customer-design.css', 'utf8');
const marker = '/* White Frosted Liquid Glass pilot (review branch only).';
assert.equal(css.split(marker).length, 2, 'one isolated glass pilot appended after the existing CSS');
const pilot = css.split(marker)[1];
assert.match(pilot, /@supports\s*\(\(-webkit-backdrop-filter:blur\(1px\)\) or \(backdrop-filter:blur\(1px\)\)\)/);
assert.match(pilot, /--customer-glass-optics:blur\(18px\) saturate\(150%\)/);
assert.match(pilot, /--customer-glass-fill:rgba\(255,255,255,\.56\)/);
assert.match(pilot, /data-customer-glass-pilot="soft"/);
assert.match(pilot, /data-customer-glass-pilot="rich"/);
for (const selector of [
  '#bookingDogProfile:not(.dual-dog-v241) .dog-overview-content::before',
  '#bookingDogProfile .dual-dog-info-v254',
  '#designTicket.design-ticket',
  '#designNearest.design-nearest',
  '#customerInboxV363>button'
]) assert(pilot.includes(selector), 'pilot includes '+selector);
assert.match(pilot, /-webkit-backdrop-filter:var\(--customer-glass-optics\)!important/);
assert.match(pilot, /backdrop-filter:var\(--customer-glass-optics\)!important/);
assert.match(pilot, /\.bottom-nav::before\s*\{[^}]*pointer-events:none;[^}]*backdrop-filter:var\(--customer-glass-optics\)/s);
assert.match(pilot, /\.bottom-nav > :is\(button,a\)\s*\{[^}]*z-index:1/s);
const stableNav = css.split('/* v370: one document scroller')[1].split(marker)[0];
assert.match(stableNav, /\.customer-design \.bottom-nav\s*\{[^}]*transform:none!important;[^}]*backdrop-filter:none!important/s, 'outer viewport-owned nav must not become a filtered containing block');
assert.match(pilot, /@media \(prefers-reduced-transparency:reduce\)/);
const reduced = pilot.split('@media (prefers-reduced-transparency:reduce)')[1];
assert.match(reduced, /backdrop-filter:none!important/);
assert.match(reduced, /\.bottom-nav::before\s*\{\s*display:none!important/);
assert(!pilot.includes('@keyframes') && !pilot.includes('url('), 'no motion/network material');
console.log('PASS White Frosted Liquid Glass pilot selectors, optics, nav isolation and accessibility fallback');
