import { redirect } from "next/navigation";

// Redirect to locale-based route
export default function TeacherRedirect() {
  redirect("/ko/teacher");
}
