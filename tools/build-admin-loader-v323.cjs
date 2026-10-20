const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
module.exports=function(){
 let h=require('./build-admin-capacity-v322.cjs')();
 assert.equal(crypto.createHash('md5').update(h).digest('hex'),'a9415e30f133a4dda821a661b8d884a9');
 const edits=[];function replace(a,b){assert.equal(h.split(a).length,2,'Unique anchor: '+a.slice(0,90));h=h.replace(a,b);edits.push({old:a,new:b})}
 replace('stroke:url(#appBootArcGradient)','stroke:url(#loadingArcGradient)');
 replace('<div id="loginView" class="app">','<div id="loginView" class="app hidden">');
 const start=h.indexOf('    async function refresh(){'),end=h.indexOf('    async function request(',start);assert(start>0&&end>start);
 replace(h.slice(start,end),fs.readFileSync('tools/admin-auth-refresh-v323.js','utf8'));
 replace('  return !result.error&&!!result.data?.user_id','  if(result.error)throw result.error;\n  return !!result.data?.user_id');
 replace('let adminAuthGuardBusyV47=false,adminEnteredUserV52=null;',fs.readFileSync('tools/admin-auth-retry-v323.js','utf8')+'\nlet adminAuthGuardBusyV47=false,adminEnteredUserV52=null;');
 replace('  }finally{adminAuthGuardBusyV47=false}','  }catch(error){showAdminAuthRetryV323()}finally{adminAuthGuardBusyV47=false}');
 const style=`<style id="admin-loader-v323">
 #appBoot.loading-screen.loading-concept{inset:0!important;width:auto!important;height:auto!important;min-height:0!important}
 html:has(#appBoot),body:has(#appBoot){background:radial-gradient(ellipse at 80% 20%,#fde9f180,transparent 65%),radial-gradient(ellipse at 10% 90%,#ffe3c980,transparent 65%),#fffaf5!important}
 .admin-auth-retry-v323{max-width:300px;margin:16px auto 0;font-size:14px;line-height:1.45;color:#815e47}.admin-auth-retry-v323 .btn{-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none}.admin-auth-retry-v323 .btn:focus-visible{outline:3px solid #fb923c;outline-offset:3px}
 </style>`;
 replace('</head>',style+'\n</head>');
 fs.writeFileSync('/tmp/admin-patch-v323.json',JSON.stringify(edits));return h;
};
if(require.main===module){const h=module.exports();fs.writeFileSync('/tmp/admin-candidate-v323.html',h);console.log('Candidate',crypto.createHash('md5').update(h).digest('hex'));}
