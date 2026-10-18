'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'..','styles.css'),'utf8');
function section(a,b){const i=app.indexOf(a),j=app.indexOf(b,i+1);assert.ok(i>=0&&j>i,a);return app.slice(i,j)}
const code=section('function ensurePhotoActionsV89(){','function fileDataUrlV88')+
 section("$('dogPhotoInput').addEventListener('cancel',","$('bookingVaccinationStatus').addEventListener('click',")+
 section('async function openPhotoEditor(e){','async function openExistingPhotoEditorV89');
class Element {
 constructor(id,classes=''){this.id=id;this.classes=new Set(classes.split(/\s+/));this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x),contains:x=>this.classes.has(x)};this.dataset={};this.attributes={};this.listeners={};this.clicks=0;this.files=[];this.value='';}
 addEventListener(name,cb){(this.listeners[name]??=[]).push(cb)}
 setAttribute(k,v){this.attributes[k]=v}
 getAttribute(k){return this.attributes[k]}
 removeAttribute(k){delete this.attributes[k]}
 click(){this.clicks++;if(this.failClick)throw Error('picker blocked');this.onclick?.()}
 fire(name){for(const cb of this.listeners[name]||[])cb({target:this})}
}
const elements=new Map([['dogPhotoInput',new Element('dogPhotoInput')]]);
const $=id=>elements.get(id)||null;
const document={body:{insertAdjacentHTML(_where,html){for(const m of html.matchAll(/<[^>]+id="([^"]+)"[^>]*>/g)){elements.set(m[1],new Element(m[1],m[0].match(/class="([^"]+)"/)?.[1]||''))}}}};
const edits=[],errors=[],window={__customerPhotoPickerV88:false,__customerPhotoDecodeV88:false};
const api=new Function('document','$','toast','window','decodePhotoFileV88','beginPhotoEditV89','openExistingPhotoEditorV89',
 code+'\nreturn {showPhotoActionsV89,openPhotoEditor}')(
 document,$,s=>errors.push(s),window,async file=>({file}),image=>edits.push(image),dog=>edits.push({existing:dog.id}));
(async()=>{
 assert.match(css,/#photoActionsModalV89\.photo-picker-waiting-v184 \.photo-actions-card-v89\{[\s\S]*?visibility:visible!important/);
 assert.match(css,/#photoActionsModalV89\.photo-picker-waiting-v184 \.photo-actions-list-v89\{\s*display:none!important/);
 assert.match(css,/#dogDetailsPhotoButton,[\s\S]*?-webkit-tap-highlight-color:transparent!important/);
 api.showPhotoActionsV89({id:7,photo_url:'photo'});
 const modal=$('photoActionsModalV89'),file=$('dogPhotoInput');
 $('photoReplaceV89').click();
 assert.equal(file.clicks,1);
 assert.equal(modal.classList.contains('photo-picker-waiting-v184'),true);
 assert.equal(modal.getAttribute('aria-busy'),'true');
 file.fire('cancel');
 assert.equal(modal.classList.contains('photo-picker-waiting-v184'),false);
 assert.equal(modal.classList.contains('hidden'),false);
 $('photoReplaceV89').click();
 file.files=[{name:'test.jpg'}];file.value='fake';
 await api.openPhotoEditor({target:file});
 assert.equal(edits.length,1);
 assert.equal(modal.classList.contains('hidden'),true);
 assert.equal(file.value,'');
 api.showPhotoActionsV89({id:7,photo_url:'photo'});
 $('photoEditCurrentV89').click();
 assert.deepEqual(edits[1],{existing:7});
 api.showPhotoActionsV89({id:7,photo_url:'photo'});
 file.failClick=true;$('photoReplaceV89').click();
 assert.equal(modal.classList.contains('photo-picker-waiting-v184'),false);
 assert.equal(modal.classList.contains('hidden'),false);
 console.log('Customer photo chooser v301: 15 checks PASS');
})().catch(e=>{console.error(e);process.exitCode=1});