const fs=require('node:fs');
const assert=require('node:assert/strict');
const read=(path)=>fs.readFileSync(path,'utf8');
const ver=JSON.parse(read('version.json'));
const app=read('app.js'),html=read('index.html'),sw=read('sw.js');

assert(/^v[1-9][0-9]*$/.test(ver.build), 'version.json must contain a numbered vBUILD');
assert(/^[0-9]+\.[0-9]+\.[0-9]+$/.test(ver.version), 'version.json must contain semver');
const buildMatch=app.match(/^const APP_BUILD='([^']+)';$/m);
const versionMatch=app.match(/^const APP_VERSION='([^']+)';$/m);
assert.equal(buildMatch?.[1],ver.build,'app.js APP_BUILD vs version.json');
assert.equal(versionMatch?.[1],ver.version,'app.js APP_VERSION vs version.json');
assert(sw.includes("const CACHE='chvostikovo-portal-shell-"+ver.build+"';"),'service worker shell cache');

function checkAssetVersions(source,label){
 const tokens=[...source.matchAll(/[?&]v=(v[0-9]+)(?=['"&\s<>])/g)].map(m=>m[1]);
 assert(tokens.length>=5,label+' must expose versioned assets');
 for(const token of tokens){
   assert.equal(token,ver.build,label+' contains outdated cache-busting build '+token+' instead of '+ver.build);
 }
}
checkAssetVersions(html,'index.html');
checkAssetVersions(sw,'sw.js');

assert(html.includes('class="menu-deletion-link-v407" href="https://chvostikovo.sk/ochrana-osobnych-udajov#vymazanie-uctu" target="_blank" rel="noopener noreferrer"'),
  'settings must offer a direct, publicly accessible account deletion request path');

// Older-version feature regression tests must keep their behavior assertions while
// reading the CURRENT build dynamically, not asserting that this release IS v361/v362.
for(const path of ['tests/customer-surface-v361.cjs','tests/customer-magnetic-board-v362.cjs']){
 const code=read(path);
 assert(!/assert\.equal\(\s*ver\.(build|version)\s*,\s*['"][^'"]+['"]/.test(code),path+' hardcodes release identifier');
 assert(!/assert\(\s*(?:app|js|sw|html)\.includes\((?:'|")const APP_BUILD=(?:'|")v[0-9]+/.test(code),path+' pins old app build');
}
console.log('PASS customer release contract: current build/semver/HTML/SW/cache agree; old feature tests stay reusable');

