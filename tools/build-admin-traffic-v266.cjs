const fs=require('fs'),crypto=require('crypto');
function build(){let h=require('./build-admin-crm-v263.cjs')();const before=crypto.createHash('md5').update(h).digest('hex');if(before!=='e0cd8f3987a9b90bc17032e3a39c5484')throw Error('Unexpected baseline');
const old="supabase.rpc('admin_marketing_dashboard',";if(h.split(old).length!==3)throw Error('Dashboard call anchors changed');h=h.split(old).join("supabase.rpc('admin_traffic_dashboard_v266',");
h=h.replace('<h2>Kampane</h2>','<h2>Návštevnosť</h2>').replace('<span>Kampane</span>','<span>Návštevnosť</span>').replace('aria-label="Kampane"','aria-label="Návštevnosť"');
h=h.replace('p_from:cmShiftV71(day,-1),p_to:day','p_from:cmShiftV71(day,-7),p_to:day');
h=h.replace('</body>','<style id="chvo-traffic-v266-style">\n'+fs.readFileSync('admin/traffic-v266.css','utf8')+'\n</style><script id="chvo-traffic-v266">\n'+fs.readFileSync('admin/traffic-v266.js','utf8')+'\n</script>\n</body>');return h}
module.exports=build;if(require.main===module){const h=build();fs.writeFileSync('/workspace/scratch/7d4a60d428d0/admin-v266.html',h);console.log(Array.from(h).length,crypto.createHash('md5').update(h).digest('hex'))}
