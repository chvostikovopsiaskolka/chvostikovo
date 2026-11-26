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

test('display greeting literal alone is visual; JS/import/form changes cannot use the exception',()=>{
 const copyBefore='function Chat(){\n  const introText = "Haf! Old greeting";\n  submitForm();\n}';
 const copyAfter=copyBefore.replace('Haf! Old greeting','Ahoj, volám sa Aria. Haf! 🐾');
 const file='src/components/site/AriaGuidedChat.tsx';
 assert.equal(selectScope([file],{copyBefore,copyAfter}),'aria-visual');
 assert.equal(formChecksRequired([file],{copyBefore,copyAfter}),false);
 for(const bad of [copyAfter.replace('submitForm()','otherHandler()'),copyAfter+'\nimport "other";',copyAfter.replace('"Ahoj, volám sa Aria. Haf! 🐾"','sendForm()')]){
   assert.equal(selectScope([file],{copyBefore,copyAfter:bad}),'aria');
   assert.equal(formChecksRequired([file],{copyBefore,copyAfter:bad}),true);
 }
});

test('navigation scope permits only bounded HOME/LEAD selectors and exact navigation wiring',()=>{
 const {navigationCssOnly,homeDockOnly,ariaReturnOnly}=require('./public-web-impact.cjs');
 const prefix='.global{color:red;}\n';
 const scoped=prefix+"/* HOME navigation and paid LEAD return control — scoped overrides. */"+'\n.mobile-dock[data-home-dock] .mobile-dock-item{background:pink;}\n.lead-brand-live [data-aria-back-top]{display:none;}';
 assert.equal(navigationCssOnly(prefix,scoped),true);
 assert.equal(selectScope(['src/styles.css'],{before:prefix,after:scoped}),'navigation');
 for(const bad of [scoped+'\nbody{display:none;}',scoped+'\n.mobile-dock[data-home-dock] + form{display:none;}',scoped.replace('color:red','color:blue')])
  assert.equal(selectScope(['src/styles.css'],{before:prefix,after:bad}),'full');
 const dockBefore="              {homeMenuEntries.map(({href,label,icon:Icon}) => <a key={href} href={href} onClick={event => go(event, href)}><Icon size={17} strokeWidth={1.9} aria-hidden=\"true\" /><span>{label}</span></a>)}\n";
 const dockAfter="    ...(desktopHome ? [{label:english ? \"Why choose us?\" : \"Prečo si vybrať nás?\", icon:Heart, href:homePath+(english ? \"#en-benefits\" : \"#preco-chvostikovo\"), desktopOnly:true}] : []),\n              {homeMenuEntries.map(({href,label,icon:Icon,...entry}) => <a key={href} href={href} data-desktop-only-shortcut={\"desktopOnly\" in entry ? true : undefined} onClick={event => go(event, href)}><Icon size={17} strokeWidth={1.9} aria-hidden=\"true\" /><span>{label}</span></a>)}\n";
 assert.equal(homeDockOnly(dockBefore,dockAfter),true);
 assert.equal(selectScope(['src/components/site/MobileDock.tsx'],{dockBefore,dockAfter}),'navigation');
 assert.equal(selectScope(['src/components/site/MobileDock.tsx'],{dockBefore,dockAfter:dockAfter+'submitForm();'}),'full');
 const ariaBefore='unchanged assistant';
 const ariaAfter="import { AriaReturnToTop } from \"./AriaReturnToTop\";\n          {leadChat && <AriaReturnToTop enabled={!hidden && !chatOpen && !panel} />}\n"+ariaBefore;
 assert.equal(ariaReturnOnly(ariaBefore,ariaAfter),true);
 assert.equal(selectScope(['src/components/site/AriaLeadAssistant.tsx','src/components/site/AriaReturnToTop.tsx'],{ariaBefore,ariaAfter}),'navigation');
 assert.equal(selectScope(['src/components/site/AriaReturnToTop.tsx']),'full');
 assert.equal(selectScope(['src/styles.css','src/lib/tracking.ts'],{before:prefix,after:scoped}),'full');
});

test('facilities shortcut selects navigation only for the exact isolated desktop link',()=>{
 const before='existing home menu\n';
 const entry="    ...(desktopHome ? [{label:english ? \"Facilities\" : \"Priestory škôlky\", icon:House, href:homePath+(english ? \"#spaces\" : \"#priestory\"), desktopOnly:true}] : []),\n";
 const after=before+entry;
 const file='src/components/site/MobileDock.tsx';
 assert.equal(selectScope([file],{dockBefore:before,dockAfter:after}),'navigation');
 for(const bad of [after+'submitForm();',after.replace('#spaces','#contact'),after.replace('desktopOnly:true','desktopOnly:false')])assert.equal(selectScope([file],{dockBefore:before,dockAfter:bad}),'full');
});

