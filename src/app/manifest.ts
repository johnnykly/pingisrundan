import type { MetadataRoute } from "next";
import { dictionaries } from "@/i18n";

export default function manifest(): MetadataRoute.Manifest {
  const d = dictionaries.sv;
  return {
    id: "/",
    name: d.app.name,
    short_name: d.app.name,
    description: d.app.description,
    lang: "sv",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#171617",
    theme_color: "#171617",
    categories: ["sports", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [{ name: d.nav.add, url: "/ny", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] }],
  };
}
