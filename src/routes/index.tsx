import { createFileRoute } from "@tanstack/react-router";
import IndexPage from "@/pages/Index";

export const Route = createFileRoute("/")({
  // The app stores its session in localStorage and does heavy DOM work
  // (audio, speech, canvas games). Render fully on the client.
  ssr: false,
  component: IndexPage,
});
