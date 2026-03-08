import { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata(
  "Free Digital Invite Generator - Wedding E-Invitations & Cards",
  "Create stunning digital wedding invitations in minutes. Choose from beautiful templates, customize colors and fonts, and share instantly via WhatsApp, email, or social media.",
  {
    path: "/digital-invite-generator",
    keywords: [
      "digital invitation",
      "wedding e-invite",
      "online invitation maker",
      "wedding card design",
      "digital wedding card",
      "e-invitation generator",
      "free invitation maker",
      "WhatsApp wedding invite",
      "digital save the date",
      "wedding invitation template",
    ],
  }
);

export default function DigitalInviteGeneratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
