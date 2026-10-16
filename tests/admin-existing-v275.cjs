// Run existing CRM/photo/group/recovery regression assertions against the NEW artifact.
const built=require('../tools/build-admin-stability-v275.cjs')();
const recoveryBuilder=require.resolve('../tools/build-admin-recovery-v273.cjs');
require.cache[recoveryBuilder]={id:recoveryBuilder,filename:recoveryBuilder,loaded:true,exports:()=>built};
require('./admin-recovery-runtime-v273.cjs');
