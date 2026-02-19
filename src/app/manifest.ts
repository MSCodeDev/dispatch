import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dispatch",
    short_name: "Dispatch",
    description: "Personal task and note management",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0a",
    theme_color: "#3b82f6",
    categories: ["productivity", "utilities"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Inbox",
        url: "/inbox",
        description: "View your inbox",
      },
      {
        name: "Tasks",
        url: "/tasks",
        description: "View your tasks",
      },
      {
        name: "Notes",
        url: "/notes",
        description: "View your notes",
      },
    ],
  };
}
