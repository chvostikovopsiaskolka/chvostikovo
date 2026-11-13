import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = (p) => readFile(new URL('../../'+p,import.meta.url),'utf8');

test('Android v426 is the approved customer PWA release and local bundle is byte-identical',async()=>{
 const web=JSON.parse(await read('version.json'));
 const mobile=JSON.parse(await read('mobile/package.json'));
 const lock=JSON.parse(await read('mobile/package-lock.json'));
 const packaged=JSON.parse(await read('mobile/www/mobile-build.json'));
 assert.equal(web.build,'v426');
 assert.equal(web.version,'2.0.99');
 assert.equal(mobile.version,web.version);
 assert.equal(lock.version,web.version);
 assert.equal(lock.packages[''].version,web.version);
 assert.equal(packaged.build,web.build);
 assert.equal(packaged.version,web.version);
 assert.equal(packaged.packageId,'sk.chvostikovo.app');
 const rootApp=await read('app.js');
 const packedApp=await read('mobile/www/app.js');
 assert.equal(packedApp,rootApp,'Android local WebView uses exact reviewed PWA v426 app.js');
 assert.match(rootApp,/const APP_BUILD='v426'/);
 assert.match(rootApp,/function customerAttachNativePushV426\(\)/);
 assert.match(rootApp,/window\.customerAttachNativePushV426=customerAttachNativePushV426/);
 assert.match(rootApp,/customerAttachNativePushV426\(\);\s*init\(\)/);
 const html=await read('mobile/www/index.html');
 assert(html.indexOf('src="/native-runtime.js"')<html.indexOf('src="/app.js'),'native FCM runtime initialized before customer UI');
 assert(!html.includes('android-install-choice'),'no duplicate PWA install dialog in native app');
});

test('Native FCM bridge and account-scoped WebView notification settings remain wired',async()=>{
 const app=await read('mobile/www/app.js');
 const native=await read('mobile/src/runtime.js');
 assert.match(native,/window\.ChvoNative\s*=\s*\{/);
 assert.match(native,/attach\(value\)\s*\{\s*host\s*=\s*value;/);
 assert.match(native,/async enablePush\(\)/);
 assert.match(native,/async ensurePush\(\)/);
 assert.match(native,/async togglePush\(button\)/);
 assert.match(native,/customer-native-push/);
 for(const key of ['getSession:()=>state.session','ensureSession:()=>ensureCustomerSessionV357()','completePushPrompt:()=>completePushPromptV75()','setPush:on=>','logout(state.session)','openNativeNotificationV426']) {
   assert(app.includes(key),'Native bridge contract missing '+key);
 }
 for(const key of ['window.ChvoNative.ensurePush()','window.ChvoNative.enablePush()','window.ChvoNative.togglePush(b)','window.ChvoNative.togglePush(btn)']) {
   assert(app.includes(key),'WebView notification path must use native FCM: '+key);
 }
 assert(app.includes("params.get('recipient')!==state.session.user.id"),'reject foreign notification recipients');
 assert(app.includes('window.ChvoNative?.active||customerWebPushMigratedV397()'),'never run browser Push heal in native Android');
});
