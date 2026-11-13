'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {JSDOM}=require('./shared-v244/node_modules/jsdom');
const app=fs.readFileSync('app.js','utf8');
const design=fs.readFileSync('customer-design.js','utf8');
const css=fs.readFileSync('customer-design.css','utf8');
const version=JSON.parse(fs.readFileSync('version.json','utf8'));
new vm.Script(app,{filename:'app.js'});
new vm.Script(design,{filename:'customer-design.js'});
assert.match(version.build,/^v[1-9][0-9]*$/,'use the current release build from version.json');
assert.match(version.version,/^[0-9]+\.[0-9]+\.[0-9]+$/,'use the current semantic version from version.json');
assert.match(app,/preloadFirstScreenFriendsV404\(d\)/);
assert.match(app,/Promise\.allSettled\(\[preloadDogVisualV56\(d\),loadAnnouncements\(\)\]\)/,
  'first-screen gate only waits for own-dog images and notices');
assert.doesNotMatch(app,/Promise\.allSettled\(\[preloadDogVisualV56\(d\),preloadFirstScreenFriendsV404\(d\)/,
  'future-day friend photos must not delay the signed-in first screen');
assert.match(app,/state\.data===d&&document\.visibilityState!==['"]hidden['"]/,
  'deferred warmup is bounded to the current visible session');
assert.match(app,/__chvoBootTimingV421=\{totalMs:/,'boot timing remains available without PII');
assert.match(app,/setTimeout\(resolve,2900\)/);
assert.match(app,/setTimeout\(resolve,700\)/);
assert.match(app,/photoCacheV358/);
assert.match(app,/customerPreloadOverviewNoticesV404/);
assert.match(app,/const generation=\+\+articleEpochV358/);
assert(!app.includes('photoReady=await prepared.promise'),'slow photo cannot block notice body');
assert.match(css,/\.design-friend-photo:has\(img\) img\{opacity:0/);
assert.match(design,/openFriendsPreparedV404\(date,event.currentTarget\)/);
assert.match(design,/Načítavam fotografie…/);
assert.match(design,/setTimeout\(resolve,3400\)/);
assert.doesNotMatch(css,/\.customer-notice-thumb-v363 img\{opacity:0/,'thumbnail must not be hidden waiting for decode');
assert.match(css,/\.customer-notice-thumb-v363 img\{display:block;opacity:1\}/);
assert.match(app,/saved\.forEach\(\(row,i\)=>host\.append\(noticeCard\(row,true,i<3\)\)\)/);
const fn=design.slice(design.indexOf('  function photoNode('),design.indexOf('  function reconcilePhotos('));
assert(fn.includes('function photoNode('));
const dom=new JSDOM('<!doctype html><html><body></body></html>');
const cardSource=app.slice(app.indexOf('  function noticeCard('),app.indexOf('  function drawOverview(',app.indexOf('  function noticeCard(')));
const previewSource=app.slice(app.indexOf('  const failedNoticePreviewsV423='),app.indexOf('  function safeLink(',app.indexOf('  const failedNoticePreviewsV423=')));
const photoUrl=path=>path?'https://example.invalid/'+path:'';
const preview=Function('safePhoto',previewSource+'\nreturn {noticePreviewPhotoV423,failedNoticePreviewsV423};')(photoUrl);
const card=Function('el','safePhoto','noticePreviewPhotoV423','failedNoticePreviewsV423','rowsState','openArticle',cardSource+'\nreturn noticeCard;')(
  (tag,cls,text)=>{const node=dom.window.document.createElement(tag);if(cls)node.className=cls;if(text!=null)node.textContent=text;return node;},
  photoUrl,preview.noticePreviewPhotoV423,preview.failedNoticePreviewsV423,{read:new Set()},()=>{}
);
const bulletin={id:1,title:'Synthetic notice',body:'Text',image_path:'img.png'};
const first=card(bulletin,true,true);
assert.equal(first.querySelector('img').loading,'eager','first visible archive image must start promptly');
assert.equal(first.querySelector('img').src,'https://example.invalid/img.png');
assert.equal(first.querySelector('svg'),null,'real photo has no fake paw');
assert.equal(card(bulletin,true,false).querySelector('img').loading,'lazy','later offscreen archive rows remain lazy');
assert.equal(card(bulletin,false).querySelector('img').loading,'eager','overview thumbnail starts promptly');
assert.equal(card({...bulletin,image_path:null},true,true).querySelectorAll('svg').length,1,'no-image record keeps its original icon');
const optimized={...bulletin,image_path:'1/example.with-preview-v423.jpg'};
const fallback=card(optimized,false),image=fallback.querySelector('img');
assert.equal(image.src,'https://example.invalid/1/example.preview-v423.webp');
image.dispatchEvent(new dom.window.Event('error'));
assert.equal(image.src,'https://example.invalid/1/example.with-preview-v423.jpg','unsupported or missing preview falls back to original');
assert.equal(card(optimized,false).querySelector('img').src,image.src,'failed preview is not requested again');
image.dispatchEvent(new dom.window.Event('error'));assert.equal(fallback.querySelector('img'),null,'failed original keeps existing unavailable state');

const legacyPhotoV425='7d062ba9-eb65-4586-9623-9a67f33a2706/81b2588c-1f51-4e16-9d65-16c288c0b054.png';
const legacyCardV425=card({...bulletin,image_path:legacyPhotoV425},true,true);
const legacyImgV425=legacyCardV425.querySelector('img');
assert.equal(legacyImgV425.getAttribute('src'),'/notice-previews/zbierka-v425.webp',
  'legacy public bulletin must use small same-origin image in archive');
assert.equal(card({...bulletin,image_path:legacyPhotoV425},false).querySelector('img').getAttribute('src'),
  '/notice-previews/zbierka-v425.webp','overview uses the same optimized preview');
legacyImgV425.dispatchEvent(new dom.window.Event('error'));
assert.equal(legacyImgV425.src,'https://example.invalid/'+legacyPhotoV425,
  'missing optimized preview must fall back to untouched full-resolution original');
assert.equal(card({...bulletin,image_path:legacyPhotoV425},true,true).querySelector('img').src,
  legacyImgV425.src,'failed preview is not retried on archive re-render');
const cacheRulesV425=JSON.parse(fs.readFileSync('vercel.json','utf8'));
const previewHeadersV425=cacheRulesV425.headers.find(x=>x.source==='/notice-previews/zbierka-v425.webp')?.headers;
assert.equal(previewHeadersV425?.find(x=>x.key==='Cache-Control')?.value,
  'public, max-age=31536000, immutable','versioned thumbnail must be browser-cacheable');
const previewBytesV425=fs.readFileSync('notice-previews/zbierka-v425.webp');
assert.equal(previewBytesV425.subarray(0,4).toString('ascii'),'RIFF','generated preview is RIFF');
assert.equal(previewBytesV425.subarray(8,12).toString('ascii'),'WEBP','generated preview is WebP');
assert.equal(previewBytesV425.length,37098,'generated 512×640 optimized asset has expected byte size');
assert.equal(require('node:crypto').createHash('sha256').update(previewBytesV425).digest('hex'),
  'bf86d94db11400f3c5f37b3958537dfe72837556809321ab7eda0f5e6ff725ef',
  'preview bytes must match verified conversion of the unchanged legacy original');

const photoNode=new Function('document','icon',fn+'\nreturn photoNode;')(dom.window.document,()=>'<svg class="paw"></svg>');
const dog={dog_id:2,name:'Synthetic dog',photo_url:'https://example.invalid/synthetic.jpg',sex:'female'};
const tile=photoNode(dog,'design-friend-photo');
assert(tile.querySelector('img'),'real photo has an image');
assert(!tile.querySelector('svg'),'no artificial paw appears over downloading photo');
assert(!tile.classList.contains('design-photo-ready-v404'));
const img=tile.querySelector('img');
Object.defineProperty(img,'naturalWidth',{configurable:true,value:120});
img.dispatchEvent(new dom.window.Event('load'));
(async()=>{
 await Promise.resolve();
 assert(tile.classList.contains('design-photo-ready-v404'),'only loaded bitmap is shown');
 const noPhoto=photoNode({name:'Anonymous',key:'anon'},'design-friend-photo');
 assert(noPhoto.querySelector('.paw'),'intentional missing/hidden photo state stays as before');
 let urls=[];
 class FakeImage{
   set src(url){urls.push(url);this.onload?.();}
   decode(){return Promise.resolve();}
 }
 const helper=app.slice(app.indexOf('async function preloadFirstScreenFriendsV404('),app.indexOf('async function settleCustomerFirstPhotosV291('));
 const preloader=new Function('futureItems','Image',helper+'\nreturn preloadFirstScreenFriendsV404;')(
   ()=>[{status:'approved',reservation_date:'2099-02-03'}],FakeImage);
 await preloader({availability:{days:[{date:'2099-02-03',dogs:Array.from({length:12},(_,i)=>({photo_url:'https://example.invalid/'+i+'.jpg'}))}]}});
 assert.equal(urls.length,6,'preload is bounded, not entire photo library');
 assert.equal(new Set(urls).size,6,'do not download duplicate URLs');
 const settleSource=app.slice(app.indexOf('async function settleCustomerFirstPhotosV291('),app.indexOf('function bootstrapCore(',app.indexOf('async function settleCustomerFirstPhotosV291(')));
 const bitmap={complete:true,naturalWidth:20,getAttribute:()=>'/synthetic.png',closest:()=>null,decode:async()=>{}};
 const settle=images=>Function('$','setTimeout',settleSource+'\nreturn settleCustomerFirstPhotosV291;')(()=>({querySelectorAll:()=>images}),setTimeout)(1);
 assert.equal(await settle([bitmap]),true,'photo stage completes only after bitmap decoding');
 assert.equal(await settle([{...bitmap,decode:async()=>{throw Error('Synthetic decode failure')}}]),false,'failed decode is not photo-ready');
 assert.equal(await settle([{...bitmap,complete:false,naturalWidth:0,addEventListener(){},removeEventListener(){}}]),false,'photo timeout does not become a completed photo measurement');
 assert.equal(await settle([]),true,'no photo assets has a completed empty stage');
 dom.window.close();
 console.log('PASS customer v404: no loading paw, decoded photo, bounded warmup, announcement progressive content');
})().catch(err=>{console.error(err);process.exitCode=1});
