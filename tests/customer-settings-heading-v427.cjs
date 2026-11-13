const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const app=fs.readFileSync('app.js','utf8');
const source=app.match(/  function polishMenuV55\(\)\{[\s\S]*?\n  \}/);
assert(source,'must exercise the real customer UI heading function');
const title={textContent:'',classList:{contains:()=>false}};
const button={setAttribute(name,value){this[name]=value}};
const modal={dataset:{section:'notifications'},hidden:false,classList:{contains(){return modal.hidden}}};
const nodes={dogSettingsBtnV36:button,dogSettingsTitleV36:title,dogSettingsModalV36:modal};
const ctx={$:id=>nodes[id]};
function check(section,hidden,expected){modal.dataset.section=section;modal.hidden=hidden;vm.runInNewContext(source[0]+';polishMenuV55()',ctx);assert.equal(title.textContent,expected)}
check('notifications',false,'Upozornenia');
check('legal',false,'Súhlasy a podmienky');
check('notifications',true,'Nastavenia');
check('legal',true,'Nastavenia');
check('notifications',false,'Upozornenia');
assert.equal(button['aria-label'],'Nastavenia');
console.log('PASS v427 header preserves open notifications/legal section across render/foreground and resets only on closed modal');
