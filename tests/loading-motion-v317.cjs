const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{JSDOM}=require('./shared-v244/node_modules/jsdom');
async function scenario(agent){
 const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:'outside-only',pretendToBeVisual:true,url:'https://loading.fixture'}),w=dom.window;
 Object.defineProperty(w.navigator,'userAgent',{value:agent});let next=1,queue=new Map(),change;const reduced={matches:false,addEventListener:(type,fn)=>change=fn};
 w.matchMedia=()=>reduced;w.requestAnimationFrame=fn=>{const id=next++;queue.set(id,fn);return id};w.cancelAnimationFrame=id=>queue.delete(id);
 const advance=time=>{const tasks=[...queue.values()];queue.clear();tasks.forEach(fn=>fn(time))};
 new vm.Script(fs.readFileSync('loading-motion.js','utf8')).runInContext(dom.getInternalVMContext());
 try{
  const paw=w.document.querySelector('.concept-paw'),ring=w.document.querySelector('.concept-ring-arc'),loading=w.document.getElementById('loading');assert(paw);assert.equal(paw.querySelector('svg').getAttribute('viewBox'),'0 0 64 64');assert.equal(paw.querySelector('use').getAttribute('transform'),'translate(-1 2.5)');
  advance(16);assert.equal(paw.style.transform,'scale(1)');let values=[];
  for(let t=32;t<=2304;t+=16){advance(t);values.push(Number(paw.style.transform.match(/scale\((.+)\)/)[1]))}
  assert(Math.max(...values)>1.054&&Math.max(...values)<=1.055001);assert(values.at(-1)<1.002);assert(Number(ring.style.strokeDashoffset)<0);assert(!paw.style.transform.includes('translate'));
  reduced.matches=true;change();advance(2320);assert.equal(paw.style.transform,'scale(1)');
  loading.classList.add('hidden');await Promise.resolve();advance(2336);assert.equal(queue.size,0,'hidden loader stops animation frames');
  loading.classList.remove('hidden');await Promise.resolve();assert.equal(queue.size,1);advance(9000);assert.equal(paw.style.transform,'scale(1)');
  reduced.matches=false;change();advance(9016);assert(Number(paw.style.transform.match(/scale\((.+)\)/)[1])>=1);
 }finally{w.close()}
}
(async()=>{await scenario('Mozilla/5.0 (Linux; Android 14) Chrome/130');await scenario('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15');console.log('PASS loader frame lifecycle: smooth full breathing cycle, centred stable HTML box, arc motion, reduced-motion, hide/resume for iOS/Android user agents. Physical rendering unobserved.');})().catch(e=>{console.error(e);process.exitCode=1});
