const fs=require('node:fs'),crypto=require('node:crypto');
let html=fs.readFileSync(process.argv[2],'utf8');const changes=[];
if(crypto.createHash('md5').update(html).digest('hex')!=='2b7abd0639990f7a1c1b96fb7ad86161')throw Error('LIVE baseline changed');
function replace(a,b){if(!html.includes(a))throw Error('Missing anchor '+a.slice(0,70));changes.push([a,b]);html=html.replace(a,b)}
replace('const dogFields=isApplication\n', 'const dogFields=isApplication&&s.application_dogs?.length!==2\n');
replace('const interest=s.interest_reason\n', 'const interest=!(isApplication&&s.application_dogs?.length===2)&&s.interest_reason\n');
replace("const dogInfo=isApplication?webSubmissionCareHtml(s):'';", "const dogInfo=isApplication&&s.application_dogs?.length!==2?webSubmissionCareHtml(s):'';");
const start=html.indexOf('function badgeRow(row){'),end=html.indexOf('async function expand(id,providedRows,activeClient)',start);
if(start<0||end<0)throw Error('Missing dog renderer');
replace(html.slice(start,end),`function badgeRow(row){
 var box=mk('div','card');box.dataset.applicationDogOrder=String(row.dog_order);
 var heading=mk('h3','',row.dog_order+'. psík');heading.style.cssText='margin:0 0 8px;font-size:17px';box.append(heading);
 function field(label,value){var line=mk('div','row between history-row');line.append(mk('span','',label),mk('strong','',value==null||value===''?'—':String(value)));box.append(line)}
 function textField(label,value){var line=mk('div','history-row');line.append(mk('div','muted small',label));var text=mk('div','',value||'—');text.style.cssText='margin-top:4px;white-space:pre-wrap;overflow-wrap:anywhere';line.append(text);box.append(line)}
 field('Meno psa',row.dog_name);field('Plemeno',row.dog_breed);field('Váha',row.dog_weight_kg!=null?row.dog_weight_kg+' kg':null);
 field('Pohlavie',row.dog_sex==='male'?'Pes':row.dog_sex==='female'?'Suka':null);field('Vek',row.dog_age_text);
 field('Kastrovaný / sterilizovaná',row.dog_neutered===true?'Áno':row.dog_neutered===false?'Nie':null);
 if(row.interest_reason)textField('Ako plánuje využívať škôlku',row.interest_reason);
 textField('Alergie a zdravotné obmedzenia',row.dog_allergies);textField('Povaha a ďalšie informácie',row.dog_temperament);
 return box;
}
`);
replace("var pane=mk('div','card');\n  pane.id='webTwoDogCardV237';pane.style.cssText='border:1px solid #f9bfa2;background:#fff8f2;margin:12px 0';", "var pane=mk('div','');\n  pane.id='webTwoDogCardV237';");
replace('for(var dog of response.data)pane.append(badgeRow(dog));','for(var dog of response.data.slice().sort((a,b)=>a.dog_order-b.dog_order))pane.append(badgeRow(dog));');
replace("  pane.append(action);\n  var anchor=root.querySelector('#prefillSubmissionIntro')||root.querySelector('#followupIntroVisit');\n  if(anchor?.parentNode)anchor.parentNode.insertBefore(pane,anchor);else root.append(pane);", "  var anchor=root.querySelector('#prefillSubmissionIntro')||root.querySelector('#followupIntroVisit');\n  if(anchor?.parentNode){var actions=anchor.parentNode;actions.insertBefore(action,anchor);actions.parentNode.insertBefore(pane,actions)}else{pane.append(action);root.append(pane)}");
fs.writeFileSync(process.argv[3],html);fs.writeFileSync(process.argv[3]+'.replacements.json',JSON.stringify(changes));console.log(crypto.createHash('md5').update(html).digest('hex'));
