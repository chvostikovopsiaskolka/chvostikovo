// QA-SCOPE-01: presentation-only proof by exact before/after comparison.
// Unknown source, code, price, handler, tracking or form changes fail closed.
const fs=require('node:fs');
const path=require('node:path');
const CONTENT_PATHS=new Set(['src/content/site.ts','src/routes/test-aria.tsx','src/components/site/Info.tsx']);
const literal=/^export const (MAP_LINK|INQUIRY_TITLE|INQUIRY_SUBTITLE|VISIT_INQUIRY_TITLE) = ("[^"\\\r\n]*");$/gm;
const healthRow=/(    title: "Zdravotný stav",\n    text: )("[^"\\\r\n]*")(,)/g;
const enHealth=/(title:"Health",text:)("[^"\\\r\n]*")/g;
const plain=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.length<=max&&!/[<>\u0000-\u001f]/.test(value);
function safeMap(value){
  try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&((u.hostname==='maps.app.goo.gl'&&/^\/[A-Za-z0-9]+$/.test(u.pathname))||(u.hostname==='www.google.com'&&u.pathname.startsWith('/maps/')));}catch{return false;}
}
function siteProof(source){
  if(typeof source!=='string')return null;
  const values={};let ok=true,healthCount=0;
  const normalized=source.replace(literal,(_,key,raw)=>{
    const value=JSON.parse(raw);
    if(Object.hasOwn(values,key)||!plain(value,350)||(key==='MAP_LINK'&&!safeMap(value)))ok=false;
    values[key]=value;return 'export const '+key+' = "<display>";';
  }).replace(healthRow,(_,prefix,raw,suffix)=>{
    healthCount++;values.health=JSON.parse(raw);if(!plain(values.health,1200))ok=false;
    return prefix+'"<health>"'+suffix;
  });
  return ok&&Object.keys(values).length===5&&healthCount===1?{normalized,values}:null;
}
const first=['leadPhotoGallery','pricingSection','firstVisitSection','heroFormSection'];
const movable=['caretakersSection','benefitsSection','conditionsSection','puppyChecker','mosaic','friendshipSection','campaignFaqSection'];
const ids={leadPhotoGallery:'lead-photo-carousel',pricingSection:'lead-pricing',firstVisitSection:'lead-first-visit',heroFormSection:'aria-hero-form',caretakersSection:'aria-caretakers',benefitsSection:'lead-benefits',conditionsSection:'lead-knowledge',puppyChecker:'aria-puppy-check',mosaic:'aria-mosaic',friendshipSection:'lead-friendship-form',campaignFaqSection:'lead-faq'};
function orderProof(source){
  if(typeof source!=='string')return null;
  const start='{isLiveLead ? <>\n          {leadPhotoGallery}',end='\n        </> : <>';
  const a=source.indexOf(start),b=source.indexOf(end,a);
  if(a<0||b<a||source.indexOf(start,a+1)>=0)return null;
  const lines=source.slice(a+start.indexOf('\n')+1,b).split('\n');
  const order=lines.map(line=>line==='          <AriaMosaicGallery paidLead />'?'mosaic':/^ {10}\{([A-Za-z]+)\}$/.exec(line)?.[1]);
  const tail=order.slice(first.length);
  if(order.slice(0,first.length).join('|')!==first.join('|')||tail.length!==movable.length||new Set(tail).size!==movable.length||!movable.every(key=>tail.includes(key))||tail.at(-1)!=='campaignFaqSection'||tail.indexOf('puppyChecker')!==tail.indexOf('conditionsSection')+1||tail.indexOf('benefitsSection')>tail.indexOf('mosaic'))return null;
  return {normalized:source.slice(0,a)+'<known paid lead section order>'+source.slice(b),order:order.map(key=>ids[key])};
}
function englishHealthProof(source){
  if(typeof source!=='string')return null;
  let count=0,value;
  const normalized=source.replace(enHealth,(_,prefix,raw)=>{count++;value=JSON.parse(raw);return prefix+'"<English health copy>"';});
  return count===1&&plain(value,1200)?{normalized,value}:null;
}
function contentFileOnly(file,before,after){
  const proof=file==='src/content/site.ts'?siteProof:file==='src/routes/test-aria.tsx'?orderProof:file==='src/components/site/Info.tsx'?englishHealthProof:null;
  if(!proof||before===after)return false;
  const a=proof(before),b=proof(after);return !!a&&!!b&&a.normalized===b.normalized;
}
function publicContentOnly(files,impact,tooling){
  const sources=files.filter(file=>CONTENT_PATHS.has(file));
  return sources.length>0&&files.every(file=>CONTENT_PATHS.has(file)||tooling.has(file))&&sources.every(file=>{
    const pair=impact?.content?.[file];return !!pair&&contentFileOnly(file,pair.before,pair.after);
  });
}
function readPublicContent(){
  const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
  const site=siteProof(read('src/content/site.ts')),order=orderProof(read('src/routes/test-aria.tsx')),en=englishHealthProof(read('src/components/site/Info.tsx'));
  if(!site||!order||!en)throw Error('Public content contract changed; update the explicit fixture before release');
  return {...site.values,order:order.order,englishHealth:en.value};
}
module.exports={CONTENT_PATHS,publicContentOnly,contentFileOnly,siteProof,orderProof,englishHealthProof,readPublicContent};
