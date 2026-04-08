import { redirect } from "next/navigation";

export default function RegisterEntryPage() {
  redirect("/auth?mode=register");
}
