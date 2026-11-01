import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium,webkit}=require('playwright');
const css=readFileSync('admin-wrapper/bellaris-admin.css','utf8');
const b=await (process.env.BELLARIS_BROWSER==='webkit'?webkit:chromium).launch({headless:true,...(process.platform==='win32'&&process.env.BELLARIS_BROWSER!=='webkit'?{channel:'msedge'}:{})});
for(const width of [320,390,430,844]){
 const p=await b.newPage({viewport:{width,height:width===844?390:844}});
 await p.setContent('<style>'+css+'</style><div id="bellarisDashboard"><div class="bm-scrollport"><div class="bm-shell"><main>'+('<div style="height:180px">Content</div>'.repeat(20))+'</main></div></div><nav class="bm-nav">'+['Prehľad','Záujmy','Projekty','Návštevnosť','Menu'].map(x=>'<button>'+x+'</button>').join('')+'</nav></div>');
 const nav=p.locator('.bm-nav'),initial=await nav.boundingBox();
 for(const y of [500,1500,0,3000,0]){await p.locator('.bm-scrollport').evaluate((e,y)=>e.scrollTop=y,y);const rect=await nav.boundingBox();if(Math.abs(rect.y-initial.y)>1)throw Error('nav moved');}
 const v=p.viewportSize();if(Math.abs(initial.y+initial.height-v.height)>1)throw Error('nav not at bottom');
 await p.setViewportSize({width,height:600});const rect=await nav.boundingBox();if(Math.abs(rect.y+rect.height-600)>1)throw Error('resize gap');
 console.log(width+' repeated inner scroll + viewport resize PASS');await p.close();
}
await b.close();
