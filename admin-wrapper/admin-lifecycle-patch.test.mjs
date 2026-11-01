import test from 'node:test';
import assert from 'node:assert/strict';
import {stabilizeAdminHtml} from './admin-lifecycle-patch.mjs';
const fixture="const monthKey=adminTodayIso().slice(0,7),month=revenueMonth(monthKey);{name:'Návštevy na permanentku',value:num(o.pass_visits)},"+'function leaveApp(){ hideAppBoot(); function closeAdminSettings(){} width:100vw!important;max-width:none!important;height:100vh!important;height:100dvh!important;min-height:100svh!important;<details id="adminSettingsPhotoV72"></details></body>';
test('guarded lifecycle closes settings, returns to existing picker without touching sessions',()=>{
 const html=stabilizeAdminHtml(fixture);assert.match(html,/leaveApp\(\)\{ closeAdminSettings\(\); hideAppBoot/);assert.match(html,/location.replace/);assert.doesNotMatch(html,/signOut|localStorage|sessionStorage|100dvh/);assert.equal((html.match(/adminSwitchWorkspace"/g)||[]).length,1);
});
test('refuses an unexpected or already patched lifecycle',()=>{assert.throws(()=>stabilizeAdminHtml('changed'));assert.throws(()=>stabilizeAdminHtml(stabilizeAdminHtml(fixture)));});
