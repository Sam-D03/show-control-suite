import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Cloud Admin — Control 2.0" },
      { name: "description", content: "Control 2.0 cloud account and team administration." },
    ],
  }),
  component: AdminShell,
});
