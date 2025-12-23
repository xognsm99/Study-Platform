import { redirect } from "next/navigation";

// Redirect to locale-based route
export default function ProfileRedirect() {
  redirect("/ko/my");
}
