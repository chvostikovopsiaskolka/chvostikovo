/* Exact-version EN reading translation of customer daycare terms.
 * The authoritative SK document, hashes, acceptance payloads and PDFs stay untouched.
 */
(() => {
 'use strict';
 const VERSION='2026-10-03';
 const HASH='d484212c87891e1ff69d206238f79fa3b021fbeb4afec043d82dafda37aa442d';
 const EN=String.raw`1. Dog's health

The dog must be in good health and able to take part safely in group activities. The owner must truthfully and promptly inform Chvostíkovo about the dog's health, illnesses, allergies, restrictions, medication or any other circumstances that could affect their stay at daycare or the safety of other dogs. Female dogs in heat are not accepted. If health problems, signs of an infectious disease or another condition making a group stay unsuitable appear before or during attendance, Chvostíkovo may, depending on the circumstances, adjust or end the dog's stay for that day and contact the owner.

2. Group environment and liability

The owner acknowledges that dog daycare is a group environment in which dogs naturally interact, play together, exercise and come into contact with each other. Chvostíkovo provides appropriate supervision throughout the dogs' stay and takes measures to prevent conflicts and minimise the risk of injury.

Even with proper supervision, however, a dog may react suddenly and unpredictably, and conflicts between dogs, scratches, abrasions, bites or other injuries may occur.

The operator of Chvostíkovo dog daycare is not liable for injury or damage caused by ordinary and unforeseeable interactions between dogs in the group, provided that supervising staff ensured appropriate supervision and followed safety procedures.

This provision does not apply if an incident results from a failure to provide appropriate supervision, a breach of safety obligations or other wrongdoing by the operator or supervising staff.

The owner must truthfully inform Chvostíkovo of any known signs of aggression, conflict-prone behaviour, resource guarding or other circumstances that could affect the safety of the dog, other dogs or staff.

3. Hygiene

Dogs should have basic house-training habits indoors. The owner must give the dog an appropriate opportunity to relieve themselves before arriving at daycare in the morning.

4. Vaccination and prevention

The dog must have valid vaccinations against rabies, infectious diseases (DHPPi+L) and kennel cough. The dog must be regularly dewormed and protected against external parasites. At the introductory visit, the owner must demonstrate that the required vaccinations are valid by presenting a vaccination record. When registering in the customer application, the owner must also enter the expiry dates of mandatory vaccinations and upload photographs of the vaccination record so that the details can be recorded and checked on an ongoing basis. If vaccinations are not valid, Chvostíkovo may temporarily suspend the dog's further attendance.

5. Dog behaviour

The dog must be socialised, manageable and non-confrontational towards people and other dogs. Aggressive dogs, dogs displaying inappropriate aggression or dogs whose behaviour presents an unreasonable risk to other dogs or staff are not accepted into the group. The owner must disclose all known behavioural issues, particularly aggression, pronounced resource guarding, repeated attacks on other dogs or any other circumstances that may affect safe attendance in the group. If behaviour incompatible with the safe operation of daycare occurs during a stay, Chvostíkovo may end the dog's stay on that day. In cases of serious or repeated problematic behaviour, Chvostíkovo reserves the right to suspend further visits or permanently exclude the dog from daycare.

6. Veterinary treatment

If the dog's health suddenly deteriorates, an injury occurs or another situation requiring attention arises, Chvostíkovo will contact the owner without delay and consider any further necessary steps according to the seriousness of the situation. If the dog's condition requires veterinary treatment or immediate transfer to a veterinary facility, by accepting these terms the owner authorises Chvostíkovo to arrange transportation to a veterinarian and the necessary veterinary treatment. The owner bears the costs of veterinary treatment unless they arose as a result of an act for which Chvostíkovo is responsible.

7. Reserving a place and cancelling a booking

A place at daycare must be booked in advance through the customer application or by arrangement with Chvostíkovo. Daycare capacity is limited; confirmation of a booking reserves a place for the specified dog on the relevant day.

If the dog cannot attend a booked stay, the owner must cancel the booking no later than 7:00 PM on the day before the planned visit.

After 7:00 PM, the booking is considered binding and Chvostíkovo expects the dog to attend and keeps the place reserved. If the dog subsequently does not attend, the reserved visit is considered used.

In exceptional circumstances, particularly if the dog suddenly becomes ill, suffers an injury or another serious unforeseen event occurs, Chvostíkovo may assess a late cancellation individually and decide that the visit will not be treated as used.

8. Visit pass

A visit pass is linked to a particular dog and is not transferable. A 10-visit pass is valid for two months from the first visit used. Its validity therefore begins not on the purchase date, but on the date of the first visit redeemed from the pass. Any unused visits expire when the pass's validity period ends.

9. Collection and transport of the dog

The dog collection or drop-off service is available by prior booking and subject to Chvostíkovo's current capacity. The current service price is listed in the applicable price list.

10. Final provisions

By accepting these terms, the owner declares that they have read and understood them and agree to them. The terms apply to the dog or dogs linked to the owner's customer account for which the terms have been accepted. Chvostíkovo may reasonably update the terms. Where a change affects the owner's rights or obligations, the owner may be asked to accept a new version of the terms when next using the customer application.`;
 const title='Chvostíkovo Dog Daycare Terms';
 const notice='English translation of the Slovak document. The original Slovak wording is authoritative.';
 const isEnglish=()=>window.ChvostikovoLocale?.getLanguage?.()==='en';
 function view(doc){
   if(!doc || !isEnglish()) return doc;
   if(doc.version!==VERSION || doc.document_hash!==HASH || typeof doc.body!=='string') return doc;
   return {...doc,title,body:EN,__englishReadingTranslation:true};
 }
 // Keep server version and original hash unchanged for signed acceptance / audit.
 window.ChvostikovoLegalENV411=Object.freeze({view,VERSION,HASH,notice});
})();
