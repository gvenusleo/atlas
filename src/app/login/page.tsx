import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/service";

export default async function LoginEntryPage() {
  const session = await getSession();

  redirect(session ? "/" : "/auth");
}
