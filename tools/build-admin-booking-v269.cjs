const fs=require('fs'),crypto=require('crypto');
function build(){let h=require('./build-admin-booking-v267.cjs')();if(crypto.createHash('md5').update(h).digest('hex')!=='6573f74a9902edc5da6d178de4243da8')throw Error('Booking baseline changed');
 const exact=(a,b)=>{if(h.split(a).length!==2)throw Error('v269 anchor changed: '+a.slice(0,70));h=h.replace(a,b)};
 const old=fs.readFileSync('admin/booking-review-v267.js','utf8'),next=fs.readFileSync('admin/booking-review-v269.js','utf8');
 exact('<script id="chvo-booking-review-v267">\n'+old+'\n</script>','');
 exact('/* v63: messages/dashboard update via initial load + Realtime + resume sync; no periodic polling */',next+'\n/* v63: messages/dashboard update via initial load + Realtime + resume sync; no periodic polling */');
 exact('<style id="chvo-booking-review-v267-style">\n'+fs.readFileSync('admin/booking-review-v267.css','utf8')+'\n</style>','<style id="chvo-booking-review-v269-style">\n'+fs.readFileSync('admin/booking-review-v269.css','utf8')+'\n</style>');
 return h;
}
module.exports=build;if(require.main===module){const h=build();fs.writeFileSync('/workspace/scratch/7d4a60d428d0/admin-v269.html',h);console.log(Array.from(h).length,crypto.createHash('md5').update(h).digest('hex'))}
