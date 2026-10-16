const fs=require('fs'),crypto=require('crypto');
const hash=s=>crypto.createHash('md5').update(s).digest('hex');
const marker='/* v63: messages/dashboard update via initial load + Realtime + resume sync; no periodic polling */';
function build(){
 let h=require('zlib').gunzipSync(fs.readFileSync('supabase/backups/admin-before-v275.html.gz')).toString('utf8');
 if(hash(h)!=='66f5ff1b4ae2ac53c850200376f85a23')throw Error('Unexpected live v273 baseline');
 const old='<script id="chvo-traffic-v266">\n'+fs.readFileSync('admin/traffic-v266.js','utf8')+'\n</script>';
 if(h.split(old).length!==2||h.split(marker).length!==2)throw Error('Traffic scope anchor changed');
 h=h.replace(old,'');
 h=h.replace(marker,fs.readFileSync('admin/traffic-runtime-v275.js','utf8')+'\n'+marker);
 h=h.replace('</body>','<style id="admin-stability-v275-style">\n'+fs.readFileSync('admin/viewport-nav-v275.css','utf8')+'\n</style><script id="admin-stability-v275">\n'+fs.readFileSync('admin/viewport-nav-v275.js','utf8')+'\n</script>\n</body>');
 return h;
}
module.exports=build;
if(require.main===module){const h=build();fs.writeFileSync('../admin-v275.html',h);console.log(JSON.stringify({hash:hash(h),chars:Array.from(h).length}));}
