const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('app.js','utf8');
const state={data:{requests:[],booking_history:[],reservations:[]}};
const c={state,window:{},bratislavaClockV95:()=>({date:'2026-11-26'}),bookingFor:()=>false,bookingDeadlineClosedV95:()=>false,Date,Set,Map};vm.createContext(c);
vm.runInContext(src.slice(src.indexOf('  function smartShiftV199('),src.indexOf('  function ensureSmartStyleV199(')),c);
const days=['2026-11-30','2026-12-01','2026-12-02','2026-12-03','2026-12-04'].map(date=>({date,available:2,bookings_open:true}));
const dogs=[{id:1},{id:2}];
state.data.booking_history=[{dog_id:1,reservation_date:'2026-11-18',status:'attended'},{dog_id:2,reservation_date:'2026-11-18',status:'attended'},{dog_id:2,reservation_date:'2026-11-19',status:'attended'}];
const dates=()=>JSON.parse(JSON.stringify(c.compactBookingProposalV437(dogs,days)?.dates||[]));
assert.deepEqual(dates(),['2026-12-02']);
days[2].available=1;assert.deepEqual(dates(),[]);days[2].available=2;
days[2].bookings_open=false;assert.deepEqual(dates(),[]);days[2].bookings_open=true;
assert.equal(c.compactEligibleV437('2026-12-31',dogs,[{date:'2026-12-31',available:2,bookings_open:true}]),true);
assert.equal(c.compactEligibleV437('2027-01-01',dogs,[{date:'2027-01-01',available:2,bookings_open:true}]),false);
assert.equal(c.calendarMonthEndV438('2027-12-25'),'2028-01-31');assert.equal(c.calendarMonthEndV438('2028-01-01'),'2028-01-31');assert.equal(c.calendarMonthEndV438('2028-01-13',{minutes:1200}),'2028-02-29');
const rows=JSON.parse(JSON.stringify(c.calendarRowsV438(days,'2026-11-26')));assert.equal(rows.length,1);assert.equal(rows[0].month,'2026-12');assert.equal(rows[0].kind,'next');assert.equal(rows[0].days.length,5);assert.equal(rows[0].days[0].date,'2026-11-30');
assert.equal(c.compactEligibleV437('2026-12-17',dogs,[{date:'2026-12-17',available:2,bookings_open:true}]),true);
assert.match(src,/compactSeedPickerV437\(pickerDaysV393\(\),extraDate\);/);
assert.match(src,/if\(pairBookingV254\)return submitPairV254\(dates\)/);
assert.match(fs.readFileSync('supabase/functions/customer-portal-api/index.ts','utf8'),/nextWeekdays\(firstMonday, 50\)\.filter\(date => date <= endDate\)/);
console.log('PASS compact booking common history, capacity, closed, and existing horizon');

// Actual bookings are not proposals, including a partial two-dog reservation.
c.state.data.dogs=dogs;c.state.data.availability={days};c.pickerWeekEndedV442=()=>true;c.hasWeekBookingV337=()=>true;c.customerVaccinationsCompleteV96=()=>true;c.bookingFor=(id,date)=>id===1&&date==='2026-12-02'?{status:'approved'}:null;
const own=c.window.customerCompactOverviewV437().days.find(d=>d.date==='2026-12-02');assert.equal(own.ownStatus,'approved');assert.equal(own.ownCount,1);assert.equal(own.dogCount,2);assert.equal(own.selectable,false);

// The January preview is not a booking date, including during the holiday preview.
const preview=JSON.parse(JSON.stringify(c.calendarOpeningPreviewV445('2026-11-27',{minutes:900},{opening_preview:[{date:'2027-01-01',bookings_open:false},{date:'2027-01-04',bookings_open:null},{date:'2027-01-06',bookings_open:true}]})));
assert.equal(preview.length,21);assert.equal(preview[0].date,'2027-01-01');assert.equal(preview[0].opening,'closed');assert.equal(preview.find(d=>d.date==='2027-01-04').opening,'usual');assert.equal(preview.find(d=>d.date==='2027-01-06').opening,'open');assert.equal(preview.find(d=>d.date==='2027-01-07').opening,'unknown');
assert.equal(c.calendarOpeningPreviewV445('2026-12-10',{minutes:1199},{opening_preview:[]}).length,21);
assert.equal(c.calendarOpeningPreviewV445('2026-12-10',{minutes:1200},{opening_preview:[]}).length,0);
assert.equal(c.calendarOpeningPreviewV445('2026-11-27',{minutes:900},{}).length,0);
assert.equal(c.compactEligibleV437('2027-01-06',dogs,[{date:'2027-01-06',available:8,bookings_open:true}]),false);
assert.match(fs.readFileSync('supabase/functions/customer-portal-api/index.ts','utf8'),/days, opening_preview/);
