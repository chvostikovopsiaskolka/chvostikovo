import { useEffect } from "react";

/** Old shop bookmarks lead to current product inquiry forms without reading a cart. */
export function RetiredShopRedirect() {
  useEffect(() => {
    window.location.replace("/produkty");
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-5 py-16 text-center">
      <h1 className="text-3xl text-forest">Presúvame vás na produkty</h1>
      <p className="mt-4 text-forest/75">Záujem o produkt môžete poslať priamo na jeho stránke.</p>
      <a href="/produkty" className="btn-coral mt-6 inline-flex">Pozrieť produkty</a>
    </main>
  );
}
