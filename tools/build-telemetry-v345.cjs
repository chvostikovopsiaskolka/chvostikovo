const fs=require('fs'),path=require('path');
const esbuild=require('./telemetry-runtime/node_modules/esbuild');
esbuild.buildSync({entryPoints:[path.join(__dirname,'telemetry-runtime/browser.js')],bundle:true,minify:true,format:'iife',platform:'browser',target:['es2020'],outfile:'telemetry-v345.js',legalComments:'eof'});
for(const pkg of ['api','sdk-trace','core','resources']){const dir=path.join(__dirname,'telemetry-runtime/node_modules/@opentelemetry',pkg);if(fs.existsSync(dir+'/LICENSE'))fs.copyFileSync(dir+'/LICENSE',path.join(__dirname,'telemetry-runtime','LICENSE-'+pkg));}
console.log('Built local OpenTelemetry bundle',fs.statSync('telemetry-v345.js').size,'bytes');
