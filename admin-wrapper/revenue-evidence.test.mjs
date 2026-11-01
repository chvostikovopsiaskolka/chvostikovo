import {test} from 'node:test';import assert from 'node:assert/strict';import {revenueEvidence} from './revenue-evidence.mjs';
test('missing Friday is not a mismatch in the other four recorded days',()=>{
 const result=revenueEvidence({overview:{visits:38,single_visits:8,pass_visits:28,free_visits:2,confirmed_revenue_eur:null},data_quality:{complete:false,daily_accounts_match:false,paid_receipt_tracking:false},days:[26,27,28,29,30].map(day=>({date:'2026-10-'+day,finance_recorded:day!==30,accounts_match:day!==30}))});
 assert.deepEqual(result.missing,['30.10.2026']);assert.deepEqual(result.mismatched,[]);assert(result.message.includes('30.10.2026'));assert.equal(result.paymentsMeasured,false);
});
test('only recorded mismatches are reported, an accounting estimate never proves payment',()=>{const x=revenueEvidence({data_quality:{complete:true,paid_receipt_tracking:false},days:[{date:'2026-11-02',finance_recorded:true,accounts_match:false}]});assert.deepEqual(x.mismatched,['02.11.2026']);assert.equal(x.paymentsMeasured,false);});
test('empty report does not claim zero or complete payments',()=>{assert.equal(revenueEvidence().paymentsMeasured,false);assert(revenueEvidence().message.includes('nedokladá'));});
