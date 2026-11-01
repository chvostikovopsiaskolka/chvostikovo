import test from 'node:test';import assert from 'node:assert/strict';import {calendarMonth,shiftMonth,monthSeries,localDay} from './reporting-period.mjs';
test('calendar boundaries including leap years and year changes',()=>{for(const [m,n] of [['2026-10',31],['2026-11',30],['2027-02',28],['2028-02',29]])assert.equal(calendarMonth(m).days.length,n);assert.equal(shiftMonth('2026-12',1),'2027-01');assert.equal(shiftMonth('2026-01',-1),'2025-12');assert.throws(()=>calendarMonth('2026-13'));});
test('missing, measured zero and future are separate; no cross-month or future totals',()=>{const r=monthSeries([{day:'2026-10-31',event_type:'page_view',total:9},{day:'2026-11-01',event_type:'page_view',total:3},{day:'2026-11-06',event_type:'page_view',total:99}],{month:'2026-11',today:'2026-11-03',measuredDays:['2026-11-02']});assert.equal(r.points[0].value,3);assert.equal(r.points[1].status,'measured-zero');assert.equal(r.points[2].status,'unavailable');assert.equal(r.points[3].status,'future');assert.equal(r.points[5].value,null);});
test('Bratislava day at UTC month boundary',()=>assert.equal(localDay(new Date('2026-10-31T23:30:00Z')),'2026-11-01'));

test('one-day and seven-day windows use exclusive boundaries through month/year/leap transitions',async()=>{
 const {reportingWindow,periodSeries}=await import('./reporting-period.mjs');
 assert.deepEqual(reportingWindow({today:'2026-11-01',days:1}).days,['2026-11-01']);
 assert.equal(reportingWindow({today:'2027-01-01',days:7}).start,'2026-12-26');
 assert.equal(reportingWindow({today:'2024-03-01',days:7}).endExclusive,'2024-03-02');
 assert.equal(periodSeries([{day:'2026-11-01',event_type:'cta_click',total:2}],{today:'2026-11-01',days:1}).points[0].value,null);
 assert.throws(()=>reportingWindow({today:'2027-02-30',days:1}));assert.throws(()=>reportingWindow({today:'2026-11-01',days:14}));
});
