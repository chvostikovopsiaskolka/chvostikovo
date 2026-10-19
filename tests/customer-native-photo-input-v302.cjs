'use strict';
// Customer v302: direct-target native file picker regression, no browser OS mock.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const src=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'..','styles.css'),'utf8');
function slice(a,b){const x=src.indexOf(a),y=src.indexOf(b,x+1);assert.ok(x>=0&&y>x,a);return src.slice(x,y)}
const js=slice('function ensurePhotoActionsV89(){','function fileDataUrlV88')+
 slice('async function openPhotoEditor(e){','async function openExistingPhotoEditorV89')+
 slice("$('dogDetailsPhotoButton').addEventListener('click',","$('bookingVaccinationStatus').addEventListener('click',");
assert.doesNotMatch(js,/photoPickerFromActionsV184|photo-picker-waiting-v184|photo-picker-status-v301/);
assert.doesNotMatch(css,/photo-picker-waiting-v184|photo-picker-status-v301/);
assert.match(js,/<label id="photoReplaceV89"[^>]+>Nahrať novú fotku<input id="dogPhotoReplaceNativeV302" type="file" accept="image\/\*"/);
assert.match(css,/#photoActionsModalV89 #dogPhotoReplaceNativeV302\{[\s\S]*?display:block!important;/);
assert.match(css,/#photoActionsModalV89 #dogPhotoReplaceNativeV302\{[\s\S]*?opacity:0;/);
assert.doesNotMatch(js,/\$\('photoReplaceV89'\)\.onclick=selectNewDogPhotoV89/);
class MockElement{
 constructor(id,raw=''){
   this.id=id;this.classes=new Set((raw.match(/class="([^"]+)"/)?.[1]||'').split(/\s+/));
   this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x),contains:x=>this.classes.has(x)};
   this.dataset={};this.handlers={};this.clicks=0;this.files=[];this.value='';
 }
 addEventListener(name,cb){(this.handlers[name]??=[]).push(cb)}
 click(){this.clicks++;this.onclick?.();this.fire('click')}
 fire(name){for(const fn of this.handlers[name]||[])fn({target:this})}
}
const els=new Map(['dogDetailsPhotoButton','dogPhotoInput'].map(id=>[id,new MockElement(id)]));
const $=id=>els.get(id)||null;
const document={body:{insertAdjacentHTML(_where,markup){for(const m of markup.matchAll(/<[^>]*id="([^"]+)"[^>]*>/g)){els.set(m[1],new MockElement(m[1],m[0]))}}}};
const window={__customerPhotoPickerV88:false,__customerPhotoDecodeV88:false};
const opened=[],errors=[],dialogs=[];
const ui=new Function('document','$','window','setTimeout','selectedDog','decodePhotoFileV88','beginPhotoEditV89','openExistingPhotoEditorV89','deleteCurrentDogPhotoV89','toast',
 js+'\nreturn {showPhotoActionsV89,openPhotoEditor,closePhotoActionsV89}')(document,$,window,()=>{},()=>({id:77,photo_url:'present'}),async file=>{if(file.name==='bad.jpg')throw Error('decode');return {file}},img=>opened.push(img),dog=>opened.push({existing:dog.id}),()=>dialogs.push('delete'),e=>errors.push(e));
(async()=>{
 ui.showPhotoActionsV89({id:77,photo_url:'present'});
 const modal=$('photoActionsModalV89'),input=$('dogPhotoReplaceNativeV302');
 assert.equal(modal.classList.contains('hidden'),false,'opens existing photo actions');
 assert.equal($('photoReplaceV89').onclick,undefined,'no synthetic button click');
 assert.equal(input.clicks,0,'native input has no programmatic click');
 input.fire('click');
 assert.equal(window.__customerPhotoPickerV88,true,'direct user tap sets picker guard');
 assert.equal(input.clicks,0,'no JS .click call');
 input.fire('cancel');
 assert.equal(window.__customerPhotoPickerV88,false,'cancel clears guard');
 assert.equal(modal.classList.contains('hidden'),false,'cancel retains complete dialog');
 input.files=[{name:'photo.jpg'}];input.value='selected';
 await ui.openPhotoEditor({target:input});
 assert.equal(opened.length,1,'new photo opens crop');
 assert.equal(modal.classList.contains('hidden'),true,'native choice closes complete dialog');
 assert.equal(input.value,'','reselect same image allowed');
 ui.showPhotoActionsV89({id:77,photo_url:'present'});
 $('photoEditCurrentV89').click();
 assert.deepEqual(opened[1],{existing:77},'existing edit remains');
 assert.equal(modal.classList.contains('hidden'),true);
 ui.showPhotoActionsV89({id:77,photo_url:'present'});
 input.files=[{name:'bad.jpg'}];input.value='selected';
 await ui.openPhotoEditor({target:input});
 assert.equal(modal.classList.contains('hidden'),true,'decode failure closes chooser');
 assert.equal(errors.length,1,'decode failure shows error');
 assert.equal(input.value,'','error resets input');
 // Original input still exists for no-photo flow, without new intermediate modal.
 assert.equal(els.get('dogPhotoInput').clicks,0);
 els.get('dogDetailsPhotoButton').click();
 assert.equal(modal.classList.contains('hidden'),false,'existing photo pencil opens actions again');
 const release=JSON.parse(fs.readFileSync(path.join(__dirname,'..','version.json'),'utf8'));
 assert.equal(src.includes("const APP_VERSION='"+release.version+"'"),true,'APP_VERSION matches version.json');
 console.log('Customer native photo picker v302: 18 scoped assertions PASS');
})().catch(error=>{console.error(error);process.exitCode=1});
// v304: verify HTML's label activation rather than mocking a JS .click().
{
 const {JSDOM}=require('./shared-v244/node_modules/jsdom');
 const markup=src.match(/document.body.insertAdjacentHTML\('beforeend',`(<div id="photoActionsModalV89"[\s\S]*?)`\);/)[1];
 const dom=new JSDOM('<style>'+css+'</style>'+markup);
 const d=dom.window.document,label=d.getElementById('photoReplaceV89'),input=d.getElementById('dogPhotoReplaceNativeV302');
 let activations=0;input.addEventListener('click',()=>activations++);
 assert.equal(label.control,input);
 label.click();assert.equal(activations,1,'one native activation per label tap');
 label.click();assert.equal(activations,2,'repeat native activation');
 assert.equal(input.disabled,false);
 assert.notEqual(input.tabIndex,-1,'keyboard-accessible input');
 const style=dom.window.getComputedStyle(input);
 assert.equal(style.width,'1px');assert.equal(style.height,'1px');
 assert.equal(style.minHeight,'0');assert.equal(style.pointerEvents,'none');
 assert.equal(d.getElementById('photoEditCurrentV89').tagName,'BUTTON');
 assert.equal(d.getElementById('photoDeleteV89').tagName,'BUTTON');
 console.log('Photo label v304: native activation, repeat, keyboard and source geometry PASS (physical iOS preview unverified)');
}
