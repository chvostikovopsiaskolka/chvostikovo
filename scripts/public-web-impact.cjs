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
function selectScope(files, css={}) {
  if(!files.length)return 'full';
  const scopedCss=files.includes('src/styles.css')&&scopedLeadCss(css.before,css.after);
  if(files.every(file=>tooling.has(file)||(file==='src/styles.css'&&scopedCss)) &&
    (scopedCss||files.every(file=>tooling.has(file))))return 'aria-visual';
  return files.some(file=>ariaSources.has(file))&&files.every(file=>ariaSources.has(file)||plumbing.has(file)||(file==='src/styles.css'&&scopedCss))?'aria':'full';
}
// These changes cannot alter form/consent/attribution implementations. Chat JS
// retains its browser integration suite; form/lib/route/unknown changes fail closed.
function formChecksRequired(files) {
  const presentation=new Set([...tooling,'src/styles.css','src/assets/aria-assistant-head-lead.webp']);
  return !files.length||files.some(file=>!presentation.has(file));
}
module.exports={selectScope,scopedLeadCss,formChecksRequired,ARIA_ROUTES};
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
    if(files.includes('src/styles.css')){
      const read=async ref=>{const r=await fetch('https://api.github.com/repos/'+repo+'/contents/src/styles.css?ref='+ref,{headers:{...headers,Accept:'application/vnd.github.raw+json'}});if(!r.ok)throw new Error('CSS impact HTTP '+r.status);return r.text();};
      [css.before,css.after]=await Promise.all([read(base),read(head)]);
    }
  }else{
    files=execFileSync('git',['diff','--name-only','--no-renames',base,head,'--'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
    if(files.includes('src/styles.css'))for(const [key,ref]of [['before',base],['after',head]])css[key]=execFileSync('git',['show',ref+':src/styles.css'],{encoding:'utf8'});
  }
  const scope=selectScope(files,css);
  console.error('Candidate runtime scope: '+scope+' ('+files.length+' changed paths)');
  console.log('WEB_RUNTIME_SCOPE='+scope);
  console.log('FORM_CHECKS_REQUIRED='+formChecksRequired(files));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
}
