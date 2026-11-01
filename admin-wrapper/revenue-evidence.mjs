// Reporting evidence only. Never turn visits or pass consumption into payments.
export function revenueEvidence(snapshot={}){
 const quality=snapshot.data_quality||{},days=Array.isArray(snapshot.days)?snapshot.days:[];
 const date=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value))?String(value).split('-').reverse().join('.'):String(value||'neznámy deň');
 const missing=days.filter(day=>day.finance_recorded===false).map(day=>date(day.date));
 const mismatched=days.filter(day=>day.finance_recorded===true&&day.accounts_match===false).map(day=>date(day.date));
 const reasons=[];
 if(missing.length)reasons.push('Chýba denné účtovanie: '+missing.join(', ')+'.');
 if(mismatched.length)reasons.push('Denné účtovanie nesúhlasí s návštevami alebo taxíkom: '+mismatched.join(', ')+'.');
 if(!reasons.length&&quality.complete===false)reasons.push('Evidencia nie je úplná; skontrolujte denné účtovanie a ceny predaných permanentiek.');
 if(quality.paid_receipt_tracking!==true)reasons.push('Report zatiaľ nedokladá prijaté platby. Účtovný odhad nie je potvrdená úhrada.');
 return {missing,mismatched,message:reasons.join(' '),paymentsMeasured:quality.paid_receipt_tracking===true&&quality.complete===true};
}
