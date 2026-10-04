import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PlanATi",
    short_name: "PlanATi",
    description:
      "Aquí puedes hallar las experiencias cercanas a ti que se ajusten a tus necesidades",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F8F9FF",
    theme_color: "#4648D4",
    orientation: "portrait",
  };
}