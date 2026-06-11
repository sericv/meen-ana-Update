import { redirect } from "next/navigation";

/** Legacy route — friend requests live on the friends tab now. */
export default function ProfileRequestsRedirect() {
  redirect("/profile/friends");
}
