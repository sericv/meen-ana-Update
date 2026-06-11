import { redirect } from "next/navigation";

export default function FriendsLegacyRedirectPage() {
  redirect("/profile/friends");
}
