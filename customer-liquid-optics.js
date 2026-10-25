/* V3 PREVIEW. Wallpaper optics only: no customer data capture or backend calls.
 * LiquidLens Snell/SDF map + Simple Liquid Glass's framework-independent WebGL.
 * See the vendored LICENSE files and docs/customer-liquid-v3-preview.md.
 */
import './vendor/liquidlens/liquid-glass.js';
import {createWebGLSurface} from './vendor/simple-liquid-glass/webgl.js';
const root=document.documentElement, NS='http://www.w3.org/2000/svg';
const reels=new URLSearchParams(location.search).get('glass-material')!=='lens';root.dataset.glassMaterial=reels?'reels':'lens';
let turbulenceReady=false;const turbulenceImage=new Image();
if(reels){turbulenceImage.onload=()=>{turbulenceReady=true;schedule()};turbulenceImage.onerror=()=>{stats.reelsFailure='noise-texture-load';schedule()};turbulenceImage.src='/vendor/liquidlens/reels-noise-v385.png';}
const reduce=matchMedia('(prefers-reduced-transparency: reduce)');
const contrast=matchMedia('(prefers-contrast: more)');
const low=(navigator.deviceMemory&&navigator.deviceMemory<=2)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=2);
const svgSyntax=CSS.supports('backdrop-filter','url("#lg-v3-check")');
const chromium=svgSyntax&&/\b(Chrome|Chromium|Edg|SamsungBrowser)\//.test(navigator.userAgent)&&!/\b(CriOS|EdgiOS)\//.test(navigator.userAgent);
const webkit=/AppleWebKit/.test(navigator.userAgent)&&!chromium;
const selectors=['#authView>.auth-card','#bookingDogProfile:not(.dual-dog-v241) .dog-overview-content','#bookingDogProfile .dual-dog-info-v254','#menuTab .customer-menu-group','#menuTab .customer-social-v223','#designTicket.design-ticket','#designNearest.design-nearest','#bookingPickerV37 #designMyBookings','.customer-bulletin-history-row-v229 .customer-notice-panel-v383','.bottom-nav'];
const states=new Map(),maps=new Map();let bank,source,sourceImage,sourceKey='',revision=0,frame=0,sequence=0;
const stats={mode:'fallback',mapGenerations:0,contexts:0,peakContexts:0,contextLimit:low?0:2,source:'original-wallpaper-only'};
window.customerLiquidV3Diagnostics=()=>({...stats,material:reels?'reels':'lens',turbulenceReady,surfaces:[...states.values()].map(s=>({renderer:s.layer.dataset.renderer,reason:s.reason||null,width:s.width,height:s.height}))});
function svg(tag,attrs,parent){const el=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,String(v));parent?.append(el);return el;}
function mapFor(w,h,r){
 const bezel=Math.min(18,r,Math.min(w,h)/3),key=[reels?'reels':'lens',w,h,r,bezel].join(':');
 if(maps.has(key))return maps.get(key);
 if(reels){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const c=canvas.getContext('2d');c.fillStyle=c.createPattern(turbulenceImage,'repeat');c.fillRect(0,0,w,h);const result={uri:canvas.toDataURL('image/png'),scale:6};maps.set(key,result);if(maps.size>32)maps.delete(maps.keys().next().value);stats.mapGenerations++;return result;}
 // LiquidLens normalizes Snell deflection to +/-127. SVG samples channel-.5:
 // scale=2*edgePx compensates that range; neutralPoint matches 128/255 in WebGL.
 const edgePx=Math.min(10,bezel*.6),scale=edgePx*2;
 const uri=window.LiquidLens.makeDisplacementMap(w,h,r,bezel),result={uri,scale};
 maps.set(key,result);if(maps.size>32)maps.delete(maps.keys().next().value);stats.mapGenerations++;return result;
}
function filterFor(map,w,h){
 if(!bank){bank=svg('svg',{'aria-hidden':'true',style:'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none'},document.body);}
 const id='lg-v3-'+(++sequence),filter=svg('filter',{id,filterUnits:'userSpaceOnUse',x:0,y:0,width:w,height:h,'color-interpolation-filters':'sRGB'},bank);
 if(reels)svg('feTurbulence',{type:'fractalNoise',baseFrequency:'0.018 0.028',numOctaves:2,seed:7,stitchTiles:'stitch',result:'lens'},filter);else svg('feImage',{href:map.uri,x:0,y:0,width:w,height:h,result:'lens',preserveAspectRatio:'none'},filter);
 svg('feDisplacementMap',{in:'SourceGraphic',in2:'lens',scale:map.scale,xChannelSelector:'R',yChannelSelector:'G'},filter);
 return {filter,id};
}
function paintWallpaper(){
 if(!source||!sourceImage?.complete||!sourceImage.naturalWidth)return;
 const dpr=Math.min(devicePixelRatio||1,1.5),w=innerWidth,h=innerHeight;
 const panels=[...document.querySelectorAll('#bookingDogProfile:not(.dual-dog-v241),.dual-dog-panel-v254')].filter(visible).map(el=>({r:el.getBoundingClientRect(),color:getComputedStyle(el).backgroundColor,radius:parseFloat(getComputedStyle(el).borderRadius)||19}));
 const key=[w,h,Math.round(scrollY),getComputedStyle(document.body).backgroundColor,...panels.map(p=>[p.r.x,p.r.y,p.r.width,p.r.height,p.color].join(','))].join(':');if(key===sourceKey)return;
 sourceKey=key;source.width=Math.ceil(w*dpr);source.height=Math.ceil(h*dpr);
 const ctx=source.getContext('2d');ctx.scale(dpr,dpr);ctx.fillStyle=getComputedStyle(document.body).backgroundColor;ctx.fillRect(0,0,w,h);
 // This is the existing 300x430 SVG wallpaper, at its existing document origin.
 // It is an explicit texture source, never a snapshot of private app content.
 ctx.save();ctx.translate(0,-((scrollY%430+430)%430));ctx.fillStyle=ctx.createPattern(sourceImage,'repeat');ctx.fillRect(0,0,w,h+430);ctx.restore();
 for(const p of panels){ctx.beginPath();ctx.roundRect(p.r.x,p.r.y,p.r.width,p.r.height,p.radius);ctx.fillStyle=p.color;ctx.fill();}
 source.dataset.liquidGlassRevision=String(++revision);
}
function wallpaper(){
 if(source)return source;
 source=document.createElement('canvas');source.id='customer-lg-v3-wallpaper';source.setAttribute('aria-hidden','true');document.body.append(source);
 sourceImage=new Image();sourceImage.onload=()=>{sourceKey='';paintWallpaper();schedule();};
 // Same original SVG rasterized once: WebKit taints canvases painted from
 // a data-SVG containing <use>. Same-origin PNG keeps GPU upload origin-clean.
 sourceImage.src='/vendor/liquidlens/chvostikovo-paws-soft-v383.png';return source;
}
// A profile moves in document space. Its texture must move with it too:
// viewport snapshots can lag WebKit's compositor scroll and expose white bands.
function profileBackdrop(el,s){
 const panel=el.closest('.dual-dog-panel-v254,#bookingDogProfile');
 if(!panel)return wallpaper();
 if(!sourceImage?.naturalWidth)return null;
 if(!s.profileSource){
  const canvas=document.createElement('canvas');canvas.className='lg-v3-profile-source';
  canvas.setAttribute('aria-hidden','true');canvas.style.cssText='position:absolute!important;inset:-32px auto auto -32px!important;width:calc(100% + 64px)!important;height:calc(100% + 64px)!important;visibility:hidden!important;pointer-events:none';
  panel.append(canvas);s.profileSource=canvas;
 }
 const canvas=s.profileSource,r=panel.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5);
 const x=Math.round(r.left+scrollX)-32,y=Math.round(r.top+scrollY)-32,color=getComputedStyle(panel).backgroundColor;
 const key=[Math.round(r.width),Math.round(r.height),x,y,color,dpr].join(':');
 if(key!==s.profileSourceKey){
  s.profileSourceKey=key;const w=r.width+64,h=r.height+64;canvas.width=Math.ceil(w*dpr);canvas.height=Math.ceil(h*dpr);
  const c=canvas.getContext('2d');c.scale(dpr,dpr);c.fillStyle=getComputedStyle(document.body).backgroundColor;c.fillRect(0,0,w,h);
  c.save();c.translate(-((x%300+300)%300),-((y%430+430)%430));c.fillStyle=c.createPattern(sourceImage,'repeat');c.fillRect(0,0,w+300,h+430);c.restore();
  c.fillStyle=color;c.fillRect(0,0,w,h);canvas.dataset.liquidGlassRevision=String(++revision);
 }
 return canvas;
}
function stop(s){if(s.engine){s.engine.destroy();s.engine=null;stats.contexts--;s.layer.dataset.renderer='fallback';s.output?.remove();s.output=null;}s.profileSource?.remove();s.profileSource=null;s.profileSourceKey='';}
function remove(el,s){stop(s);s.filter?.remove();s.layer.remove();resize.unobserve(el);el.classList.remove('lg-v3-host');if(s.previousPosition!==undefined)el.style.position=s.previousPosition;states.delete(el);}
function visible(el){const r=el.getBoundingClientRect(),css=getComputedStyle(el);return r.width>20&&r.height>18&&r.bottom>0&&r.top<innerHeight&&css.visibility!=='hidden'&&css.display!=='none'&&!el.closest('.hidden');}
function materialHolder(el){return el.matches('details')?el.querySelector(':scope>summary'):el;}
function sync(){
 frame=0;
 const auth=document.getElementById('authView'),authVisible=!!auth&&!auth.classList.contains('hidden');
 root.classList.toggle('customer-auth-glass-v386',authVisible);
 const enabled=(root.classList.contains('customer-liquid-v364')||authVisible)&&!document.hidden;
 const opaque=reduce.matches||contrast.matches;
 const found=enabled?selectors.flatMap(s=>[...document.querySelectorAll(s)]):[];
 for(const [el,s]of states)if(!el.isConnected||!found.includes(el))remove(el,s);else if(!visible(el))stop(s);
 let used=0;
 for(const el of found){
  let s=states.get(el);if(s&&s.layer.parentElement!==materialHolder(el))materialHolder(el).prepend(s.layer);if(!visible(el)){if(s)stop(s);continue;}
  if(!s){
   const layer=document.createElement('span');layer.className='lg-v3-material';layer.setAttribute('aria-hidden','true');layer.dataset.renderer='fallback';
   s={layer,engine:null,key:'',width:0,height:0};states.set(el,s);
   if(getComputedStyle(el).position==='static'){s.previousPosition=el.style.position;el.style.position='relative';}
   el.classList.add('lg-v3-host');materialHolder(el).prepend(layer);resize.observe(el);
  }
  // Content renderers can replace their children independently of geometry.
  if(s.layer.parentElement!==materialHolder(el))materialHolder(el).prepend(s.layer);
  const r=el.getBoundingClientRect(),w=Math.round(r.width),h=Math.round(r.height),radius=parseFloat(getComputedStyle(el).borderTopLeftRadius)||16,key=[w,h,radius].join(':');
  if(opaque){stop(s);s.layer.dataset.renderer='fallback';continue;}
  if(!chromium&&(!webkit||low)){stop(s);s.layer.dataset.renderer='fallback';continue;}
  if(reels&&!turbulenceReady){stop(s);continue;}
  const selected=el.matches('.bottom-nav')||(el.matches('.auth-card,.dog-overview-content,.dual-dog-info-v254')||reels&&el.matches('#menuTab .customer-menu-group'))&&used===0;
  if(!chromium&&!selected){stop(s);continue;}
  const map=mapFor(w,h,radius);
  if(key!==s.key){
   stop(s);s.filter?.remove();s.key=key;s.width=w;s.height=h;
   const f=filterFor(map,w,h);s.filter=f.filter;s.layer.style.setProperty('--lg-v3-filter','url("#'+f.id+'")');
  }
  if(chromium){s.layer.dataset.renderer='svg';stats.mode='svg';continue;}
  // Two outputs maximum: the dock and the first profile info panel.
  if(webkit&&!low&&selected&&used<stats.contextLimit){
   used++;
   if(!s.engine&&!s.failed){
    wallpaper();if(!sourceImage?.naturalWidth)continue;
    const backdrop=el.matches('.dog-overview-content,.dual-dog-info-v254')?profileBackdrop(el,s):wallpaper();if(!backdrop)continue;
    paintWallpaper();const output=document.createElement('span');output.className='lg-v3-output';s.layer.prepend(output);s.output=output;
    try{
     s.engine=createWebGLSurface(el,output,backdrop,{map:map.uri,scale:map.scale,dispersion:0,specular:.1,classic:false,neutralPoint:128/255,radius,blur:reels?3:.65,saturation:reels?180:115},status=>{
      if(status==='active'){s.layer.dataset.renderer='webgl';stats.mode='webgl';}
      else if(status!=='pending'){s.layer.dataset.renderer='fallback';s.failed=true;s.reason=status;schedule();}
     });stats.contexts++;stats.peakContexts=Math.max(stats.peakContexts,stats.contexts);
    }catch(error){s.failed=true;s.reason=String(error.message||error);output.remove();s.output=null;}
   }
   if(s.engine&&s.profileSource)profileBackdrop(el,s);
   if(s.failed)stop(s);
  }else stop(s);
 }
 if(!enabled||opaque){for(const s of states.values())stop(s);source?.remove();source=null;sourceImage=null;sourceKey='';}
}
function schedule(){if(!frame)frame=requestAnimationFrame(sync);}
const resize=new ResizeObserver(schedule);
function start(){
 new MutationObserver(records=>{if(records.some(r=>!(r.target instanceof Element)||!r.target.closest('.lg-v3-material')))schedule();}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});
 window.addEventListener('resize',()=>{sourceKey='';paintWallpaper();schedule();},{passive:true});
 window.addEventListener('scroll',()=>{paintWallpaper();schedule();},{passive:true,capture:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;sync();}else schedule();});window.addEventListener('pageshow',schedule);
 reduce.addEventListener('change',schedule);contrast.addEventListener('change',schedule);
 document.fonts?.ready.then(schedule);schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
