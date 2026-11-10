import test from 'node:test';
import assert from 'node:assert/strict';
import { showPlayUpdateDialog } from '../src/update-dialog.js';

class Element extends EventTarget {
  constructor(tag,doc) { super(); this.tagName=tag.toUpperCase();this.doc=doc;this.children=[];this.attributes={};this.isConnected=false;this.hidden=false;this.textContent='';this.className='';this.id='';}
  setAttribute(k,v) {this.attributes[k]=String(v);}
  append(...els) { for (const el of els) {el.parent=this;el.isConnected=true;this.children.push(el);} }
  remove() {if(this.parent){this.parent.children=this.parent.children.filter(x=>x!==this);this.parent=null;}this.isConnected=false;}
  focus() {this.doc.activeElement=this;}
  click() {this.dispatchEvent(new Event('click'));}
}
class Doc extends EventTarget {
  constructor() {super();this.head=new Element('head',this);this.body=new Element('body',this);this.activeElement=null;}
  createElement(tag) {return new Element(tag,this);}
  getElementById(id) {const find=el=>el.id===id?el:el.children.map(find).find(Boolean);return find(this.head)||find(this.body)||null;}
}
const all = (el) => [el,...el.children.flatMap(all)];
const tick = () => new Promise(resolve => setImmediate(resolve));

test('accessible SK modal is exclusive, offers Play and Later, restores focus',async()=>{
  const doc=new Doc(),anchor=doc.createElement('button');doc.body.append(anchor);anchor.focus();
  let skipped=0,updated=0;
  const result=showPlayUpdateDialog({onUpdate:async()=>{updated++;},onLater:()=>{skipped++;}},doc);
  const overlay=doc.getElementById('chvo-native-update');
  assert.equal(result.overlay,overlay);
  assert.equal(showPlayUpdateDialog({onUpdate:()=>{}},doc),null,'avoid duplicate modals');
  const nodes=all(overlay),dialog=nodes.find(n=>n.attributes.role==='dialog');
  assert.equal(dialog.attributes['aria-modal'],'true');
  assert.equal(dialog.attributes['aria-labelledby'],'chvo-update-title');
  assert.match(doc.getElementById('chvo-update-title').textContent,/Nová verzia/);
  const primary=nodes.find(n=>n.className.includes('chvo-update-primary'));
  const secondary=nodes.find(n=>n.className.includes('chvo-update-secondary'));
  assert.equal(doc.activeElement,primary);
  assert.match(primary.textContent,/Google Play/);
  assert.match(secondary.textContent,/neskôr/);
  assert(doc.getElementById('chvo-native-update-style').textContent.includes('min-height:52px'),'touch targets');
  primary.click();await tick();
  assert.equal(updated,1);assert.equal(skipped,0);
  assert.equal(doc.getElementById('chvo-native-update'),null);assert.equal(doc.activeElement,anchor);
});

test('EN modal has a working Later path and a retry when Play cannot open',async()=>{
  const doc=new Doc();
  let later=0,attempts=0;
  showPlayUpdateDialog({language:'en',onLater:()=>later++,onUpdate:async()=>{attempts++;throw new Error('Play unavailable');}},doc);
  const nodes=all(doc.body),primary=nodes.find(n=>n.className?.includes('chvo-update-primary'));
  const secondary=nodes.find(n=>n.className?.includes('chvo-update-secondary'));
  assert.match(doc.getElementById('chvo-update-title').textContent,/New Chvostíkovo version/);
  primary.click();await tick();
  assert.equal(attempts,1);
  assert.equal(nodes.find(n=>n.className==='chvo-update-error').hidden,false);
  assert(doc.getElementById('chvo-native-update'),'failed Store open must not dismiss');
  secondary.click();
  assert.equal(later,1);
  assert.equal(doc.getElementById('chvo-native-update'),null);
});

test('Android back dismisses Play modal without navigating away from the app',()=>{
  const doc=new Doc();
  let skipped=0;
  showPlayUpdateDialog({onUpdate:async()=>{},onLater:()=>skipped++},doc);
  const event=new Event('chvo-native-back',{cancelable:true});
  doc.dispatchEvent(event);
  assert.equal(skipped,1);
  assert.equal(event.defaultPrevented,true);
  assert.equal(doc.getElementById('chvo-native-update'),null);
});
