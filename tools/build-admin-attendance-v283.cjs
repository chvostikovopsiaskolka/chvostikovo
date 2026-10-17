const fs=require('fs'),crypto=require('crypto'),path=require('path');
module.exports=function build(html){
if(crypto.createHash('md5').update(html).digest('hex')!=='e598134cb674e673e06c5daf61c1e94a')throw Error('Live admin baseline changed; inspect before applying');
const old="document.addEventListener('click',e=>{const tab=e.target.closest('#bottomNav [data-tab]');if(tab){if(tab.dataset.tab==='stats')";
const next="document.addEventListener('click',e=>{if(e.target.closest('#menuStatsCardV1')){activeStats='visits';setTimeout(()=>showStats('visits'),0)}const tab=e.target.closest('#bottomNav [data-tab]');if(tab){if(tab.dataset.tab==='stats')";
if(html.split(old).length!==2)throw Error('Stats anchor changed');
html=html.replace(old,next);
const marker='/* v63: messages/dashboard update via initial load + Realtime + resume sync; no periodic polling */';
if(html.split(marker).length!==2)throw Error('Scope anchor changed');
return html.replace(marker,fs.readFileSync(path.join(__dirname,'../admin/attendance-guard-v283.js'),'utf8')+'\n'+marker);
};
if(require.main===module)process.stdout.write(module.exports(fs.readFileSync(process.argv[2],'utf8')));
