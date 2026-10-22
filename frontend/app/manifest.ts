import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KumoriTV",
    short_name: "KumoriTV",
    display: "standalone",
    background_color: "#0B0B14",
    theme_color: "#0B0B14",
    icons: [
      { src: "/android-chrome-192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512.png", sizes: "512x512", type: "image/png" },
      { src: "/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
