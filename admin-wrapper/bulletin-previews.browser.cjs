const assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const {runtime}=require('./bulletin-previews.test.cjs');
(async()=>{const engine=process.env.V3_ENGINE==='webkit'?webkit:chromium,browser=await engine.launch(engine===chromium?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}:{});
try{const page=await browser.newPage();await page.goto('about:blank');
const result=await page.evaluate(async runtime=>{
 const stored=[],privateReads=[];let failPreview=false,encodingSupported=true;
 const storeFile=async(file,bucket,path)=>{if(failPreview&&path.endsWith('.preview-v423.webp'))throw Error('Synthetic preview failure');stored.push({file,bucket,path});return {error:null}};
 const img=async path=>{privateReads.push(path);return path.endsWith('.preview-v423.webp')?null:'blob:original'};
 const api=Function('storeFile','img',runtime+';return bulletinPreviewV423;')(storeFile,img);
 const canvas=document.createElement('canvas');canvas.width=2400;canvas.height=1600;
 const c=canvas.getContext('2d'),gradient=c.createLinearGradient(0,0,2400,1600);gradient.addColorStop(0,'#472d62');gradient.addColorStop(1,'#ffa439');c.fillStyle=gradient;c.fillRect(0,0,2400,1600);
 for(let i=0;i<2400;i+=13){c.fillStyle=`rgba(25,80,60,${(i%100)/100})`;c.fillRect(i,0,7,1600)}
 const file=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
 const original=new Uint8Array(await file.arrayBuffer()),preview=await api.create(file);
 encodingSupported=!!preview;
 if(preview){const bitmap=await createImageBitmap(preview);if(bitmap.width>640)throw Error('oversized preview');bitmap.close();}
 const path=await api.upload(file,'private-drafts','synthetic');
 const full=stored.find(item=>item.path===path);if(full.file!==file)throw Error('Original was re-encoded');
 if(new Uint8Array(await full.file.arrayBuffer()).some((b,i)=>b!==original[i]))throw Error('Original bytes changed');
 const optimizedPath=path;
 stored.length=0;failPreview=true;const fallbackPath=await api.upload(file,'private-drafts','synthetic');
 if(fallbackPath.includes('.with-preview-v423.'))throw Error('Failed preview must not be advertised');
 if(stored.length!==1||stored[0].file!==file)throw Error('Fallback upload lost original');
 const getContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=()=>null;
 const unsupported=await api.create(file);HTMLCanvasElement.prototype.getContext=getContext;if(unsupported!==null)throw Error('Unsupported fallback');
 if(await api.small(optimizedPath)!=='blob:original')throw Error('Missing preview fallback');
 await api.small(optimizedPath);
 return {originalBytes:file.size,previewBytes:preview?.size||null,encodingSupported,storedBuckets:stored.map(x=>x.bucket),privateReads,optimizedPath,fallbackPath};
},runtime);
assert.deepEqual(result.storedBuckets,['private-drafts']);
if(result.encodingSupported){assert(result.previewBytes<result.originalBytes);assert.match(result.optimizedPath,/with-preview-v423\.png$/);assert.equal(result.privateReads.filter(p=>p.endsWith('.preview-v423.webp')).length,1,'missing preview is not fetched repeatedly');}
console.log('PASS '+engine.name()+' synthetic image, original byte identity, private bucket, encoding/upload/missing-preview fallbacks '+JSON.stringify(result));
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
