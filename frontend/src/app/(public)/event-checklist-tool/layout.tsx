import { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata(
  "Free Event Checklist Tool - Wedding & Party Planning Tasks",
  "Never miss a detail with our free event checklist tool. Get customizable task lists, deadline reminders, and progress tracking for weddings, parties, and corporate events.",
  {
    path: "/event-checklist-tool",
    keywords: [
      "event checklist",
      "wedding checklist",
      "party planning checklist",
      "event planning tasks",
      "wedding to-do list",
      "event timeline",
      "planning checklist template",
      "wedding planning guide",
      "event task manager",
      "free checklist tool",
    ],
  }
);

export default function EventChecklistToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
