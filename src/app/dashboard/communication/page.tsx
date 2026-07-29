import { getAllNotificationsAction, getTemplatesAction } from "@/actions/communication";
import { CommunicationClient } from "@/components/communication/communication-client";

export const dynamic = "force-dynamic";

export default async function CommunicationPage() {
  const [notificationsRes, templatesRes] = await Promise.all([
    getAllNotificationsAction(),
    getTemplatesAction(),
  ]);

  const notifications = notificationsRes.data?.items || [];
  const templates = templatesRes.data?.items || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Communication Infrastructure Platform
        </h1>
        <p className="text-sm text-muted-foreground">
          Centralized messaging service, multi-channel broadcaster, reusable template engine, and delivery ledger
        </p>
      </div>

      <CommunicationClient
        initialNotifications={notifications}
        initialTemplates={templates}
      />
    </div>
  );
}
