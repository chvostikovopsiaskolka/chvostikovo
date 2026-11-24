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
  const [base,head]=process.argv.slice(2);
  if(![base,head].every(sha=>/^[a-f0-9]{40}$/.test(sha||'')))throw new Error('Expected exact base/head commit SHAs');
  const files=execFileSync('git',['diff','--name-only',base,head,'--'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
  const scope=selectScope(files);
  console.error('Candidate runtime scope: '+scope+' ('+files.length+' changed paths)');
  console.log('WEB_RUNTIME_SCOPE='+scope);
}
