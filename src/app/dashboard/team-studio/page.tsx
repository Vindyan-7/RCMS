import { getTeamStudioInitialDataAction } from "@/actions/team-studio/team-studio.actions";
import { TeamStudioClient } from "@/components/team-studio/team-studio-client";

export const dynamic = "force-dynamic";

export default async function TeamStudioPage() {
  const res = await getTeamStudioInitialDataAction();
  const initialData = res.data || null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Team Studio &amp; Activity Center
        </h1>
        <p className="text-sm text-muted-foreground">
          Operational workspace for post-attendance team building, member shuffling, random pickers, and interactive activities.
        </p>
      </div>

      <TeamStudioClient initialData={initialData} />
    </div>
  );
}
