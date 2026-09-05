import deco1 from "@/assets/deco-1.jpg";
import deco2 from "@/assets/deco-2.jpg";
import deco3 from "@/assets/deco-3.jpg";

const photos = [deco1, deco2, deco3];

export function PhotoStrip() {
  return (
    <section aria-hidden="true" className="py-6">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
          {photos.map((src, i) => (
            <div
              key={src}
              className={`overflow-hidden rounded-xl sm:rounded-2xl ${
                i === 0
                  ? "col-span-2 aspect-[16/9] sm:col-span-1 sm:aspect-[4/3]"
                  : "aspect-[4/3]"
              }`}
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                className={`h-full w-full object-cover ${
                  i === 0 ? "object-[center_35%]" : "object-[center_40%]"
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
