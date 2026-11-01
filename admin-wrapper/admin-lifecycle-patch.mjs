import {createHash} from 'node:crypto';
// Pure guarded transform of the approved stable admin. Never reads/writes operational data.
export function stabilizeAdminHtml(source){
 if(!source.includes('function leaveApp(){ hideAppBoot();')||!source.includes('function closeAdminSettings()'))throw Error('Unknown admin lifecycle; rebase before applying');
 let html=source.replace('content="v402"','content="v403"');
 html=html.replace('function leaveApp(){ hideAppBoot();','function leaveApp(){ closeAdminSettings(); hideAppBoot();');
 const loader='width:100vw!important;max-width:none!important;height:100vh!important;height:100dvh!important;min-height:100svh!important;';
 if(!html.includes(loader))throw Error('Unknown loader layout');
 html=html.replace(loader,'width:auto!important;max-width:none!important;height:auto!important;min-height:0!important;');
 const bootRoot='html:has(#appBoot),body:has(#appBoot){background:#fff!important}';
 html=html.replace(bootRoot,'html:has(#appBoot:not(.hidden)),body:has(#appBoot:not(.hidden)){background:#fffaf5!important}');
 // Report month must follow the selected archived week, never the device's current month.
 const currentMonth="const monthKey=adminTodayIso().slice(0,7),month=revenueMonth(monthKey);";
 if(!html.includes(currentMonth))throw Error('Unknown school report month source');
 html=html.replace(currentMonth,"const monthKey=active.week_start.slice(0,7),month=revenueMonth(monthKey);");
 const passCard="{name:'Návštevy na permanentku',value:num(o.pass_visits)},";
 if(!html.includes(passCard))throw Error('Unknown visit breakdown');
 html=html.replace(passCard,passCard+"\n  {name:'Bezplatné návštevy',value:num(o.free_visits)},");
 html=html.replace("{name:'Tržba za týždeň',value:schoolMoneyV307(o.confirmed_revenue_eur)},","{name:'Potvrdené úhrady za týždeň',value:schoolMoneyV307(o.confirmed_revenue_eur),small:o.confirmed_revenue_eur==null?'Evidencia potvrdených úhrad je neúplná. Návštevy ani evidovaný predaj nie sú potvrdením platby.':''},");
 // Do not present legacy count × current price as confirmed income.
 html=html.replace("{name:'Tržba celkovo za mesiac',value:month.hasData?schoolMoneyV307(month.total):'—',small:month.hasData?monthFull(monthKey):''}","{name:'Potvrdené úhrady za mesiac',value:'—',small:monthFull(monthKey)+' · Mesačné potvrdené úhrady zatiaľ nie sú prepojené; evidovaný predaj nie je potvrdením platby.'}");
 const marker='<details id="adminSettingsPhotoV72"';
 if(!html.includes(marker))throw Error('Unknown settings markup');
 html=html.replace(marker,'<button type="button" id="adminSwitchWorkspace" class="admin-menu-row"><span><strong>Prepnúť prostredie</strong><small style="display:block">Chvostíkovo alebo Bellaris</small></span><span aria-hidden="true">›</span></button>'+marker);
 const script=`<script id="admin-workspace-return">document.getElementById('adminSwitchWorkspace')?.addEventListener('click',()=>{window.location.replace(new URL('/',window.location.origin).href);});</script>`;
 html=html.replace('</body>',script+'</body>');
 return html;
}
export const checksum=source=>createHash('sha256').update(source).digest('hex');
