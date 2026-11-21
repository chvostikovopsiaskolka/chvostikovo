import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = (p) => readFile(new URL('../../'+p,import.meta.url),'utf8');

test('Android v434 bundles current poll UI and native FCM byte-identically',async()=>{
 const web=JSON.parse(await read('version.json'));
 const mobile=JSON.parse(await read('mobile/package.json'));
 const lock=JSON.parse(await read('mobile/package-lock.json'));
 const packaged=JSON.parse(await read('mobile/www/mobile-build.json'));
 assert.equal(web.build,'v434');
 assert.equal(web.version,'2.0.107');
 assert.equal(mobile.version,web.version);
 assert.equal(lock.version,web.version);
 assert.equal(lock.packages[''].version,web.version);
 assert.equal(packaged.build,web.build);
 assert.equal(packaged.version,web.version);
 assert.equal(packaged.packageId,'sk.chvostikovo.app');
 const rootApp=await read('app.js');
 const packedApp=await read('mobile/www/app.js');
 assert.equal(packedApp,rootApp,'Android local WebView uses exact reviewed PWA v434 app.js');
 assert.match(rootApp,/const APP_BUILD='v434'/);
 assert.match(rootApp,/function customerAttachNativePushV426\(\)/);
 assert.match(rootApp,/window\.customerAttachNativePushV426=customerAttachNativePushV426/);
 assert.match(rootApp,/customerAttachNativePushV426\(\);\s*init\(\)/);
 const html=await read('mobile/www/index.html');
 assert(html.indexOf('id="forgotPasswordBtn"')<html.indexOf('type="submit">Prihlásiť sa'),'signed Android v434 must place small password reset link above login CTA');
 assert(rootApp.includes('window.openCustomerInstallGuideV431=openGuide;'),'no auth install help injection');
 assert(!rootApp.includes('login.appendChild(b)'),'native auth never mounts install CTA');
 assert(html.includes('utm_source=chvostikovo_app&amp;utm_medium=referral&amp;utm_campaign=eshop&amp;utm_content=bottom_nav'),'Android webview E-shop link must keep first-party UTM');
 const packedPoll=await read('mobile/www/customer-polls-pilot-v432.js');
 const rootPoll=await read('customer-polls-pilot-v432.js');
 assert.equal(packedPoll,rootPoll,'Android v434 bundle must include exact server-backed poll JavaScript');
 assert.match(packedPoll,/pollPlus|data-poll-plus/,'quantity stepper is bundled');
 assert.match(packedPoll,/portal_poll_votes_v433/,'server-backed voting write is bundled');
 assert(html.includes('/customer-polls-pilot-v432.js?v=v434'),'WebView loads v434 poll JavaScript');
 assert(html.includes('/customer-polls-pilot-v432.css?v=v434'),'WebView loads v434 poll styling');
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
