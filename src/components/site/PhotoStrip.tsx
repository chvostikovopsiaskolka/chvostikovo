import deco1 from "@/assets/deco-1.jpg.asset.json";
import deco2 from "@/assets/deco-2.jpg.asset.json";
import deco3 from "@/assets/deco-3.jpg.asset.json";

const photos = [deco1.url, deco2.url, deco3.url];

export function PhotoStrip() {
  return (
    <section aria-hidden="true" className="py-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {photos.map((src) => (
            <div
              key={src}
              className="aspect-[4/5] overflow-hidden rounded-xl sm:rounded-2xl"
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
