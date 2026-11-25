const {test}=require('node:test');
const assert=require('node:assert/strict');
const {selectScope,scopedLeadCss,formChecksRequired}=require('./public-web-impact.cjs');
const css=body=>'@theme {--font: test;}\n/* Paid campaign content only: test */\n'+body+'\n/* Keep decoration below the admission heading */\n.shared {display:flex;}';
const before=css('.lead-brand-live [data-lead-hero-grid]{gap:12px;}');
const after=css('@media(min-width:1024px){.lead-brand-live [data-lead-hero-grid]{gap:16px;}} [data-aria-chat-lead]{background:white;}');
test('isolated LEAD CSS and its browser fixture select visual checks, not forms',()=>{
 assert.equal(selectScope(['src/styles.css','scripts/check-web-runtime.cjs'],{before,after}),'aria-visual');
 assert.equal(formChecksRequired(['src/styles.css','scripts/check-web-runtime.cjs']),false);
});
test('global CSS, escaped selectors, unknown rules or missing source fail closed',()=>{
 for(const changed of [after.replace('.shared {display:flex;}','.shared {display:none;}'),css('.lead-brand-live .x, body{display:none;}'),css('@import "global.css";'),css('@font-face{font-family:bad;}'),css('.lead-brand-live-other{color:red;}'),css('.lead-brand-live + body{display:none;}'),css('[data-aria-chat-lead] ~ .outside{display:none;}')]){
  assert.equal(scopedLeadCss(before,changed),false);assert.equal(selectScope(['src/styles.css'],{before,after:changed}),'full');
 }
 assert.equal(selectScope(['src/styles.css']),'full');
});
test('functional chat changes retain browser integration and form guards',()=>{
 assert.equal(selectScope(['src/styles.css','src/components/site/AriaLeadAssistant.tsx'],{before,after}),'aria');
 assert.equal(formChecksRequired(['src/components/site/AriaLeadAssistant.tsx']),true);
});
test('form, consent, attribution, backend, build and unknown changes retain full checks',()=>{
 for(const file of ['src/components/site/LeadStepForm.tsx','src/components/site/CookieBanner.tsx','src/lib/tracking.ts','supabase/functions/web-form-submit/index.ts','vite.config.pages.ts','package.json','unrecognized.ts']){
  assert.equal(selectScope(['src/styles.css',file],{before,after}),'full');assert.equal(formChecksRequired([file]),true);
 }
 assert.equal(selectScope([]),'full');assert.equal(formChecksRequired([]),true);
});
test('CI harness changes exercise the visual branch in both engines without unrelated form mocks',()=>{
 const files=['scripts/public-web-impact.cjs','scripts/public-web-impact.test.cjs','scripts/check-web-runtime.cjs','.github/workflows/check-form-funnel.yml','.github/workflows/public-web-runtime.yml'];
 assert.equal(selectScope(files),'aria-visual');assert.equal(formChecksRequired(files),false);
});
