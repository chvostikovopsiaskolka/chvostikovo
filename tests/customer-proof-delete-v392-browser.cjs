const fs=require('fs'),assert=require('assert/strict');
const {chromium,webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const fixture=require('./liquid-v3-fixture.cjs');
(async()=>{const type=process.env.V3_ENGINE==='webkit'?webkit:chromium,browser=await type.launch(type===chromium?{args:['--no-sandbox']}:{});
try{for(const width of [320,390,430,844]){const {page,context,errors}=await fixture(browser,2,width,type.name());
 await page.evaluate(()=>{state.data.vaccination_proofs=[1,2].map(id=>({id,dog_id:1,storage_path:'fixture-'+id,image_url:'https://inbox.fixture/storage/proof-'+id+'.png'}));openDogDetails('vaccinations');openVaccProofEditorV244();});
 await page.locator('[data-vacc-replace="1"]').click();assert(await page.locator('#vaccProofActionsV392').isVisible());
 for(const selector of ['#vaccProofDeleteV392','#vaccProofActionsCancelV392','#vaccProofActionsV392 label']){const box=await page.locator(selector).boundingBox();assert(box.width>=44&&box.height>=44);assert(box.x>=0&&box.x+box.width<=width+1)}
 assert(await page.locator('#vaccProofEditorV244 section').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
 await page.evaluate(()=>{window.__proofKeep=document.querySelector('[data-vacc-preview="2"] img');api=async p=>({data:{proofs:state.data.vaccination_proofs.filter(row=>row.id!==p.proof_id)}})});
 page.once('dialog',dialog=>dialog.accept());await page.locator('#vaccProofDeleteV392').click();await page.waitForFunction(()=>state.data.vaccination_proofs.length===1);
 assert(await page.evaluate(()=>document.querySelector('[data-vacc-preview="2"] img')===window.__proofKeep));
 if(width===390){fs.mkdirSync('/tmp/chvo-v392-proof',{recursive:true});await page.locator('[data-vacc-replace="2"]').click();await page.screenshot({path:`/tmp/chvo-v392-proof/actions-${type.name()}.png`});}
 assert.deepEqual(errors,[]);await context.close();console.log('PASS proof actions, permanent delete response and stable thumbnail '+type.name()+' '+width);
}}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
