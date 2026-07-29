"use client";

/**
 * Communication Infrastructure Platform Client Component
 */

import { useState, useTransition } from "react";
import {
  sendNotificationAction,
  broadcastNotificationAction,
  createNotificationTemplateAction,
  getTemplatesAction,
  getAllNotificationsAction,
} from "@/actions/communication";
import { NotificationSelect, NotificationTemplateSelect } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Send,
  Plus,
  RefreshCw,
  Search,
  X,
  FileText,
  Smartphone,
  Mail,
  MessageSquare,
  Radio,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface CommunicationClientProps {
  initialNotifications: NotificationSelect[];
  initialTemplates: NotificationTemplateSelect[];
}

export function CommunicationClient({
  initialNotifications,
  initialTemplates,
}: CommunicationClientProps) {
  const [notificationsList, setNotificationsList] = useState<NotificationSelect[]>(initialNotifications);
  const [templatesList, setTemplatesList] = useState<NotificationTemplateSelect[]>(initialTemplates);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"broadcast" | "templates" | "logs">("broadcast");

  // Modals
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);

  const [isPending, startTransition] = useTransition();

  // Send Single Notification Fields
  const [recipientId, setRecipientId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState("in_app");
  const [priority, setPriority] = useState("normal");

  // Broadcast Fields
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [recipientsCsv, setRecipientsCsv] = useState("");

  // Template Fields
  const [templateCode, setTemplateCode] = useState("event_reminder_v1");
  const [templateName, setTemplateName] = useState("Event Reminder Notification");
  const [templateSubject, setTemplateSubject] = useState("Upcoming Club Event: {{operation_name}}");
  const [templateText, setTemplateText] = useState("Hi {{member_name}}, don't forget your scheduled attendance for {{operation_name}} on {{attendance_date}}!");

  const refreshAll = async () => {
    startTransition(async () => {
      const [nRes, tRes] = await Promise.all([
        getAllNotificationsAction(),
        getTemplatesAction(),
      ]);
      if (nRes.success && nRes.data) setNotificationsList(nRes.data.items);
      if (tRes.success && tRes.data) setTemplatesList(tRes.data.items);
    });
  };

  const handleSendSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await sendNotificationAction({
        recipientId,
        title,
        message,
        channel,
        priority,
      });

      if (res.success && res.data) {
        setIsSendOpen(false);
        setTitle("");
        setMessage("");
        setRecipientId("");
        refreshAll();
      } else {
        alert(res.error?.message || "Failed to send notification");
      }
    });
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    const recipientIds = recipientsCsv
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (recipientIds.length === 0) {
      alert("Please provide at least one recipient Member UUID");
      return;
    }

    startTransition(async () => {
      const res = await broadcastNotificationAction({
        recipientIds,
        title: broadcastTitle,
        message: broadcastMessage,
      });

      if (res.success && res.data) {
        alert(`Broadcast dispatched to ${res.data.length} recipients!`);
        setIsBroadcastOpen(false);
        setBroadcastTitle("");
        setBroadcastMessage("");
        setRecipientsCsv("");
        refreshAll();
      } else {
        alert(res.error?.message || "Broadcast dispatch failed");
      }
    });
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createNotificationTemplateAction({
        code: templateCode,
        name: templateName,
        subject: templateSubject,
        templateText,
        channel: "in_app",
      });

      if (res.success && res.data) {
        setIsCreateTemplateOpen(false);
        setTemplateName("");
        refreshAll();
      } else {
        alert(res.error?.message || "Failed to create template");
      }
    });
  };

  return (
    <div className="space-y-6 text-left">
      {/* Controls & Tab Bar */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-3 border-b border-border text-sm font-semibold">
          <button
            onClick={() => setActiveTab("broadcast")}
            className={`pb-2 px-3 flex items-center space-x-2 ${
              activeTab === "broadcast" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
            }`}
          >
            <Radio className="h-4 w-4" />
            <span>Broadcaster & Announcements</span>
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`pb-2 px-3 flex items-center space-x-2 ${
              activeTab === "templates" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Template Engine ({templatesList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`pb-2 px-3 flex items-center space-x-2 ${
              activeTab === "logs" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Delivery Ledger ({notificationsList.length})</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={refreshAll} disabled={isPending}>
            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" className="flex items-center space-x-2" onClick={() => setIsSendOpen(true)}>
            <Send className="h-4 w-4" />
            <span>Direct Alert</span>
          </Button>
          <Button className="flex items-center space-x-2" onClick={() => setIsBroadcastOpen(true)}>
            <Radio className="h-4 w-4" />
            <span>New Broadcaster</span>
          </Button>
        </div>
      </div>

      {/* Broadcaster & Announcements View */}
      {activeTab === "broadcast" && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-foreground text-base">All-Hands Operations Announcement</h3>
                <p className="text-xs text-muted-foreground mt-1">Multi-Channel In-App & Email Alert</p>
              </div>
              <Badge variant="success">Dispatched</Badge>
            </div>
            <p className="text-xs text-foreground bg-muted/30 p-3 rounded-lg border border-border">
              &quot;Registration is officially open for the 2026 Autonomous Maze Runner Competition! Check Operations module for details.&quot;
            </p>
            <div className="flex justify-between items-center text-xs text-muted-foreground pt-2">
              <span>Channel: In-App + Email</span>
              <span>Priority: High</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-foreground text-base">Inventory Return Reminder</h3>
                <p className="text-xs text-muted-foreground mt-1">Automated Multi-Channel Trigger</p>
              </div>
              <Badge variant="info">Active Trigger</Badge>
            </div>
            <p className="text-xs text-foreground bg-muted/30 p-3 rounded-lg border border-border">
              &quot;Reminder: ESP32 Development Boards checked out for CAD Workshop are due for return by 5:00 PM.&quot;
            </p>
            <div className="flex justify-between items-center text-xs text-muted-foreground pt-2">
              <span>Channel: In-App</span>
              <span>Priority: Normal</span>
            </div>
          </div>
        </div>
      )}

      {/* Templates Engine View */}
      {activeTab === "templates" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-foreground text-sm">Reusable Communication Templates</h3>
            <Button size="sm" onClick={() => setIsCreateTemplateOpen(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Create Template
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {templatesList.map((tmpl) => (
              <div key={tmpl.id} className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-foreground text-sm">{tmpl.name}</h4>
                    <span className="font-mono text-[10px] text-muted-foreground">Code: {tmpl.code}</span>
                  </div>
                  <Badge variant="outline" className="capitalize">{tmpl.channel}</Badge>
                </div>
                <div className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border font-mono">
                  {tmpl.templateText}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delivery Log Ledger */}
      {activeTab === "logs" && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3.5">Notification Title</th>
                <th className="px-6 py-3.5">Channel</th>
                <th className="px-6 py-3.5">Priority</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Delivered Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {notificationsList.map((n) => (
                <tr key={n.id} className="hover:bg-accent/40 transition-colors">
                  <td className="px-6 py-4 font-semibold text-foreground">{n.title}</td>
                  <td className="px-6 py-4 text-xs font-mono text-muted-foreground capitalize">{n.channel}</td>
                  <td className="px-6 py-4 text-xs font-semibold capitalize">{n.priority}</td>
                  <td className="px-6 py-4">
                    <Badge variant={n.status === "delivered" || n.status === "sent" ? "success" : "secondary"}>
                      {n.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {n.deliveredAt ? new Date(n.deliveredAt).toLocaleTimeString() : "Pending"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Direct Alert Modal */}
      {isSendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Send Direct Alert</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsSendOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleSendSingle} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Recipient Member UUID</label>
                <input
                  type="text"
                  required
                  value={recipientId}
                  placeholder="Paste Member ID..."
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  placeholder="e.g. Volunteer Duty Assignment"
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Message Body</label>
                <textarea
                  required
                  value={message}
                  rows={3}
                  placeholder="Write message details..."
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="in_app">In-App</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp-ready</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Sending..." : "Dispatch Alert"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Broadcaster Modal */}
      {isBroadcastOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Multi-Channel Broadcaster</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsBroadcastOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Broadcast Title</label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  placeholder="e.g. All-Hands Emergency Assembly"
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Broadcast Message</label>
                <textarea
                  required
                  value={broadcastMessage}
                  rows={3}
                  placeholder="Write message details..."
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Recipient Member UUIDs (Comma separated)</label>
                <input
                  type="text"
                  required
                  value={recipientsCsv}
                  placeholder="UUID1, UUID2..."
                  onChange={(e) => setRecipientsCsv(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Broadcasting..." : "Dispatch Multi-Channel Broadcast"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {isCreateTemplateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Create Notification Template</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsCreateTemplateOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4 text-left">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Template Code</label>
                  <input
                    type="text"
                    required
                    value={templateCode}
                    onChange={(e) => setTemplateCode(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Name</label>
                  <input
                    type="text"
                    required
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Subject Template</label>
                <input
                  type="text"
                  value={templateSubject}
                  onChange={(e) => setTemplateSubject(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Template Text (with placeholders)</label>
                <textarea
                  required
                  value={templateText}
                  rows={3}
                  onChange={(e) => setTemplateText(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Creating..." : "Save Template"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
