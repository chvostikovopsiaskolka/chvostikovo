/*
 * Chvostíkovo preview: genuine SVG lens on supported Chromium.
 * Uses the vendored MIT inverse-SDF map algorithm. Safari uses styled CSS fallback.
 * No auth, booking, storage, network requests, or updater changes.
 */
import {createLiquidGlassDisplacementPixels,supportsLiquidGlassSvgFilter} from './vendor/liquid-glass/liquid-glass-core.js';
const root=document.documentElement,ns='http://www.w3.org/2000/svg';
const reduced=window.matchMedia?.('(prefers-reduced-transparency: reduce)');
const candidates=[
 ['#bookingDogProfile:not(.dual-dog-v241) .dog-overview-content','soft'],
 ['#bookingDogProfile .dual-dog-info-v254','soft'],
 ['#customerInboxV363 > button','thin'],
 ['#designTicket.design-ticket','soft'],
 ['#designNearest.design-nearest','soft'],
 ['.bottom-nav','soft']
];
const states=new Map();let bank,defs,frame=0,counter=0;
function svg(tag,attributes,parent){
 const node=document.createElementNS(ns,tag);
 for(const [key,value] of Object.entries(attributes))node.setAttribute(key,String(value));
 parent?.append(node);return node;
}
function getBank(){
 if(bank)return;
 bank=svg('svg',{id:'customer-liquid-optics-bank','aria-hidden':'true',focusable:'false',style:'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none'},document.body);
 defs=svg('defs',{},bank);
}
function update(element,profile){
 const box=element.getBoundingClientRect();
 if(!element.isConnected||box.width<25||box.height<20)return;
 const width=Math.round(box.width),height=Math.round(box.height);
 const radius=Math.max(4,Math.min(Math.round(parseFloat(getComputedStyle(element).borderRadius)||17),Math.floor(Math.min(width,height)/2)));
 const key=width+'x'+height+':'+radius+':'+profile;
 const old=states.get(element);
 if(old?.key===key)return;
 old?.filter.remove();
 const id='customer-lg-lens-'+(++counter);
 const filter=svg('filter',{id,x:'-35%',y:'-35%',width:'170%',height:'170%','color-interpolation-filters':'sRGB'},defs);
 const image=svg('feImage',{width:'100%',height:'100%',preserveAspectRatio:'none',result:'map'},filter);
 const warp=svg('feDisplacementMap',{in:'SourceGraphic',in2:'map',xChannelSelector:'R',yChannelSelector:'G',scale:'0',result:'warped'},filter);
 svg('feColorMatrix',{in:'warped',type:'matrix',values:'1.05 0 0 0 0  0 1.02 0 0 0  0 0 1.06 0 0  0 0 0 1 0'},filter);
 const supersample=1.5,w=Math.round(width*supersample),h=Math.round(height*supersample);
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const context=canvas.getContext('2d');
 if(!context){filter.remove();return;}
 const img=context.createImageData(w,h);
 const pixels=createLiquidGlassDisplacementPixels({width:w,height:h,radius:radius*supersample,profile,magnify:profile==='thin'?1.12:1.07,bend:.06,spread:.58,bezelRatio:.62});
 img.data.set(pixels.data);context.putImageData(img,0,0);
 image.setAttribute('href',canvas.toDataURL('image/png'));
 // Calibrated from actual maximum displacement; no arbitrary filter scale.
 warp.setAttribute('scale',(pixels.scale/supersample*1.16).toFixed(2));
 states.set(element,{key,filter});
 element.style.setProperty('--customer-lg-filter','url("#'+id+'")');
 element.classList.add('customer-lg-map-ready');
}
function sync(){
 frame=0;
 if(!root.classList.contains('customer-liquid-v364')||reduced?.matches){root.classList.remove('customer-lg-svg-active');return;}
 const found=[];
 for(const [selector,profile] of candidates)for(const element of document.querySelectorAll(selector)){
  if(!element.getClientRects().length||element.closest('.hidden'))continue;
  found.push([element,profile]);
 }
 if(!found.length)return;
 getBank();
 for(const [element,profile] of found)update(element,profile);
 for(const [element,state] of states)if(!element.isConnected){state.filter.remove();states.delete(element);}
 root.classList.add('customer-lg-svg-active');
}
function schedule(){if(!frame)frame=requestAnimationFrame(sync);}
if(supportsLiquidGlassSvgFilter()&&!reduced?.matches){
 function start(){
  schedule();
  const tab=document.getElementById('bookingTab');
  if(tab)new MutationObserver(schedule).observe(tab,{subtree:true,childList:true});
  window.addEventListener('resize',schedule,{passive:true});
  reduced?.addEventListener?.('change',schedule);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
