/* LiquidLens + Simple Liquid Glass, MIT. Explicit section decoration source;
   never capture forms, photographs, text or customer data into GPU textures. */
import './liquidlens.js';
import {createWebGLSurface} from './webgl.js';
const ns='http://www.w3.org/2000/svg',states=new Map(),maps=new Map(),sources=new Map();
const reduce=matchMedia('(prefers-reduced-transparency: reduce)'),contrast=matchMedia('(prefers-contrast: more)');
const low=(navigator.hardwareConcurrency||8)<=2||(navigator.deviceMemory||8)<=2;
const chrome=/\b(Chrome|Chromium|Edg|SamsungBrowser)\//.test(navigator.userAgent)&&!/\b(CriOS|EdgiOS)\//.test(navigator.userAgent);
const svgMode=chrome&&CSS.supports('backdrop-filter','url("#site-lens")');
const webkit=/AppleWebKit/.test(navigator.userAgent)&&!chrome;
let frame=0,seq=0,contexts=0,generations=0;
const bank=document.createElementNS(ns,'svg');bank.setAttribute('aria-hidden','true');bank.style.cssText='position:absolute;width:0;height:0;overflow:hidden';document.body.append(bank);
function node(tag,attrs,parent){const n=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));parent.append(n);return n;}
function mapFor(w,h,r){const key=[w,h,r].join(':');if(!maps.has(key)){maps.set(key,{uri:LiquidLens.makeDisplacementMap(w,h,r,Math.min(18,r,h/3)),scale:Math.min(20,r*1.2)});generations++;if(maps.size>32)maps.delete(maps.keys().next().value);}return maps.get(key);}
function stop(s){if(s.engine){s.engine.destroy();s.engine=null;contexts--;}s.output?.remove();s.output=null;s.layer.dataset.renderer='fallback';}
function visible(el){const r=el.getBoundingClientRect();return r.width>20&&r.height>20&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;}
function sourceFor(section){
 let source=sources.get(section);if(source)return source;
 const canvas=document.createElement('canvas');canvas.className='site-glass-source';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
 source={canvas,key:'',images:new Map(),revision:0};sources.set(section,source);return source;
}
function paint(section,source){
 const rect=section.getBoundingClientRect(),decor=[...section.querySelectorAll('svg[aria-hidden="true"]')].filter(svg=>!svg.closest('[data-site-glass],button,a,header,form')&&getComputedStyle(svg).position==='absolute');
 const color=getComputedStyle(section).backgroundColor,key=[innerWidth,innerHeight,rect.top,rect.height,color,...decor.map(svg=>{const r=svg.getBoundingClientRect();return [r.x,r.y,r.width,r.height,getComputedStyle(svg).color].join(',');})].join(':');
 if(key===source.key)return;source.key=key;
 const canvas=source.canvas,dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.ceil(innerWidth*dpr);canvas.height=Math.ceil(innerHeight*dpr);const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
 ctx.fillStyle=getComputedStyle(document.body).backgroundColor;ctx.fillRect(0,0,innerWidth,innerHeight);ctx.fillStyle=color;ctx.fillRect(rect.x,rect.y,rect.width,rect.height);
 for(const svg of decor){const r=svg.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)continue;const style=getComputedStyle(svg),imageKey=svg.outerHTML+style.color;let image=source.images.get(imageKey);
  if(!image){const clone=svg.cloneNode(true);clone.removeAttribute('class');clone.setAttribute('xmlns',ns);clone.setAttribute('width',r.width);clone.setAttribute('height',r.height);clone.style.cssText='color:'+style.color;image=new Image();image.onload=()=>{source.key='';schedule();};image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(clone));source.images.set(imageKey,image);}
  if(image.complete&&image.naturalWidth)ctx.drawImage(image,r.x,r.y,r.width,r.height);
 }
 canvas.dataset.liquidGlassRevision=String(++source.revision);
}
function sync(){
 frame=0;const found=[...document.querySelectorAll('[data-site-glass]')],enabled=!document.hidden&&!reduce.matches&&!contrast.matches;
 for(const[el,s]of states)if(!el.isConnected){stop(s);s.filter?.remove();states.delete(el);}
 let used=0;
 for(const el of found){let s=states.get(el);if(!s){const layer=document.createElement('span');layer.className='site-glass-material';layer.dataset.renderer='fallback';layer.setAttribute('aria-hidden','true');el.prepend(layer);s={layer,key:''};states.set(el,s);resize.observe(el);intersection.observe(el);}
  if(s.layer.parentElement!==el)el.prepend(s.layer);
  if(!enabled||!visible(el)||low){stop(s);continue;}
  const r=el.getBoundingClientRect(),w=Math.round(r.width),h=Math.round(r.height),radius=parseFloat(getComputedStyle(el).borderTopLeftRadius)||24,key=[w,h,radius].join(':');
  if(!svgMode&&(!webkit||used>=2)){stop(s);continue;}
  const map=mapFor(w,h,radius);
  if(key!==s.key){stop(s);s.filter?.remove();s.key=key;const id='site-lens-'+(++seq);s.filter=node('filter',{id,x:0,y:0,width:w,height:h,filterUnits:'userSpaceOnUse','color-interpolation-filters':'sRGB'},bank);node('feImage',{href:map.uri,width:w,height:h,result:'lens',preserveAspectRatio:'none'},s.filter);node('feDisplacementMap',{in:'SourceGraphic',in2:'lens',scale:map.scale,xChannelSelector:'R',yChannelSelector:'G'},s.filter);s.layer.style.setProperty('--site-glass-filter','url("#'+id+'")');}
  if(svgMode){s.layer.dataset.renderer='svg';continue;}
  used++;const section=el.closest('section');if(!section)continue;const source=sourceFor(section);paint(section,source);
  if(!s.engine&&!s.failed){const output=document.createElement('span');output.className='site-glass-output';s.layer.append(output);s.output=output;try{s.engine=createWebGLSurface(el,output,source.canvas,{map:map.uri,scale:map.scale,dispersion:0,specular:.08,classic:false,neutralPoint:128/255,radius,blur:.65,saturation:110},status=>{if(status==='active')s.layer.dataset.renderer='webgl';else if(status!=='pending'){s.failed=true;s.reason=status;schedule();}});contexts++;}catch(error){s.failed=true;s.reason=String(error);stop(s);}}
  if(s.failed)stop(s);
 }
 // Decoration sources are bounded to sections that currently own an output.
 const active=new Set([...states.entries()].filter(([,s])=>s.engine).map(([el])=>el.closest('section')));
 for(const[section,source]of sources)if(!active.has(section)){source.canvas.remove();sources.delete(section);}
}
function schedule(){if(!frame)frame=requestAnimationFrame(sync);}
const resize=new ResizeObserver(schedule),intersection=new IntersectionObserver(schedule);
new MutationObserver(records=>{if(records.some(r=>!(r.target instanceof Element)||!r.target.closest('.site-glass-material')))schedule();}).observe(document.body,{childList:true,subtree:true});
window.addEventListener('scroll',schedule,{passive:true,capture:true});window.addEventListener('resize',schedule,{passive:true});window.addEventListener('pageshow',schedule);
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;sync();}else schedule();});reduce.addEventListener('change',schedule);contrast.addEventListener('change',schedule);
window.siteLiquidDiagnostics=()=>({contexts,contextLimit:low?0:2,mapGenerations:generations,sources:sources.size,surfaces:[...states.values()].map(s=>({renderer:s.layer.dataset.renderer,reason:s.reason||null}))});schedule();
