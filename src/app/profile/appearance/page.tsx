import { redirect } from "next/navigation";

export default function AppearanceRedirectPage() {
  redirect("/profile?tab=settings");
}
