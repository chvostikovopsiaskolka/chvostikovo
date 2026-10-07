import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { PawTrailBackground } from "@/components/site/PawTrailBackground";

export const Route = createFileRoute("/hero-test")({
  head: () => ({
    meta: [
      { title: "Test animovaného pozadia | Chvostíkovo" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: HeroBackgroundTest,
});

function HeroBackgroundTest() {
  return (
    <div className="min-h-screen bg-white">
      <Header homeSectionLinks landingMinimal landingTrackingSource="hero_background_test" />
      <main>
        <Hero background={<PawTrailBackground />} learnMoreHref="/#preco-chvostikovo" />
      </main>
    </div>
  );
}
