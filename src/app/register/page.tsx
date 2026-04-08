import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/service";

export default async function RegisterEntryPage() {
  const session = await getSession();

  redirect(session ? "/" : "/auth?mode=register");
}
