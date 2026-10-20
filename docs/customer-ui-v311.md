# Customer Beta 2.0.2 / v311

Base: customer-portal-production 1a2de250b39904b9ae84c7896db6f39828171ebb, Beta 2.0.1/v310-r2.
Rollback: backup/customer-before-ui-v311 or Vercel dpl_3msc9pgcG19iXvCPr2Ao4D3JYksj.

Overview roster button aligns to the card's right edge below approval; bulletin minimum item area reduced 150→130px. Both weeks share a warm orange border with subtle inset/extruded shadow. A contact notice remains directly below Tento týždeň, including Tuesday onward: Máte záujem o rezerváciu? Kliknite na konkrétny deň a pošlite nám správu — aj v prípade plnej kapacity.

Only the expired booking-window label changes Uzavreté→Napíšte nám. Real closure stays Zatvorené, full stays Plno, past stays Uplynulo and approval/pending states remain. Capacity/closure/cutoff logic and chat handlers are unchanged; no availability is invented.

Full customer-runtime regression for 0/1/2 dogs, assignment, stable photos, original vaccines, taxi, deadline transition and retained full-day chat passes. Production source readback is required. Physical iPhone/Android layout is unobserved. No database or backend changes and no test sends.
