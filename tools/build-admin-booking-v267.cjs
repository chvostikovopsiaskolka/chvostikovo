const fs=require('fs'),crypto=require('crypto');
function build(){let h=require('./build-admin-traffic-v266.cjs')();if(crypto.createHash('md5').update(h).digest('hex')!=='5994fec60a130478defbfb1920af14f3')throw Error('Traffic baseline changed');
const exact=(a,b)=>{if(h.split(a).length!==2)throw Error('Booking patch anchor changed');h=h.replace(a,b)};
exact('function dashPendingHtmlV42(){','function dashPendingHtmlV42(){\n    if(window.bookingReviewV267)return window.bookingReviewV267.html();');
exact("pending:bookings.filter(x=>x.status==='pending'||x.taxi_change_status==='pending').length,","pending:window.bookingReviewV267?window.bookingReviewV267.groups(bookings).length:bookings.filter(x=>x.status==='pending'||x.taxi_change_status==='pending').length,");
exact('</body>','<style id="chvo-booking-review-v267-style">\n'+fs.readFileSync('admin/booking-review-v267.css','utf8')+'\n</style><script id="chvo-booking-review-v267">\n'+fs.readFileSync('admin/booking-review-v267.js','utf8')+'\n</script>\n</body>');return h}
module.exports=build;if(require.main===module){const h=build();fs.writeFileSync('/workspace/scratch/7d4a60d428d0/admin-v267.html',h);console.log(Array.from(h).length,crypto.createHash('md5').update(h).digest('hex'))}
