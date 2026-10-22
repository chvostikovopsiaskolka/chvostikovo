import { SpanStatusCode } from '@opentelemetry/api';
import { TracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace';

// Only these attributes leave the browser. Never pass exception messages, bodies,
// headers, full URLs, console output, DOM text, account IDs or form values here.
const types=new Set(['Error','TypeError','ReferenceError','SyntaxError','RangeError','URIError','EvalError','AggregateError','NetworkError','TimeoutError']);
const files=new Set(['app.js','customer-design.js','dual-dog-overview-v246.js','back-swipe.js','loading-motion.js','telemetry-v345.js']);
const surfaces=new Set(['overview','reservations','menu','vaccinations','dog-details','messages','other']);
const categories=new Set(['javascript.error','promise.error','request.error','request.slow','operation.error']);
const attr=(key,value)=>({key,value:{stringValue:String(value)}});
const actions=new Set(['save_profile','save_dog','upload_vaccination_proofs','upload_dog_photo','delete_dog_photo','set_photo_visibility','request_new_pass','request_late_booking','shared_booking_v257','request_dogs_bookings','request_bookings','request_booking','cancel_booking','request_taxi_change','send_message']);
function environment(){
 const ua=navigator.userAgent||'';
 const match=ua.match(/(SamsungBrowser|Firefox|Edg|Chrome|Version)\/(\d+)/);
 return {browser:match?({SamsungBrowser:'Samsung',Firefox:'Firefox',Edg:'Edge',Chrome:'Chrome',Version:'Safari'}[match[1]]+'/'+match[2]):'Other',platform:/Android/.test(ua)?'Android':/iPhone|iPad|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)?'iOS':'desktop'};
}
function sourceLocation(error,event){
 let file='unknown',line=0,column=0;
 try{
  if(event?.filename){const u=new URL(event.filename,location.href),base=u.pathname.split('/').pop();if(files.has(base)&&u.origin===location.origin)file=base;else if(u.origin===location.origin&&u.pathname.endsWith('/chvostikovo-frontend'))file='admin-inline';line=event.lineno;column=event.colno;}
  else if(error instanceof Error){const m=String(error.stack||'').match(/(app\.js|customer-design\.js|dual-dog-overview-v246\.js|chvostikovo-frontend)(?:\?[^\s:)]*)?:(\d+):(\d+)/);if(m){file=m[1]==='chvostikovo-frontend'?'admin-inline':m[1];line=m[2];column=m[3];}}
 }catch(_){}
 return {'code.file':file,'code.line':Math.min(1000000,Math.max(0,Number(line)||0)),'code.column':Math.min(1000000,Math.max(0,Number(column)||0))};
}
function routeName(input,base){
 try{const u=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.href);
 if(u.origin!==base||/\/auth\/|portal_telemetry_/.test(u.pathname))return null;
 const rpc=u.pathname.match(/^\/rest\/v1\/rpc\/([a-z][a-z0-9_]{0,79})$/);if(rpc)return 'rpc/'+rpc[1];
 const db=u.pathname.match(/^\/rest\/v1\/([a-z][a-z0-9_]{0,79})$/);if(db)return 'db/'+db[1];
 if(u.pathname.startsWith('/storage/v1/'))return 'storage';
 const edge=u.pathname.match(/^\/functions\/v1\/([a-z][a-z0-9-]{0,79})$/);if(edge)return 'edge/'+edge[1];
 }catch(_){}return null;
}
function init(config){
 if(window.ChvoTelemetry.active||!['customer','admin'].includes(config.app)||typeof config.getToken!=='function')return;
 const nativeFetch=window.fetch.bind(window),env=environment(),seen=new Map();let recorded=0,windowAt=Date.now(),disabled=false;
 const exporter={
  export(spans,done){
   void (async()=>{try{
    if(disabled)return;const token=await config.getToken();if(!token)return;
    const payload={resourceSpans:[{resource:{attributes:[attr('service.name','chvostikovo-'+config.app),attr('service.version',config.build),attr('browser',env.browser),attr('platform',env.platform)]},scopeSpans:[{scope:{name:'chvostikovo.errors',version:'345'},spans:spans.map(s=>({traceId:s.spanContext().traceId,spanId:s.spanContext().spanId,name:s.name,kind:1,startTimeUnixNano:String(BigInt(s.startTime[0])*1000000000n+BigInt(s.startTime[1])),endTimeUnixNano:String(BigInt(s.endTime[0])*1000000000n+BigInt(s.endTime[1])),status:{code:s.status.code},attributes:Object.entries(s.attributes).map(([k,v])=>attr(k,v))}))}]}]};
    await nativeFetch(config.base+'/rest/v1/rpc/portal_telemetry_ingest_v345',{method:'POST',headers:{apikey:config.key,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({p_payload:payload}),keepalive:true,signal:AbortSignal.timeout(5000)});
   }catch(_){}finally{done({code:0});}})();
  },shutdown:async()=>{}
 };
 const provider=new TracerProvider({spanProcessors:[new BatchSpanProcessor({exporter,maxQueueSize:40,maxExportBatchSize:5,scheduledDelayMillis:10000,exportTimeoutMillis:6000,disableAutoFlushOnDocumentHide:true})]});
 const tracer=provider.getTracer('chvostikovo.errors','345');
 function capture(category,details={}){
  try{
   if(disabled||!categories.has(category))return;
   const now=Date.now();if(now-windowAt>600000){recorded=0;windowAt=now;seen.clear();}if(recorded>=40)return;
   const operation=actions.has(details.action)?'action/'+details.action:typeof details.operation==='string'&&/^(rpc\/[a-z][a-z0-9_]{0,79}|db\/[a-z][a-z0-9_]{0,79}|edge\/[a-z][a-z0-9-]{0,79}|storage|javascript|customer-operation)$/.test(details.operation)?details.operation:'javascript';
   const source=sourceLocation(details.error,details.event),status=Math.min(599,Math.max(0,Number(details.status)||0));
   const key=[category,operation,status,source['code.file'],source['code.line']].join(':');if(now-(seen.get(key)||0)<60000)return;seen.set(key,now);recorded++;
   const type=types.has(details.error?.name)?details.error.name:'Error';
   const surface=config.getSurface?.(),attributes={category,operation,surface:surfaces.has(surface)?surface:'other','exception.type':type,'http.status':status,'duration.ms':Math.min(300000,Math.max(0,Math.round(Number(details.duration)||0))),...source};
   const span=tracer.startSpan(category,{attributes});span.setStatus({code:category==='request.slow'?SpanStatusCode.UNSET:SpanStatusCode.ERROR});span.end();
  }catch(_){}
 }
 window.addEventListener('error',event=>{if(event instanceof ErrorEvent)capture('javascript.error',{error:event.error,event});});
 window.addEventListener('unhandledrejection',event=>{if(event.reason?.name!=='AbortError')capture('promise.error',{error:event.reason});});
 window.fetch=function(input,options){
  const operation=routeName(input,config.base);if(!operation)return nativeFetch(input,options);
  const started=performance.now();return nativeFetch(input,options).then(response=>{
   const duration=performance.now()-started;if(response.status>=400)capture('request.error',{operation,status:response.status,duration});else if(duration>=10000)capture('request.slow',{operation,status:response.status,duration});return response;
  },error=>{if(error?.name!=='AbortError')capture('request.error',{operation,error,duration:performance.now()-started});throw error;});
 };
 const flush=()=>provider.forceFlush().catch(()=>{});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')void flush();});
 window.addEventListener('pagehide',()=>{void flush();});
 Object.assign(window.ChvoTelemetry,{active:true,capture,flush,disable(){disabled=true;seen.clear();void provider.shutdown().catch(()=>{});}});
}
window.ChvoTelemetry=window.ChvoTelemetry||{init,active:false};
