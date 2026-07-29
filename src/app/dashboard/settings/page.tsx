import { Badge } from "@/components/ui/badge";
import { Settings, ShieldCheck, Database, Server } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          System Administration & Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          RBAC policies, system configuration, database connection parameters and governance
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">RBAC Role Permissions</h3>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between items-center p-2 rounded-lg bg-background border border-border">
              <span className="font-semibold text-foreground">Super Admin</span>
              <Badge variant="success">All Permissions Granted</Badge>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-background border border-border">
              <span className="font-semibold text-foreground">Faculty Advisor</span>
              <Badge variant="info">View & Approval Gate</Badge>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-background border border-border">
              <span className="font-semibold text-foreground">Member / Volunteer</span>
              <Badge variant="secondary">Limited Access</Badge>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <Database className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Database & Infrastructure</h3>
          </div>
          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="flex justify-between items-center">
              <span>Database Engine:</span>
              <span className="font-mono text-foreground">PostgreSQL / Supabase</span>
            </div>
            <div className="flex justify-between items-center">
              <span>ORM Framework:</span>
              <span className="font-mono text-foreground">Drizzle ORM v0.30</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Migrations Applied:</span>
              <span className="font-mono text-emerald-500">0000 - 0009 (100% Up-to-date)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
