import firstVisitTwoDogs from "@/assets/first-visit-dogs-together.webp";
import firstVisitDogFriends from "@/assets/first-visit-dog-friends.webp";
import firstVisitYoungDog from "@/assets/first-visit-young-dog.webp";

type FirstVisitPhotoProps = {
  number: number | string;
  image: string;
  alt: string;
  language?: "sk" | "en";
};

const approvedPhotos = [
  { src: firstVisitTwoDogs, alt: "Dvaja psíkovia v škôlke Chvostíkovo", altEn: "Two dogs sitting together at Chvostíkovo daycare" },
  { src: firstVisitDogFriends, alt: "Skupina psích kamarátov v škôlke Chvostíkovo", altEn: "Group of friendly dogs at Chvostíkovo daycare" },
  { src: firstVisitYoungDog, alt: "Svetlý psík v škôlke Chvostíkovo", altEn: "Young light-coloured dog sitting at Chvostíkovo daycare" },
];

/** Three user-approved authentic photos, consistent across SK and EN first-visit steps. */
export function FirstVisitPhoto({ number, image, alt, language = "sk" }: FirstVisitPhotoProps) {
  const photo = approvedPhotos[Number(number) - 1];
  return (
    <div className="relative mx-auto mb-6 w-fit">
      <img
        src={photo?.src ?? image}
        alt={photo ? (language === "en" ? photo.altEn : photo.alt) : alt}
        width={600}
        height={600}
        loading="lazy"
        decoding="async"
        className="size-36 rounded-full object-cover shadow-card ring-4 ring-card sm:size-44 lg:size-48"
      />
      <span
        aria-hidden="true"
        className="absolute -left-3 -top-3 grid size-14 place-items-center rounded-full bg-coral font-display text-2xl font-bold text-white shadow-card sm:size-16 sm:text-3xl"
      >
        {String(number).padStart(2, "0")}
      </span>
    </div>
  );
}
