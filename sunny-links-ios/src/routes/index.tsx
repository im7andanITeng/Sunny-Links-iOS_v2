import { createFileRoute } from "@tanstack/react-router";
import GolfApp from "@/components/golf/GolfApp";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sunny Links Mini Golf — Endless 3D mini golf" },
      { name: "description", content: "Play a 6-hole 3D mini golf course with windmills, water, sand traps and slopes right in your browser." },
      { property: "og:title", content: "Sunny Links Mini Golf" },
      { property: "og:description", content: "A 6-hole 3D mini golf course with windmills, water and slopes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GolfApp,
});
