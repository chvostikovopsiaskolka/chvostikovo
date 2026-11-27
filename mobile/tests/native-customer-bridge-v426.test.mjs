import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = (p) => readFile(new URL('../../'+p,import.meta.url),'utf8');

test('Android v444 bundles current booking calendar, poll UI and native FCM byte-identically',async()=>{
 const web=JSON.parse(await read('version.json'));
 const mobile=JSON.parse(await read('mobile/package.json'));
 const lock=JSON.parse(await read('mobile/package-lock.json'));
 const packaged=JSON.parse(await read('mobile/www/mobile-build.json'));
 assert.equal(web.build,'v444');
 assert.equal(web.version,'2.0.117');
 assert.equal(mobile.version,web.version);
 assert.equal(lock.version,web.version);
 assert.equal(lock.packages[''].version,web.version);
 assert.equal(packaged.build,web.build);
 assert.equal(packaged.version,web.version);
 assert.equal(packaged.packageId,'sk.chvostikovo.app');
 const rootApp=await read('app.js');
 const packedApp=await read('mobile/www/app.js');
 assert.equal(packedApp,rootApp,'Android local WebView uses exact reviewed PWA v444 app.js');
 assert.match(rootApp,/const APP_BUILD='v444'/);
 assert.match(rootApp,/function customerAttachNativePushV426\(\)/);
 assert.match(rootApp,/window\.customerAttachNativePushV426=customerAttachNativePushV426/);
 assert.match(rootApp,/customerAttachNativePushV426\(\);/);
 const html=await read('mobile/www/index.html');
 assert(html.indexOf('id="forgotPasswordBtn"')<html.indexOf('type="submit">Prihlásiť sa'),'signed Android v444 must place small password reset link above login CTA');
 assert(rootApp.includes('window.openCustomerInstallGuideV431=openGuide;'),'no auth install help injection');
 assert(!rootApp.includes('login.appendChild(b)'),'native auth never mounts install CTA');
 assert(html.includes('utm_source=chvostikovo_app&amp;utm_medium=referral&amp;utm_campaign=eshop&amp;utm_content=bottom_nav'),'Android webview E-shop link must keep first-party UTM');
 const packedPoll=await read('mobile/www/customer-polls-pilot-v432.js');
 const rootPoll=await read('customer-polls-pilot-v432.js');
 assert.equal(packedPoll,rootPoll,'Android v444 bundle must include exact server-backed poll JavaScript');
 assert.match(rootPoll,/customer-menu-compact-v436/,'new standard compact Menu must be in Android');
 assert.match(rootPoll,/menu\.querySelector\('\.customer-social-v223'\)\?\.before\(box\)/,'poll card sits before social links');
 assert.match(rootPoll,/afterSwitchTab/,'new polls refresh when Menu is opened');

 assert.match(packedPoll,/pollPlus|data-poll-plus/,'quantity stepper is bundled');
 assert.match(packedPoll,/portal_poll_votes_v433/,'server-backed voting write is bundled');
 assert(html.includes('/customer-polls-pilot-v432.js?v=v444'),'WebView loads v444 poll JavaScript');
 assert(html.includes('/customer-polls-pilot-v432.css?v=v444'),'WebView loads v444 poll styling');
 const rootCss=await read('customer-polls-pilot-v432.css');
 const packedCss=await read('mobile/www/customer-polls-pilot-v432.css');
 assert.equal(packedCss,rootCss,'Android local WebView packages current v444 voting styles');
 assert.match(rootCss,/\.customer-menu-compact-v436 #menuTab/,'compact liquid Menu design must be packed');

 const rule=selector=>rootCss.split(selector+'{')[1]?.split('}')[0]||'';
 assert(rule('.customer-poll-stepper-v434').includes('border:0!important'),'whole quantity stepper should have no outer outline');
 assert(rule('.customer-poll-stepper-v434 button').includes('border:1px solid #e8c6b2!important'),'each plus and minus button should have its own outline');
 assert(rule('.customer-poll-quantity-value-v434').includes('border:0!important'),'quantity number remains unboxed');

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

 test('v444 Android packages the exact monthly booking calendar and weekly cards',async()=>{
 for(const path of ['customer-design.js','customer-design.css','app.js','version.json'])assert.equal(await read('mobile/www/'+path),await read(path),'exact packaged '+path);
 const app=await read('mobile/www/app.js'),css=await read('mobile/www/customer-design.css'),design=await read('mobile/www/customer-design.js'),html=await read('mobile/www/index.html');
 assert.match(app,/calendarRowsV438/);assert(app.includes('${calendarWeekLettersV438()}'));assert(css.includes('v444: stronger current destination'));assert(css.includes('calendar-count-hidden-v439'));assert(css.includes('#ff7416'));assert(css.includes('#247646'));assert(design.includes('calendarCapacityLevelV439'));assert(html.includes('/customer-design.css?v=v444'));assert(html.includes('/app.js?v=v444'));
 });
