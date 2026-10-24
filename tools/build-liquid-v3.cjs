// Reproduce the pinned preview WebGL bundle; no auth or app runtime dependencies.
const esbuild=require('./liquid-v3/node_modules/esbuild');
esbuild.buildSync({entryPoints:['vendor/simple-liquid-glass/src/webgl/index.ts'],bundle:true,format:'esm',platform:'browser',target:'es2020',minify:true,nodePaths:[require('path').join(__dirname,'liquid-v3/node_modules')],outfile:'vendor/simple-liquid-glass/webgl.js',legalComments:'eof'});
