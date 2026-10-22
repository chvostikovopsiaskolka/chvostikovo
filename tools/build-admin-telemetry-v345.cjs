const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
module.exports=function(source){
 let h=source||(fs.existsSync('supabase/backups/admin-before-telemetry-v347.html.gz')?require('zlib').gunzipSync(fs.readFileSync('supabase/backups/admin-before-telemetry-v347.html.gz')).toString('utf8'):fs.readFileSync('admin-live-current.html','utf8'));
 if(crypto.createHash('md5').update(h).digest('hex')!=='833f44a3e98666a52c2e3814fe6b074c'&&h.endsWith('\n')&&crypto.createHash('md5').update(h.slice(0,-1)).digest('hex')==='833f44a3e98666a52c2e3814fe6b074c')h=h.slice(0,-1);
 assert.equal(crypto.createHash('md5').update(h).digest('hex'),'833f44a3e98666a52c2e3814fe6b074c','live admin baseline changed');
 if(!fs.existsSync('supabase/backups/admin-before-telemetry-v347.html.gz'))fs.writeFileSync('supabase/backups/admin-before-telemetry-v347.html.gz',require('zlib').gzipSync(h));
 const edits=[];function replace(a,b){assert.equal(h.split(a).length,2,'unique anchor '+a.slice(0,70));h=h.replace(a,b);edits.push({old:a,new:b});}
 replace('20261022-crm-outcomes-v346','20261022-opentelemetry-v347');
 // v346's standalone script references lexical main-scope CRM helpers.
 // Preserve its exact implementation, but initialize it inside that real scope.
 const crm=h.match(/<script>\s*(\(function crmOutcomesV346\(\)\{[\s\S]*?\}\)\(\);)\s*<\/script>/);
 assert(crm,'CRM outcomes plugin retained');replace(crm[0],'');
 const mainMarker='/* v63: messages/dashboard update via initial load + Realtime + resume sync; no periodic polling */';
 replace(mainMarker,crm[1]+'\n\n'+mainMarker);
 const bundle=fs.readFileSync('telemetry-v345.js','utf8');assert(!bundle.includes('</script'));
 replace('</head>','<script id="chvo-opentelemetry-v345">'+bundle+'</script><style id="telemetry-panel-style-v345">#telemetryPanelV345{width:min(660px,calc(100% - 24px));max-height:80svh;box-sizing:border-box;padding:20px;border:1px solid #fed7aa;border-radius:22px;background:#fffaf5;color:#172136;overflow:auto}#telemetryPanelV345::backdrop{background:#17213680}#telemetryPanelV345 header{display:flex;align-items:center;justify-content:space-between;gap:10px}#telemetryPanelV345 h2{font-size:20px;margin:0}#telemetryPanelV345 button{min-height:44px;min-width:44px;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none}#telemetryPanelV345 button:focus-visible{outline:3px solid #fb923c;outline-offset:2px}#telemetryPanelV345 .card{padding:12px}#telemetryPanelV345 p{overflow-wrap:anywhere;line-height:1.4;margin:8px 0}#telemetryPanelV345 .telemetry-operation-v345{font-size:12px;font-weight:700}</style>\n</head>');
 replace('const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)','const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)\n'+fs.readFileSync('tools/admin-telemetry-panel-v345.js','utf8'));
 replace('<div class="admin-menu-group admin-menu-direct"><button id="menuSettingsCard"','<div class="admin-menu-group admin-menu-direct"><button id="menuTelemetryV345" class="admin-menu-row" type="button"><span>Technický stav appiek</span><span>›</span></button></div>\n<div class="admin-menu-group admin-menu-direct"><button id="menuSettingsCard"');
 module.exports.edits=edits;return h;
};
if(require.main===module){const h=module.exports();fs.writeFileSync('/tmp/admin-candidate-v345.html',h);fs.writeFileSync('/tmp/admin-patch-v345.json',JSON.stringify(module.exports.edits));console.log('Admin candidate',crypto.createHash('md5').update(h).digest('hex'));}
