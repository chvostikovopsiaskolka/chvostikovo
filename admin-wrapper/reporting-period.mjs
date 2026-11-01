/** Portable Bellaris reporting-period contract. No network, identity or storage. */
export const REPORTING_TIME_ZONE='Europe/Bratislava';
export function localDay(now=new Date()){
 return new Intl.DateTimeFormat('sv-SE',{timeZone:REPORTING_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
export function calendarMonth(month=localDay().slice(0,7)){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw Error('Invalid calendar month');
 const [year,m]=month.split('-').map(Number);if(year<1900||year>9998)throw Error('Unsupported year');
 const count=new Date(Date.UTC(year,m,0)).getUTCDate();
 const days=Array.from({length:count},(_,i)=>month+'-'+String(i+1).padStart(2,'0'));
 const next=new Date(Date.UTC(year,m,1)).toISOString().slice(0,10);
 return {month,start:days[0],endExclusive:next,days,label:new Intl.DateTimeFormat('sk-SK',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(month+'-01T12:00:00Z'))};
}
export function shiftMonth(month,offset){const {start}=calendarMonth(month);if(!Number.isInteger(offset))throw Error('Invalid month offset');const d=new Date(start+'T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+offset);return calendarMonth(d.toISOString().slice(0,7)).month;}
export function periodSeries(rows,{month,days,today=localDay(),event='page_view',measuredDays=[]}={}){
 const period=reportingWindow({month,days,today}),totals=new Map(),coverage=new Set(measuredDays);
 for(const row of rows){if(row.event_type!==event||!period.days.includes(row.day)||row.day>today)continue;const n=Number(row.total);if(row.total===null||row.total===''||!Number.isSafeInteger(n)||n<0)continue;totals.set(row.day,(totals.get(row.day)||0)+n);}
 return {...period,points:period.days.map(day=>day>today?{day,value:null,status:'future'}:totals.has(day)?{day,value:totals.get(day),status:'measured'}:coverage.has(day)?{day,value:0,status:'measured-zero'}:{day,value:null,status:'unavailable'})};
}

export function monthSeries(rows,options={}){return periodSeries(rows,options);}

export function reportingWindow({today=localDay(),month,days}={}){
 if(month||days===undefined)return calendarMonth(month||today.slice(0,7));
 if(![1,7,30,90,365].includes(days)||!/^\d{4}-\d{2}-\d{2}$/.test(today)||new Date(today+'T12:00:00Z').toISOString().slice(0,10)!==today)throw Error('Invalid reporting period');
 const end=Date.parse(today+'T12:00:00Z'),dates=Array.from({length:days},(_,i)=>new Date(end-(days-1-i)*86400000).toISOString().slice(0,10));
 return {month:null,start:dates[0],endExclusive:new Date(end+86400000).toISOString().slice(0,10),days:dates,label:days===1?today:dates[0]+' – '+today};
}
