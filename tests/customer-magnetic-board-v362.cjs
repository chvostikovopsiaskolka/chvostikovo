const fs=require('node:fs'),assert=require('node:assert/strict');
const css=fs.readFileSync('customer-design.css','utf8');
const html=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('app.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const ver=JSON.parse(fs.readFileSync('version.json','utf8'));
const magnetic=css.split('/* v362: customer bulletin becomes a light magnetic board')[1];
assert(magnetic,'new scoped design must be appended after legacy styling');
for(const selector of ['#customerBulletinV229','.customer-bulletin-note-v229::before','.customer-bulletin-note-v229[data-style="cream"]::before','.customer-bulletin-empty-v229','#bookingGradebook','.dual-dog-grades-v254'])
 assert(magnetic.includes(selector), 'scoped '+selector);
assert(magnetic.includes('content:none!important;display:none!important'), 'screws removed');
assert(magnetic.includes('background:radial-gradient(circle'), 'magnet is rendered with CSS, no extra network fetch');
assert(magnetic.includes('font-size:12px!important'), 'smaller gradebook label');
assert(!html.includes('id="customerBulletinV229"') && html.includes('id="customerInboxV363"') && html.includes('id="bookingGradebook"'), 'v363 replaces visual board while preserving the gradebook');
assert(/^v[0-9]+$/.test(ver.build) && Number(ver.build.slice(1))>=362,'magnetic board design exists since v362');
assert(html.includes('customer-design.css?v='+ver.build));
assert(app.includes("const APP_BUILD='"+ver.build+"'")&&app.includes("const APP_VERSION='"+ver.version+"'"));
assert(sw.includes('shell-'+ver.build));
console.log('PASS v362 magnetic notice board, preserved labels/interactions and release cache');
