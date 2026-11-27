const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('app.js','utf8');
const days=Array.from({length:15},(_,i)=>({date:'2026-10-'+String(26+i+Math.floor(i/5)*2).padStart(2,'0')}));
// Use real calendar ISO dates across the month boundary.
for(let i=0;i<15;i++){const d=new Date('2026-10-26T12:00:00Z');d.setUTCDate(d.getUTCDate()+i+Math.floor(i/5)*2);days[i].date=d.toISOString().slice(0,10)}
let today='2026-10-28',minutes=600,dogs=[{id:1}],state={data:{availability:{days},visits:[],requests:[],booking_history:[]}};
const c={state,bratislavaClockV95:()=>({date:today,minutes}),pickerDogsV254:()=>dogs,window:{}};vm.createContext(c);
const slice=(from,to)=>{const a=source.indexOf(from),b=source.indexOf(to,a);assert(a>=0&&b>a,'production helper boundaries');return source.slice(a,b);};
vm.runInContext(slice('  function smartShiftV199(','  function smartProposalV199(')+slice('  function calendarMonthEndV438(','  function calendarRowsV438(')+slice('  function pickerWeekLabelV393(date){','  let pickerCutoffTimerV442='),c);
const pickerDays=()=>vm.runInContext('pickerDaysV393()',c);
const first=()=>pickerDays()[0]?.date;
assert.equal(first(),'2026-10-26');assert.equal(pickerDays().length,15,'three weeks are visible when availability returns 15 days');state.data.requests=[{dog_id:1,reservation_date:today,status:'approved'}];state.data.booking_history=[{dog_id:1,reservation_date:today,status:'booked'}];assert.equal(first(),'2026-10-26','reservations alone never count as attendance');
state.data.visits=[{dog_id:99,visit_date:today},{dog_id:1,visit_date:'2026-10-25'},{dog_id:1,visit_date:'2026-10-29'}];assert.equal(first(),'2026-10-26','foreign, previous-week and future visits excluded');
state.data.visits.push({dog_id:1,visit_date:today});assert.equal(first(),'2026-11-02');assert.equal(pickerDays().length,10);
dogs=[{id:2}];assert.equal(first(),'2026-10-26');dogs=[{id:1},{id:2}];assert.equal(first(),'2026-10-26','Obaja preserves the unvisited dog current week');state.data.visits.push({dog_id:2,visit_date:today});assert.equal(first(),'2026-11-02');
today='2026-11-01';assert.equal(first(),'2026-11-02','Sunday remains in the completed calendar week');today='2026-11-02';assert.equal(first(),'2026-11-02','new week excludes stale earlier availability and does not inherit attendance');
today='2026-10-28';assert.equal(c.pickerWeekLabelV393('2026-10-26'),'Tento týždeň');assert.equal(c.pickerWeekLabelV393('2026-11-02'),'Budúci týždeň');assert.equal(c.pickerWeekLabelV393('2026-11-09'),'O dva týždne');assert.equal(c.pickerWeekLabelV393('2026-11-16'),'O tri týždne');
console.log('PASS per-dog actual attendance, Obaja, booked/approved exclusion, Sunday/Monday and month rollover');

state.data.visits=[];today='2026-10-29';minutes=1199;assert.equal(first(),'2026-10-26');minutes=1200;assert.equal(first(),'2026-11-02');
state.data.availability.days=days.filter(d=>d.date!=='2026-10-27');assert.equal(first(),'2026-11-02','sparse data cannot skip next-week dates');
const horizon=(d,m)=>c.calendarMonthEndV438(d,{date:d,minutes:m});
assert.equal(horizon('2026-12-01',600),'2026-12-31');assert.equal(horizon('2026-12-10',1199),'2026-12-31');assert.equal(horizon('2026-12-10',1200),'2027-01-31');assert.equal(horizon('2027-01-07',1200),'2027-01-31');assert.equal(horizon('2027-01-14',1200),'2027-02-28');
console.log('PASS Thursday cutoff, sparse availability, month unlock and year rollover');
