const { execFileSync } = require('node:child_process');
// Unknown/shared changes retain full regression. The bounded LEAD CSS region is
// recognized only when its surrounding stylesheet is byte-identical AND every
// rule stays inside its known route/chat consumers.
const ARIA_ROUTES = ['/psia-skolka-kosice/', '/test-aria/', '/psia-skolka-pre-steniatka/'];
const ariaSources = new Set([
  'src/routes/test-aria.tsx', 'src/routes/psia-skolka-kosice.tsx',
  'src/components/site/AriaLeadAssistant.tsx', 'src/components/site/AriaGuidedChat.tsx',
  'src/assets/aria-assistant-head-lead.webp',
]);
const tooling = new Set([
  'scripts/check-web-runtime.cjs', 'scripts/public-web-impact.cjs', 'scripts/public-web-impact.test.cjs',
  '.github/workflows/public-web-runtime.yml', '.github/workflows/check-form-funnel.yml',
]);
const plumbing = new Set([...tooling, 'scripts/critical-form-checks.ts', 'scripts/mobile-dock-contract.cjs', 'AGENTS.md']);
const cssStart = '/* Paid campaign content only:';
const cssEnd = '/* Keep decoration below the admission heading';
function splitSelectors(header) {
  let depth=0, part='', result=[];
  for(const char of header){
    if(char==='('||char==='[')depth++;
    if(char===')'||char===']')depth--;
    if(char===','&&depth===0){result.push(part.trim());part='';}else part+=char;
  }
  result.push(part.trim());return result;
}
function scopedLeadCss(before,after) {
  if(typeof before!=='string'||typeof after!=='string')return false;
  const section=source=>{const a=source.indexOf(cssStart),b=source.indexOf(cssEnd);return a>=0&&b>a&&source.indexOf(cssStart,a+1)<0&&source.indexOf(cssEnd,b+1)<0?{prefix:source.slice(0,a),body:source.slice(a,b),suffix:source.slice(b)}:null;};
  const old=section(before),next=section(after);
  if(!old||!next||old.prefix!==next.prefix||old.suffix!==next.suffix)return false;
  return [old.body,next.body].every(body=>{
    const css=body.replace(/\/\*[\s\S]*?\*\//g,'');
    if(/@(?!media\b|supports\b|keyframes\b)/i.test(css))return false;
    const headers=[...css.matchAll(/([^{}]+)\{/g)].map(m=>m[1].trim());
    return headers.length>0&&headers.every(h=>/^@(media|supports)\b/.test(h)||/^@keyframes aria-composing-(pulse|fade)$/.test(h)||
      /^(?:\d+(?:\.\d+)?%(?:\s*,\s*)?)+$/.test(h)||
      splitSelectors(h).every(selector=>!/[+~]/.test(selector)&&/^(?:\.lead-brand-live(?:[\s.:#\[]|$)|\[data-aria-chat-lead\](?:[\s.:#\[]|$))/.test(selector)));
  });
}
// A display-only greeting literal can change without changing any chat handlers,
// form wiring or imports. Any other TSX difference retains integration checks.
function introCopyOnly(before,after){
  if(typeof before!=='string'||typeof after!=='string')return false;
  const pattern=/^  const introText = ("(?:[^"\\\r\n]|\\.)*");$/gm;
  const old=[...before.matchAll(pattern)],next=[...after.matchAll(pattern)];
  if(old.length!==1||next.length!==1)return false;
  try{if(typeof JSON.parse(old[0][1])!=='string'||typeof JSON.parse(next[0][1])!=='string')return false;}catch{return false;}
  return before.replace(pattern,'<display greeting>')===after.replace(pattern,'<display greeting>');
}

const navMarker="/* HOME navigation and paid LEAD return control — scoped overrides. */";
const navPaths=new Set(['src/components/site/MobileDock.tsx','src/components/site/AriaLeadAssistant.tsx','src/components/site/AriaReturnToTop.tsx','src/styles.css']);
function navigationCssOnly(before,after) {
  if(typeof before!=='string'||typeof after!=='string')return false;
  const section=s=>{const i=s.indexOf(navMarker);return i<0?{prefix:s,body:''}:s.indexOf(navMarker,i+1)<0?{prefix:s.slice(0,i),body:s.slice(i+navMarker.length)}:null;};
  const old=section(before),next=section(after);
  if(!old||!next||old.prefix.trimEnd()!==next.prefix.trimEnd()||!next.body.trim())return false;
  return [old.body,next.body].every(body=>{
    const css=body.replace(/\/\*[\s\S]*?\*\//g,'');
    if(/@(?!media\b|supports\b)/i.test(css)||/\\/.test(css))return false;
    return [...css.matchAll(/([^{}]+)\{/g)].map(m=>m[1].trim()).every(h=>/^@(media|supports)\b/.test(h)||
      splitSelectors(h).every(s=>!/[+~]/.test(s)&&(/^(?:\.mobile-dock\[data-(?:home-dock|desktop-home-dock)\](?:[\s.:[\[]|$)|\.site-brand #top \[data-home-hero-photo="1"\] img$|\.lead-brand-live(?:\s+\[data-aria-back-top\]|:has\(\[data-form-dialog\], \[role="dialog"\]\[data-state="open"\]\) \[data-aria-back-top\])(?:[\s.:[\[]|$))/.test(s))));
  });
}
function homeDockOnly(before,after){
  if(typeof before!=='string'||typeof after!=='string')return false;
  // Exact responsive HOME navigation swap; no generic component exception.
  const beforeMobileSwap=after.replace("              key={id}\n              data-desktop-only-home-item={homeDock && (id === \"about\" || id === \"o-nas\") || undefined}\n              data-mobile-only-home-item={homeDock && (id === \"spaces\" || id === \"priestory\") || undefined}\n              aria-current={activeSection === id ? \"location\" : undefined}","              key={id}\n              aria-current={activeSection === id ? \"location\" : undefined}").replace("data-desktop-only-shortcut={\"desktopOnly\" in entry ? true : undefined} data-mobile-only-shortcut={\"mobileOnly\" in entry ? true : undefined} aria-current={(\"mobileOnly\" in entry || \"desktopOnly\" in entry) && href.endsWith(\"#\" + activeSection) ? \"location\" : undefined} onClick={event => go(event, href)}","data-desktop-only-shortcut={\"desktopOnly\" in entry ? true : undefined} onClick={event => go(event, href)}").replace("  const homeMenuEntries = [\n    {label:english ? \"About\" : \"O nás\", icon:Users, href:homePath+(english ? \"#about\" : \"#o-nas\"), mobileOnly:true},\n","  const homeMenuEntries = [\n").replace("       { id: \"podmienky\", label: \"Podmienky\", icon: Heart },\n       { id: \"priestory\", label: \"Priestory\", icon: House },\n       { id: \"produkty\",","       { id: \"podmienky\", label: \"Podmienky\", icon: Heart },\n       { id: \"produkty\",").replace("       { id: \"requirements\", label: \"Rules\", icon: Heart },\n       { id: \"spaces\", label: \"Facilities\", icon: House }]\n","       { id: \"requirements\", label: \"Rules\", icon: Heart }]\n");
  if(beforeMobileSwap!==after&&(beforeMobileSwap===before||beforeMobileSwap.replace("    ...(desktopHome ? [{label:english ? \"Facilities\" : \"Priestory škôlky\", icon:House, href:homePath+(english ? \"#spaces\" : \"#priestory\"), desktopOnly:true}] : []),\n",'')===before))return true;
  // One exact desktop-only destination addition; preserve every other handler and byte.
  if(after.replace("    ...(desktopHome ? [{label:english ? \"Facilities\" : \"Priestory škôlky\", icon:House, href:homePath+(english ? \"#spaces\" : \"#priestory\"), desktopOnly:true}] : []),\n",'')===before)return true;
  return after.replace("    ...(desktopHome ? [{label:english ? \"Why choose us?\" : \"Prečo si vybrať nás?\", icon:Heart, href:homePath+(english ? \"#en-benefits\" : \"#preco-chvostikovo\"), desktopOnly:true}] : []),\n",'').replace("              {homeMenuEntries.map(({href,label,icon:Icon,...entry}) => <a key={href} href={href} data-desktop-only-shortcut={\"desktopOnly\" in entry ? true : undefined} onClick={event => go(event, href)}><Icon size={17} strokeWidth={1.9} aria-hidden=\"true\" /><span>{label}</span></a>)}","              {homeMenuEntries.map(({href,label,icon:Icon}) => <a key={href} href={href} onClick={event => go(event, href)}><Icon size={17} strokeWidth={1.9} aria-hidden=\"true\" /><span>{label}</span></a>)}")===before;
}
function ariaReturnOnly(before,after){
  if(typeof before!=='string'||typeof after!=='string')return false;
  return after.replace("import { AriaReturnToTop } from \"./AriaReturnToTop\";\n",'').replace("          {leadChat && <AriaReturnToTop enabled={!hidden && !chatOpen && !panel} />}\n",'')===before;
}
function navigationOnly(files,css={}){
  return files.some(f=>navPaths.has(f))&&files.every(f=>navPaths.has(f)||plumbing.has(f))&&
    (!files.includes('src/styles.css')||navigationCssOnly(css.before,css.after))&&
    (!files.includes('src/components/site/MobileDock.tsx')||homeDockOnly(css.dockBefore,css.dockAfter))&&
    (!files.includes('src/components/site/AriaLeadAssistant.tsx')||ariaReturnOnly(css.ariaBefore,css.ariaAfter))&&
    (!files.includes('src/components/site/AriaReturnToTop.tsx')||files.includes('src/components/site/AriaLeadAssistant.tsx'));
}

function selectScope(files, css={}) {
  if(navigationOnly(files,css))return 'navigation';
  if(!files.length)return 'full';
  const scopedCss=files.includes('src/styles.css')&&scopedLeadCss(css.before,css.after);
  if(files.every(file=>tooling.has(file)||(file==='src/styles.css'&&scopedCss)||(file==='src/components/site/AriaGuidedChat.tsx'&&introCopyOnly(css.copyBefore,css.copyAfter))) &&
    (scopedCss||introCopyOnly(css.copyBefore,css.copyAfter)||files.every(file=>tooling.has(file))))return 'aria-visual';
  return files.some(file=>ariaSources.has(file))&&files.every(file=>ariaSources.has(file)||plumbing.has(file)||(file==='src/styles.css'&&scopedCss))?'aria':'full';
}
// These changes cannot alter form/consent/attribution implementations. Chat JS
// retains its browser integration suite; form/lib/route/unknown changes fail closed.
function formChecksRequired(files, css={}) {
  const presentation=new Set([...tooling,'src/styles.css','src/assets/aria-assistant-head-lead.webp']);
  return !files.length||files.some(file=>!presentation.has(file)&&!(file==='src/components/site/AriaGuidedChat.tsx'&&introCopyOnly(css.copyBefore,css.copyAfter)));
}
module.exports={selectScope,scopedLeadCss,introCopyOnly,formChecksRequired,ARIA_ROUTES,navigationCssOnly,homeDockOnly,ariaReturnOnly};
if(require.main===module){
(async()=>{
  const [base,head]=process.argv.slice(2);
  if(![base,head].every(sha=>/^[a-f0-9]{40}$/.test(sha||'')))throw new Error('Expected exact base/head commit SHAs');
  let files, css={};
  if(process.env.GITHUB_TOKEN&&process.env.GITHUB_REPOSITORY){
    const repo=process.env.GITHUB_REPOSITORY;
    if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo))throw new Error('Invalid repository');
    const headers={Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json'};
    const response=await fetch('https://api.github.com/repos/'+repo+'/compare/'+base+'...'+head,{headers});
    if(!response.ok)throw new Error('Impact compare HTTP '+response.status);
    const comparison=await response.json();
    if(!Array.isArray(comparison.files))throw new Error('Impact compare omitted changed files');
    files=comparison.files.length>=300?['unknown/truncated-comparison']:comparison.files.flatMap(file=>file.previous_filename?[file.filename,file.previous_filename]:[file.filename]);
    const read=async (path,ref)=>{const r=await fetch('https://api.github.com/repos/'+repo+'/contents/'+path+'?ref='+ref,{headers:{...headers,Accept:'application/vnd.github.raw+json'}});if(!r.ok)throw new Error('Source impact HTTP '+r.status);return r.text();};
    for(const [path,beforeKey,afterKey] of [['src/styles.css','before','after'],['src/components/site/AriaGuidedChat.tsx','copyBefore','copyAfter'],['src/components/site/MobileDock.tsx','dockBefore','dockAfter'],['src/components/site/AriaLeadAssistant.tsx','ariaBefore','ariaAfter']]){
      if(files.includes(path))[css[beforeKey],css[afterKey]]=await Promise.all([read(path,base),read(path,head)]);
    }
  }else{
    files=execFileSync('git',['diff','--name-only','--no-renames',base,head,'--'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
    for(const [path,beforeKey,afterKey] of [['src/styles.css','before','after'],['src/components/site/AriaGuidedChat.tsx','copyBefore','copyAfter'],['src/components/site/MobileDock.tsx','dockBefore','dockAfter'],['src/components/site/AriaLeadAssistant.tsx','ariaBefore','ariaAfter']]){
      if(files.includes(path))for(const [key,ref] of [[beforeKey,base],[afterKey,head]])css[key]=execFileSync('git',['show',ref+':'+path],{encoding:'utf8'});
    }
  }
  const scope=selectScope(files,css);
  console.error('Candidate runtime scope: '+scope+' ('+files.length+' changed paths)');
  console.log('WEB_RUNTIME_SCOPE='+scope);
  console.log('FORM_CHECKS_REQUIRED='+formChecksRequired(files,css));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
}
