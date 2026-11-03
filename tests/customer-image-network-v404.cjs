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
const card=Function('el','safePhoto','rowsState','openArticle',cardSource+'\nreturn noticeCard;')(
  (tag,cls,text)=>{const node=dom.window.document.createElement(tag);if(cls)node.className=cls;if(text!=null)node.textContent=text;return node;},
  path=>path?'https://example.invalid/'+path:'',{read:new Set()},()=>{}
);
const bulletin={id:1,title:'Synthetic notice',body:'Text',image_path:'img.png'};
const first=card(bulletin,true,true);
assert.equal(first.querySelector('img').loading,'eager','first visible archive image must start promptly');
assert.equal(first.querySelector('img').src,'https://example.invalid/img.png');
assert.equal(first.querySelector('svg'),null,'real photo has no fake paw');
assert.equal(card(bulletin,true,false).querySelector('img').loading,'lazy','later offscreen archive rows remain lazy');
assert.equal(card(bulletin,false).querySelector('img').loading,'eager','overview thumbnail starts promptly');
assert.equal(card({...bulletin,image_path:null},true,true).querySelectorAll('svg').length,1,'no-image record keeps its original icon');

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
 dom.window.close();
 console.log('PASS customer v404: no loading paw, decoded photo, bounded warmup, announcement progressive content');
})().catch(err=>{console.error(err);process.exitCode=1});
