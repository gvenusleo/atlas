import { requireSession } from "@/lib/auth/service";
import { listRecentDocuments } from "@/lib/documents/service";
import { HomeOverview } from "./_components/home-overview";

export default async function WorkspaceHomePage() {
  const session = await requireSession();
  const recentDocuments = await listRecentDocuments(session.user.id);

  return <HomeOverview recentDocuments={recentDocuments} />;
}
