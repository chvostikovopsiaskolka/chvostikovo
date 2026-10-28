const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('app.js','utf8');
const days=Array.from({length:15},(_,i)=>({date:'2026-10-'+String(26+i+Math.floor(i/5)*2).padStart(2,'0')}));
// Use real calendar ISO dates across the month boundary.
for(let i=0;i<15;i++){const d=new Date('2026-10-26T12:00:00Z');d.setUTCDate(d.getUTCDate()+i+Math.floor(i/5)*2);days[i].date=d.toISOString().slice(0,10)}
let today='2026-10-28',dogs=[{id:1}],state={data:{availability:{days},visits:[],requests:[],booking_history:[]}};
const c={state,bratislavaClockV95:()=>({date:today}),pickerDogsV254:()=>dogs,window:{}};vm.createContext(c);
vm.runInContext(source.slice(source.indexOf('  function pickerDaysV393(){'),source.indexOf('  function renderPickerV37(){')),c);
const first=()=>c.window.customerPickerDaysV393()[0].date;
assert.equal(first(),'2026-10-26');state.data.requests=[{dog_id:1,reservation_date:today,status:'approved'}];state.data.booking_history=[{dog_id:1,reservation_date:today,status:'booked'}];assert.equal(first(),'2026-10-26','reservations alone never count as attendance');
state.data.visits=[{dog_id:99,visit_date:today},{dog_id:1,visit_date:'2026-10-25'},{dog_id:1,visit_date:'2026-10-29'}];assert.equal(first(),'2026-10-26','foreign, previous-week and future visits excluded');
state.data.visits.push({dog_id:1,visit_date:today});assert.equal(first(),'2026-11-02');assert.equal(c.window.customerPickerDaysV393().length,10);
dogs=[{id:2}];assert.equal(first(),'2026-10-26');dogs=[{id:1},{id:2}];assert.equal(first(),'2026-10-26','Obaja preserves the unvisited dog current week');state.data.visits.push({dog_id:2,visit_date:today});assert.equal(first(),'2026-11-02');
today='2026-11-01';assert.equal(first(),'2026-11-02','Sunday remains in the completed calendar week');today='2026-11-02';assert.equal(first(),'2026-10-26','new week does not inherit attendance');
console.log('PASS per-dog actual attendance, Obaja, booked/approved exclusion, Sunday/Monday and month rollover');
