// Runtime documentation overrides for production changes that should be reflected
// in Chvostíkovo System without coupling the documentation app to production data.
(() => {
  const data = window.SYSTEM_DATA;
  if (!data) return;

  const customer = data.sections?.find(section => section.id === 'customer-app');
  const dogProfile = customer?.items?.find(item => item.title === 'Môj psík');
  if (dogProfile) {
    dogProfile.body = 'Sekcia Môj psík je kompaktne usporiadaná do rozbaľovacích blokov, aby majiteľ videl údaje psa, súhlasy, typ vstupu a históriu návštev bez zbytočného scrollovania.';
    dogProfile.bullets = [
      'Foto psa + editor fotografie.',
      'Údaje psíka a očkovania sú spolu v jednom rozbaľovacom bloku.',
      'Súhlasy a podmienky obsahujú GDPR, Podmienky škôlky, nastavenie upozornení a súhlas so zobrazením mena/fotky.',
      'Vstup a permanentka používajú neutrálne označenie Jednorazový vstup alebo zobrazia stav permanentky.',
      'Štatistiky návštev sú rozbaľovacie: návštevy celkovo + jednotlivé mesiace.',
      'Budúce rezervácie sa v Môj psík neduplikujú; zostávajú v rezervačnom prehľade.',
      'Moje kontaktné údaje sú posledná sekcia.'
    ];
    dogProfile.tags = [...new Set([...(dogProfile.tags || []), 'compact-profile', 'monthly-visits'])];
  }

  const pass = customer?.items?.find(item => item.title === 'Permanentka');
  if (pass) {
    pass.body = 'Zákazník vidí aktuálny typ vstupu bez negatívneho formulovania: pri jednorazovom režime sa zobrazí Jednorazový vstup; pri permanentke jej stav a počet vstupov. Zákazník môže požiadať o 10-vstupovú permanentku.';
  }
})();