test('responsive About and Facilities swap cannot hide unrelated source changes',()=>{
 const edits=[["       { id: \"requirements\", label: \"Rules\", icon: Heart }]\n","       { id: \"requirements\", label: \"Rules\", icon: Heart },\n       { id: \"spaces\", label: \"Facilities\", icon: House }]\n"],["       { id: \"podmienky\", label: \"Podmienky\", icon: Heart },\n       { id: \"produkty\",","       { id: \"podmienky\", label: \"Podmienky\", icon: Heart },\n       { id: \"priestory\", label: \"Priestory\", icon: House },\n       { id: \"produkty\","],["  const homeMenuEntries = [\n","  const homeMenuEntries = [\n    {label:english ? \"About\" : \"O nás\", icon:Users, href:homePath+(english ? \"#about\" : \"#o-nas\"), mobileOnly:true},\n"],["data-desktop-only-shortcut={\"desktopOnly\" in entry ? true : undefined} onClick={event => go(event, href)}","data-desktop-only-shortcut={\"desktopOnly\" in entry ? true : undefined} data-mobile-only-shortcut={\"mobileOnly\" in entry ? true : undefined} aria-current={(\"mobileOnly\" in entry || \"desktopOnly\" in entry) && href.endsWith(\"#\" + activeSection) ? \"location\" : undefined} onClick={event => go(event, href)}"],["              key={id}\n              aria-current={activeSection === id ? \"location\" : undefined}","              key={id}\n              data-desktop-only-home-item={homeDock && (id === \"about\" || id === \"o-nas\") || undefined}\n              data-mobile-only-home-item={homeDock && (id === \"spaces\" || id === \"priestory\") || undefined}\n              aria-current={activeSection === id ? \"location\" : undefined}"]];
 const before=edits.map(e=>e[0]).join('\n');
 const after=edits.reduce((s,[a,b])=>s.replace(a,b),before);
 const file='src/components/site/MobileDock.tsx';
 assert.equal(selectScope([file],{dockBefore:before,dockAfter:after}),'navigation');
 assert.equal(selectScope([file],{dockBefore:before,dockAfter:after+'submitForm();'}),'full');
});

test('content scope proves map/copy and the bounded paid section permutation',()=>{
 const {contentFileOnly,orderProof}=require('./public-content-impact.cjs');
 const site='export const MAP_LINK = "https://maps.app.goo.gl/abc";\nexport const INQUIRY_TITLE = "Old";\nexport const INQUIRY_SUBTITLE = "Description";\nexport const VISIT_INQUIRY_TITLE = "Visit";\n    title: "Zdravotný stav",\n    text: "Health",\nexport const PRICE = 25;';
 const updated=site.replace('"Old"','"New"').replace('/abc"','/xyz"');
 const src='prefix {isLiveLead ? <>\n'+['leadPhotoGallery','pricingSection','firstVisitSection','heroFormSection','caretakersSection','benefitsSection','conditionsSection','puppyChecker','mosaic','friendshipSection','campaignFaqSection'].map(x=>'          '+(x==='mosaic'?'<AriaMosaicGallery paidLead />':'{'+x+'}')).join('\n')+'\n        </> : <> suffix';
 const reordered=src.replace('          {caretakersSection}\n          {benefitsSection}','          {benefitsSection}\n          {caretakersSection}');
 const en='prefix title:"Health",text:"Healthy" suffix';
 const files=['src/content/site.ts','src/routes/test-aria.tsx','src/components/site/Info.tsx'];
 const impact={content:{[files[0]]:{before:site,after:updated},[files[1]]:{before:src,after:reordered},[files[2]]:{before:en,after:en.replace('Healthy','Safe')}}};
 assert.equal(selectScope(files,impact),'content');assert.equal(formChecksRequired(files,impact),false);
 for(const file of files)assert.equal(contentFileOnly(file,impact.content[file].before,impact.content[file].after),true);
 for(const extra of ['src/components/site/Forms.tsx','src/components/site/LeadStepForm.tsx','src/lib/analytics.ts','src/styles.css','package.json','supabase/functions/submit/index.ts','scripts/critical-form-checks.ts','.github/workflows/check-form-funnel.yml']){assert.equal(selectScope([...files,extra],impact),'full');assert.equal(formChecksRequired([...files,extra],impact),true);}
 for(const bad of [updated.replace('PRICE = 25','PRICE = 30'),updated.replace('https://maps.app.goo.gl/xyz','https://example.com'),updated.replace('"New"','submitForm()'),updated.replace('"Health"','"<script>"'),updated+'\nsubmitForm();'])assert.equal(contentFileOnly(files[0],site,bad),false);
 for(const bad of [reordered.replace('{benefitsSection}','{unknownSection}'),reordered.replace('{friendshipSection}','{mosaic}'),reordered+'\nsubmitForm();',reordered.replace('{puppyChecker}','{conditionsSection}')])assert.equal(contentFileOnly(files[1],src,bad),false);
 assert.equal(contentFileOnly(files[2],en,en.replace('Healthy','Safe')+'submitForm()'),false);
 assert.equal(selectScope(files),'full');assert.equal(formChecksRequired(files),true);
 assert.equal(selectScope(['scripts/public-content-impact.cjs','scripts/check-web-runtime.cjs']),'content');
 assert.equal(orderProof(src).order.at(-1),'lead-faq');
});


test('navigation scope preserves the entire later public CTA section byte-for-byte',()=>{
 const marker='/* HOME navigation and paid LEAD return control — scoped overrides. */';
 const suffix='/* Public CTA signature, owner direction 26 Nov 2026. */\nmain .btn-coral { color: red; }';
 const old='body { margin: 0; }\n'+marker+'\n.mobile-dock[data-desktop-home-dock] .mobile-dock-compact-links { gap: 2px; }\n'+suffix;
 const next=old.replace('gap: 2px','gap: 4px');
 assert.equal(selectScope(['src/styles.css'],{before:old,after:next}),'navigation');
 for(const bad of [next.replace('color: red','color: blue'),next.replace('margin: 0','margin: 1px'),next+'\nbody { color: red; }',next.replace('.mobile-dock[data-desktop-home-dock] .mobile-dock-compact-links','main .btn-coral')]) assert.equal(selectScope(['src/styles.css'],{before:old,after:bad}),'full');
});
