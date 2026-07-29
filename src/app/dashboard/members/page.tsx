import { searchMembersAction } from "@/actions/members";
import { MembersClient } from "@/components/members/members-client";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const membersRes = await searchMembersAction("");
  const members = membersRes.data?.items || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Members Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Academic member directory, registration, search, and soft archiving
        </p>
      </div>

      <MembersClient initialMembers={members} />
    </div>
  );
}
