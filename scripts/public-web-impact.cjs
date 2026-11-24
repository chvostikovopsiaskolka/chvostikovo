const { execFileSync } = require('node:child_process');
// Fail closed: only this isolated component family may use its known consumers.
const ARIA_ROUTES = ['/psia-skolka-kosice/', '/test-aria/', '/psia-skolka-pre-steniatka/'];
const ariaSources = new Set([
  'src/routes/test-aria.tsx', 'src/routes/psia-skolka-kosice.tsx',
  'src/components/site/AriaLeadAssistant.tsx', 'src/components/site/AriaGuidedChat.tsx',
  'src/assets/aria-assistant-head-lead.webp',
]);
const plumbing = new Set([
  'scripts/check-web-runtime.cjs', 'scripts/critical-form-checks.ts',
  'scripts/mobile-dock-contract.cjs', 'scripts/public-web-impact.cjs',
  '.github/workflows/public-web-runtime.yml', 'AGENTS.md',
]);
function selectScope(files) {
  return files.some(file=>ariaSources.has(file)) &&
    files.every(file=>ariaSources.has(file)||plumbing.has(file)) ? 'aria' : 'full';
}
module.exports = { selectScope, ARIA_ROUTES };
if(require.main === module){
(async()=>{
  const [base,head]=process.argv.slice(2);
  if(![base,head].every(sha=>/^[a-f0-9]{40}$/.test(sha||'')))throw new Error('Expected exact base/head commit SHAs');
  let files,scope;
  if(process.env.GITHUB_TOKEN&&process.env.GITHUB_REPOSITORY){
    const repo=process.env.GITHUB_REPOSITORY;
    if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo))throw new Error('Invalid repository');
    const response=await fetch('https://api.github.com/repos/'+repo+'/compare/'+base+'...'+head,{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json'}});
    if(!response.ok)throw new Error('Impact compare HTTP '+response.status);
    const comparison=await response.json();
    if(!Array.isArray(comparison.files))throw new Error('Impact compare omitted changed files');
    files=comparison.files.map(file=>file.filename);
    scope=files.length>=300?'full':selectScope(files);
  }else{
    files=execFileSync('git',['diff','--name-only',base,head,'--'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
    scope=selectScope(files);
  }
  console.error('Candidate runtime scope: '+scope+' ('+files.length+' changed paths)');
  console.log('WEB_RUNTIME_SCOPE='+scope);
})().catch(error=>{console.error(error.message);process.exitCode=1;});
}
