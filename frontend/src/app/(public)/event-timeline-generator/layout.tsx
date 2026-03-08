import { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata(
  "Free Event Timeline Generator - Wedding Day Schedule Maker",
  "Create detailed event timelines and day-of schedules. Perfect for weddings, parties, and corporate events. Share with vendors and keep everyone on track.",
  {
    path: "/event-timeline-generator",
    keywords: [
      "event timeline generator",
      "wedding day timeline",
      "event schedule maker",
      "day-of schedule",
      "wedding timeline template",
      "event run sheet",
      "party schedule planner",
      "wedding day planner",
      "event itinerary",
      "free timeline tool",
    ],
  }
);

export default function EventTimelineGeneratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
