const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const {JSDOM}=require('./shared-v244/node_modules/jsdom');
const dom=new JSDOM('<nav id="bottomNav" class="nav"><button>Prehľad</button></nav>',{runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window,nav=w.document.getElementById('bottomNav');
const viewport=new w.EventTarget();Object.assign(viewport,{height:800,offsetTop:0,scale:1});Object.defineProperty(w,'visualViewport',{value:viewport});
let drift=-270;w.getComputedStyle=()=>({bottom:'12px'});nav.getBoundingClientRect=()=>{const bottom=viewport.offsetTop+viewport.height-12+drift+(parseFloat(nav.style.getPropertyValue('--admin-nav-shift-v275'))||0);return {bottom,height:70,top:bottom-70}};
new vm.Script(fs.readFileSync('admin/viewport-nav-v275.js','utf8')).runInContext(dom.getInternalVMContext());
const settle=()=>new Promise(r=>setTimeout(r,25));
(async()=>{try{
 await settle();assert.equal(nav.getBoundingClientRect().bottom,788,'correct existing drift after resume');
 // Safari returns from its transient positioning state; correction must unwind.
 drift=0;viewport.dispatchEvent(new w.Event('scroll'));await settle();assert.equal(nav.getBoundingClientRect().bottom,788);
 viewport.height=430;viewport.offsetTop=30;drift=-80;viewport.dispatchEvent(new w.Event('resize'));await settle();assert.equal(nav.getBoundingClientRect().bottom,448);
 viewport.height=800;viewport.offsetTop=0;drift=0;w.document.dispatchEvent(new w.Event('focusout'));await settle();assert.equal(nav.getBoundingClientRect().bottom,788);
 const shift=nav.style.cssText;viewport.scale=2;drift=-100;viewport.dispatchEvent(new w.Event('scroll'));await settle();assert.equal(nav.style.cssText,shift,'pinch zoom left alone');
 assert(!fs.readFileSync('admin/viewport-nav-v275.js','utf8').includes('scrollTo('));
 assert(fs.readFileSync('admin/viewport-nav-v275.css','utf8').includes('min-height:100svh'));
 console.log('PASS measured nav correction: drift, viewport restore, resize/offset, focusout, pinch; no page scroll or image remount. Physical iOS geometry remains unverified.');
 }finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
