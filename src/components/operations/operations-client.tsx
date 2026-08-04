"use client";

/**
 * Operations Engine Client Component
 * Production Polish: Clickable Cards, Enriched Detail Workspaces, Task & Event Intelligence
 */

import { useState, useTransition, useEffect, useCallback } from "react";
import { sortMembersByClubMembershipId } from "@/core/utils/member-sorting";
import Link from "next/link";
import {
  createEventAction,
  updateEventAction,
  verifyEventParticipationAction,
  getEventsAction,
  getEventParticipationsAction,
  exportEventCsvAction,
} from "@/actions/operations/events.actions";
import {
  createTaskAction,
  updateTaskAction,
  completeTaskAction,
  revokeTaskCompletionAction,
  getTasksAction,
  getTaskCompletionsAction,
  exportTaskCsvAction,
} from "@/actions/operations/tasks.actions";
import {
  getSemesterContextMetadataAction,
  getEnrolledMembersForActiveSemesterAction,
} from "@/actions/members/semesters.actions";
import { SemesterContextMetadata } from "@/services/academic/semester-context.service";
import { EventSelect, TaskSelect, MemberSelect } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CheckSquare,
  Plus,
  RefreshCw,
  X,
  Play,
  CheckCircle,
  Award,
  Clock,
  MapPin,
  Tag,
  UserCheck,
  AlertTriangle,
  Download,
  Users,
  ChevronRight,
  FileSpreadsheet,
  RotateCcw,
  CheckCircle2,
  Info,
} from "lucide-react";

interface OperationsClientProps {
  initialEvents: EventSelect[];
  initialTasks: TaskSelect[];
}

export function OperationsClient({ initialEvents, initialTasks }: OperationsClientProps) {
  const [eventsList, setEventsList] = useState<EventSelect[]>(initialEvents);
  const [tasksList, setTasksList] = useState<TaskSelect[]>(initialTasks);
  const [activeTab, setActiveTab] = useState<"tasks" | "events">("tasks");

  const [semesterContext, setSemesterContext] = useState<SemesterContextMetadata | null>(null);
  const [enrolledMembers, setEnrolledMembers] = useState<MemberSelect[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Detail Workspace States
  const [activeDetailTask, setActiveDetailTask] = useState<TaskSelect | null>(null);
  const [taskCompletionsList, setTaskCompletionsList] = useState<any[]>([]);
  const [isTaskWorkspaceLoading, setIsTaskWorkspaceLoading] = useState(false);

  const [activeDetailEvent, setActiveDetailEvent] = useState<EventSelect | null>(null);
  const [eventParticipationsList, setEventParticipationsList] = useState<any[]>([]);
  const [isEventWorkspaceLoading, setIsEventWorkspaceLoading] = useState(false);

  // Modal State
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isVerifyTaskOpen, setIsVerifyTaskOpen] = useState(false);
  const [isVerifyEventOpen, setIsVerifyEventOpen] = useState(false);

  const [selectedTask, setSelectedTask] = useState<TaskSelect | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventSelect | null>(null);

  const [isPending, startTransition] = useTransition();

  // Form Fields
  const [eventName, setEventName] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventPoints, setEventPoints] = useState(30);
  const [eventStartDate, setEventStartDate] = useState("2026-08-15");
  const [eventEndDate, setEventEndDate] = useState("2026-08-15");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskCategory, setTaskCategory] = useState("Hardware");
  const [taskPoints, setTaskPoints] = useState(15);

  const [memberId, setMemberId] = useState("");

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [evRes, tkRes, metaRes, membersRes] = await Promise.all([
        getEventsAction(),
        getTasksAction(),
        getSemesterContextMetadataAction(),
        getEnrolledMembersForActiveSemesterAction(),
      ]);
      if (evRes.success && evRes.data) setEventsList(evRes.data.items);
      if (tkRes.success && tkRes.data) setTasksList(tkRes.data.items);
      if (metaRes.success && metaRes.data) setSemesterContext(metaRes.data);
      if (membersRes.success && membersRes.data) setEnrolledMembers(membersRes.data);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Load Task Workspace Details
  const handleOpenTaskWorkspace = async (task: TaskSelect) => {
    setActiveDetailTask(task);
    setIsTaskWorkspaceLoading(true);
    try {
      const res = await getTaskCompletionsAction(task.id, { limit: 1000 });
      if (res.success && res.data) {
        setTaskCompletionsList(res.data.items);
      } else {
        setTaskCompletionsList([]);
      }
    } finally {
      setIsTaskWorkspaceLoading(false);
    }
  };

  // Load Event Workspace Details
  const handleOpenEventWorkspace = async (event: EventSelect) => {
    setActiveDetailEvent(event);
    setIsEventWorkspaceLoading(true);
    try {
      const res = await getEventParticipationsAction(event.id, { limit: 1000 });
      if (res.success && res.data) {
        setEventParticipationsList(res.data.items);
      } else {
        setEventParticipationsList([]);
      }
    } finally {
      setIsEventWorkspaceLoading(false);
    }
  };

  const handleExportTaskCsv = async (taskId: string) => {
    startTransition(async () => {
      const res = await exportTaskCsvAction(taskId);
      if (res.success && res.data) {
        const blob = new Blob([res.data.csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", res.data.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(res.error?.message || "Failed to export task CSV");
      }
    });
  };

  const handleExportEventCsv = async (eventId: string) => {
    startTransition(async () => {
      const res = await exportEventCsvAction(eventId);
      if (res.success && res.data) {
        const blob = new Blob([res.data.csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", res.data.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(res.error?.message || "Failed to export event CSV");
      }
    });
  };

  const handleRevokeTaskCompletion = async (completionId: string) => {
    if (!confirm("Revoke this task completion? Points will be adjusted accordingly.")) return;
    startTransition(async () => {
      const res = await revokeTaskCompletionAction(completionId);
      if (res.success) {
        if (activeDetailTask) handleOpenTaskWorkspace(activeDetailTask);
        refreshAll();
      } else {
        alert(res.error?.message || "Failed to revoke completion");
      }
    });
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createEventAction({
        name: eventName,
        venue: eventVenue || "Robotics Complex",
        points: eventPoints,
        startDate: new Date(eventStartDate).toISOString(),
        endDate: new Date(eventEndDate).toISOString(),
        status: "published",
      });

      if (res.success && res.data) {
        setIsCreateEventOpen(false);
        setEventName("");
        setEventVenue("");
        refreshAll();
      } else {
        alert(res.error?.message || "Failed to create event");
      }
    });
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createTaskAction({
        title: taskTitle,
        category: taskCategory,
        points: taskPoints,
        status: "active",
      });

      if (res.success && res.data) {
        setIsCreateTaskOpen(false);
        setTaskTitle("");
        refreshAll();
      } else {
        alert(res.error?.message || "Failed to create task");
      }
    });
  };

  const handleVerifyTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    startTransition(async () => {
      const res = await completeTaskAction({
        taskId: selectedTask.id,
        memberId: memberId,
      });

      if (res.success) {
        alert("Task completion verified and points awarded!");
        setIsVerifyTaskOpen(false);
        setMemberId("");
        if (activeDetailTask?.id === selectedTask.id) {
          handleOpenTaskWorkspace(selectedTask);
        }
        refreshAll();
      } else {
        alert(res.error?.message || "Task verification failed");
      }
    });
  };

  const handleVerifyEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    startTransition(async () => {
      const res = await verifyEventParticipationAction({
        eventId: selectedEvent.id,
        memberId: memberId,
      });

      if (res.success) {
        alert("Event participation verified and points awarded!");
        setIsVerifyEventOpen(false);
        setMemberId("");
        if (activeDetailEvent?.id === selectedEvent.id) {
          handleOpenEventWorkspace(selectedEvent);
        }
        refreshAll();
      } else {
        alert(res.error?.message || "Event participation verification failed");
      }
    });
  };

  // ── Active Semester Filtering ─────────────────────────────────────────────
  const activeSemesterId = semesterContext?.activeSemester?.id;
  const semesterName = semesterContext?.activeSemester?.name || "Active Semester";
  const activeEvents = eventsList.filter((e) => !activeSemesterId || (e as any).semesterId === activeSemesterId);
  const activeTasks = tasksList.filter((t) => !activeSemesterId || (t as any).semesterId === activeSemesterId);

  // ── Phase 1 Guard: No Active Semester ──────────────────────────────────────
  if (semesterContext && !semesterContext.isOperationAllowed) {
    return (
      <div className="rounded-2xl border border-amber-800/40 bg-amber-950/20 p-8 text-amber-300 space-y-4 max-w-xl mx-auto my-12 text-center shadow-lg">
        <div className="flex justify-center">
          <AlertTriangle className="h-12 w-12 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-amber-200">No Active Semester</h2>
        <p className="text-sm text-muted-foreground">
          Operations Center is unavailable until a semester is activated.
        </p>
        <div className="pt-2">
          <Link href="/dashboard/semesters">
            <Button variant="outline" className="text-xs border-amber-700/60 text-amber-300 hover:bg-amber-900/40">
              Go to Semester Management
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Phase 2 Guard: Active Semester exists but 0 Members Enrolled ───────────
  if (semesterContext && semesterContext.isOperationAllowed && enrolledMembers.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-800/40 bg-amber-950/20 p-8 text-amber-300 space-y-4 max-w-xl mx-auto my-12 text-center shadow-lg">
        <div className="flex justify-center">
          <AlertTriangle className="h-12 w-12 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-amber-200">
          Active Semester: {semesterContext.activeSemester?.name}
        </h2>
        <p className="text-sm text-muted-foreground">
          No members are enrolled in the active semester.
        </p>
        <div className="pt-2">
          <Link href="/dashboard/semesters">
            <Button variant="outline" className="text-xs border-amber-700/60 text-amber-300 hover:bg-amber-900/40">
              Go to Semester Management → Member Enrollment
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left relative">

      {/* Statistics Bar */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground">Active Semester</div>
          <div className="text-sm font-bold text-foreground truncate">{semesterName}</div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground">Total Events</div>
          <div className="text-base font-bold text-blue-400">{activeEvents.length} Events</div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground">Active Tasks</div>
          <div className="text-base font-bold text-emerald-400">{activeTasks.filter(t => t.status === "active").length} Tasks</div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground">Upcoming Events</div>
          <div className="text-base font-bold text-amber-400">{activeEvents.filter(e => e.status === "published" || e.status === "upcoming").length} Events</div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground">Completed Tasks</div>
          <div className="text-base font-bold text-purple-400">{activeTasks.filter(t => t.status === "completed").length} Tasks</div>
        </div>
      </div>

      {/* Controls & Tab Selection */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-2 border-b border-border text-sm font-semibold">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`pb-2 px-3 flex items-center space-x-2 transition-colors ${
              activeTab === "tasks" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            <span>Technical Tasks Engine ({activeTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("events")}
            className={`pb-2 px-3 flex items-center space-x-2 transition-colors ${
              activeTab === "events" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Robotics Operations & Events ({activeEvents.length})</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={refreshAll} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          {activeTab === "tasks" ? (
            <Button className="flex items-center space-x-2 text-xs bg-blue-600 hover:bg-blue-500 text-white" onClick={() => setIsCreateTaskOpen(true)}>
              <Plus className="h-4 w-4" />
              <span>Create Task</span>
            </Button>
          ) : (
            <Button className="flex items-center space-x-2 text-xs bg-blue-600 hover:bg-blue-500 text-white" onClick={() => setIsCreateEventOpen(true)}>
              <Plus className="h-4 w-4" />
              <span>Create Event</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tasks View (FIRST) */}
      {activeTab === "tasks" && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activeTasks.map((tsk) => (
            <div
              key={tsk.id}
              onClick={() => handleOpenTaskWorkspace(tsk)}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3 cursor-pointer hover:border-blue-500/60 hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-foreground text-sm group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    {tsk.title}
                    <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                  </h4>
                  <Badge variant="outline" className="mt-1 text-[10px]">
                    {(tsk as any).category || "Hardware"}
                  </Badge>
                </div>
                <Badge variant={tsk.status === "active" ? "success" : "secondary"}>
                  {tsk.status}
                </Badge>
              </div>

              <div className="flex justify-between items-center text-xs text-muted-foreground border-t border-border/40 pt-3">
                <span className="font-bold text-emerald-400">{tsk.points} Pts Reward</span>
                <span className="text-[11px] text-muted-foreground/80">Click for Task Workspace →</span>
              </div>

              <Button
                size="sm"
                className="w-full text-xs flex items-center justify-center space-x-1 bg-blue-600/90 hover:bg-blue-600 text-white font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTask(tsk);
                  setIsVerifyTaskOpen(true);
                }}
              >
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Verify Completion</span>
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Events View (SECOND) */}
      {activeTab === "events" && (
        <div className="grid gap-6 md:grid-cols-2">
          {activeEvents.map((evt) => (
            <div
              key={evt.id}
              onClick={() => handleOpenEventWorkspace(evt)}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 cursor-pointer hover:border-blue-500/60 hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-foreground text-base group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    {evt.name}
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3.5 w-3.5 text-blue-400" />
                    <span>{evt.venue || "Main Auditorium"}</span>
                  </div>
                </div>
                <Badge variant={evt.status === "published" ? "success" : "info"}>
                  {evt.status}
                </Badge>
              </div>

              <div className="flex justify-between items-center text-xs text-muted-foreground border-t border-border/40 pt-3">
                <span className="flex items-center space-x-1">
                  <Award className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-semibold text-emerald-400">{evt.points} Points Reward</span>
                </span>
                <span>Date: {new Date(evt.startDate).toLocaleDateString("en-IN")}</span>
              </div>

              <div className="pt-2 flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs flex items-center justify-center space-x-1 border-blue-800/40 text-blue-300 hover:bg-blue-950/40"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEvent(evt);
                    setIsVerifyEventOpen(true);
                  }}
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Verify Participation</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TASK DETAIL WORKSPACE SLIDE-OVER PANEL ───────────────────────────── */}
      {activeDetailTask && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-card border-l border-border h-full overflow-y-auto p-6 shadow-2xl space-y-6 animate-in slide-in-from-right duration-200">
            {/* Top Workspace Header */}
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs uppercase font-bold text-blue-400 border-blue-800/60">
                    {(activeDetailTask as any).category || "Hardware Task"}
                  </Badge>
                  <Badge variant={activeDetailTask.status === "active" ? "success" : "secondary"} className="text-xs capitalize">
                    {activeDetailTask.status}
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold text-foreground">{activeDetailTask.title}</h2>
                <p className="text-xs text-muted-foreground">Semester: {semesterName}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setActiveDetailTask(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Task Statistics Header Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-center space-y-0.5">
                <div className="text-[10px] font-bold text-muted-foreground uppercase">Total Assigned</div>
                <div className="text-lg font-bold text-foreground">{enrolledMembers.length}</div>
              </div>
              <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-3 text-center space-y-0.5">
                <div className="text-[10px] font-bold text-emerald-400 uppercase">Completed</div>
                <div className="text-lg font-bold text-emerald-300">{taskCompletionsList.length}</div>
              </div>
              <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-3 text-center space-y-0.5">
                <div className="text-[10px] font-bold text-amber-400 uppercase">Pending</div>
                <div className="text-lg font-bold text-amber-300">{Math.max(0, enrolledMembers.length - taskCompletionsList.length)}</div>
              </div>
              <div className="rounded-xl border border-blue-800/40 bg-blue-950/20 p-3 text-center space-y-0.5">
                <div className="text-[10px] font-bold text-blue-400 uppercase">Completion %</div>
                <div className="text-lg font-bold text-blue-300">
                  {enrolledMembers.length === 0 ? 0 : Math.round((taskCompletionsList.length / enrolledMembers.length) * 100)}%
                </div>
              </div>
              <div className="rounded-xl border border-purple-800/40 bg-purple-950/20 p-3 text-center space-y-0.5 col-span-2 sm:col-span-1">
                <div className="text-[10px] font-bold text-purple-400 uppercase">Total Points</div>
                <div className="text-lg font-bold text-purple-300">{taskCompletionsList.length * (activeDetailTask.points || 15)} Pts</div>
              </div>
            </div>

            {/* Task Overview Card */}
            <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3 text-xs">
              <h3 className="font-bold text-foreground text-xs uppercase tracking-wide flex items-center gap-1.5">
                <Info className="h-4 w-4 text-blue-400" /> Task Overview & Parameters
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {activeDetailTask.description || "Technical assignment designed to build practical robotics skills."}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-medium">
                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">Reward Points</span>
                  <span className="text-emerald-400 font-bold text-sm">{activeDetailTask.points} Pts</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">Due Date</span>
                  <span>{activeDetailTask.dueDate ? new Date(activeDetailTask.dueDate).toLocaleDateString("en-IN") : "No limit"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">Created Date</span>
                  <span>{new Date(activeDetailTask.createdAt).toLocaleDateString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">Created By</span>
                  <span>System Coordinator</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-b border-border py-3">
              <Button
                size="sm"
                onClick={() => {
                  setSelectedTask(activeDetailTask);
                  setIsVerifyTaskOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold gap-1.5"
              >
                <CheckCircle className="h-4 w-4" /> Verify Member Completion
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExportTaskCsv(activeDetailTask.id)}
                disabled={isPending}
                className="text-xs gap-1.5 border-border bg-card"
              >
                <Download className="h-4 w-4 text-emerald-400" /> Export Task CSV
              </Button>
            </div>

            {/* Member Completion Table */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-blue-400" /> Member Completion Records ({taskCompletionsList.length})
                </h3>
              </div>

              {isTaskWorkspaceLoading ? (
                <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" /> Loading completion records...
                </div>
              ) : taskCompletionsList.length === 0 ? (
                <div className="rounded-xl border border-border bg-muted/20 py-8 text-center text-xs text-muted-foreground">
                  No member completions logged for this task yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs text-foreground whitespace-nowrap">
                    <thead className="border-b border-border bg-muted/40 font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2.5">MEMBERSHIP ID</th>
                        <th className="px-3 py-2.5">MEMBER NAME</th>
                        <th className="px-3 py-2.5">BRANCH</th>
                        <th className="px-3 py-2.5">COMPLETION DATE</th>
                        <th className="px-3 py-2.5">POINTS</th>
                        <th className="px-3 py-2.5">STATUS</th>
                        <th className="px-3 py-2.5">VERIFIED BY</th>
                        <th className="px-3 py-2.5 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {taskCompletionsList.map((c: any) => (
                        <tr key={c.id} className="hover:bg-accent/30 transition-colors">
                          <td className="px-3 py-2.5 font-mono text-[11px] font-semibold text-blue-300">{c.membershipId || "—"}</td>
                          <td className="px-3 py-2.5 font-semibold">{c.memberName || "Member"}</td>
                          <td className="px-3 py-2.5 uppercase text-muted-foreground">{c.branch || "—"}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {c.completedAt ? new Date(c.completedAt).toLocaleString("en-IN") : c.createdAt ? new Date(c.createdAt).toLocaleString("en-IN") : "—"}
                          </td>
                          <td className="px-3 py-2.5 font-bold text-emerald-400">+{activeDetailTask.points} Pts</td>
                          <td className="px-3 py-2.5">
                            <Badge variant={c.isRevoked ? "destructive" : "success"} className="text-[10px]">
                              {c.isRevoked ? "Revoked" : "Verified"}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground text-[11px]">{c.verifierName || "System Coordinator"}</td>
                          <td className="px-3 py-2.5 text-right">
                            {!c.isRevoked && (
                              <button
                                onClick={() => handleRevokeTaskCompletion(c.id)}
                                disabled={isPending}
                                className="text-[10px] text-muted-foreground hover:text-red-400 underline transition-colors"
                              >
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── EVENT DETAIL WORKSPACE SLIDE-OVER PANEL ──────────────────────────── */}
      {activeDetailEvent && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-card border-l border-border h-full overflow-y-auto p-6 shadow-2xl space-y-6 animate-in slide-in-from-right duration-200">
            {/* Top Workspace Header */}
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs uppercase font-bold text-blue-400 border-blue-800/60">
                    Robotics Event
                  </Badge>
                  <Badge variant={activeDetailEvent.status === "published" ? "success" : "info"} className="text-xs capitalize">
                    {activeDetailEvent.status}
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold text-foreground">{activeDetailEvent.name}</h2>
                <p className="text-xs text-muted-foreground">Semester: {semesterName}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setActiveDetailEvent(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Event Statistics Header Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-center space-y-0.5">
                <div className="text-[10px] font-bold text-muted-foreground uppercase">Registered</div>
                <div className="text-lg font-bold text-foreground">{enrolledMembers.length}</div>
              </div>
              <div className="rounded-xl border border-blue-800/40 bg-blue-950/20 p-3 text-center space-y-0.5">
                <div className="text-[10px] font-bold text-blue-400 uppercase">Participated</div>
                <div className="text-lg font-bold text-blue-300">{eventParticipationsList.length}</div>
              </div>
              <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-3 text-center space-y-0.5">
                <div className="text-[10px] font-bold text-emerald-400 uppercase">Verified</div>
                <div className="text-lg font-bold text-emerald-300">
                  {eventParticipationsList.filter((p: any) => p.attended).length}
                </div>
              </div>
              <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-3 text-center space-y-0.5">
                <div className="text-[10px] font-bold text-amber-400 uppercase">Attendance %</div>
                <div className="text-lg font-bold text-amber-300">
                  {enrolledMembers.length === 0 ? 0 : Math.round((eventParticipationsList.length / enrolledMembers.length) * 100)}%
                </div>
              </div>
              <div className="rounded-xl border border-purple-800/40 bg-purple-950/20 p-3 text-center space-y-0.5 col-span-2 sm:col-span-1">
                <div className="text-[10px] font-bold text-purple-400 uppercase">Total Points</div>
                <div className="text-lg font-bold text-purple-300">
                  {eventParticipationsList.filter((p: any) => p.attended).length * (activeDetailEvent.points || 25)} Pts
                </div>
              </div>
            </div>

            {/* Event Overview Card */}
            <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3 text-xs">
              <h3 className="font-bold text-foreground text-xs uppercase tracking-wide flex items-center gap-1.5">
                <Info className="h-4 w-4 text-blue-400" /> Event Information & Parameters
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {activeDetailEvent.description || "Official Robotics Club event designed to boost member collaboration and expertise."}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-medium">
                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">Reward Points</span>
                  <span className="text-emerald-400 font-bold text-sm">{activeDetailEvent.points} Pts</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">Venue</span>
                  <span>{activeDetailEvent.venue || "Auditorium"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">Event Date</span>
                  <span>{new Date(activeDetailEvent.startDate).toLocaleDateString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">Organizer</span>
                  <span>System Coordinator</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-b border-border py-3">
              <Button
                size="sm"
                onClick={() => {
                  setSelectedEvent(activeDetailEvent);
                  setIsVerifyEventOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold gap-1.5"
              >
                <UserCheck className="h-4 w-4" /> Verify Member Participation
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExportEventCsv(activeDetailEvent.id)}
                disabled={isPending}
                className="text-xs gap-1.5 border-border bg-card"
              >
                <Download className="h-4 w-4 text-emerald-400" /> Export Event CSV
              </Button>
            </div>

            {/* Participant Table */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-blue-400" /> Event Participant Records ({eventParticipationsList.length})
                </h3>
              </div>

              {isEventWorkspaceLoading ? (
                <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" /> Loading participant records...
                </div>
              ) : eventParticipationsList.length === 0 ? (
                <div className="rounded-xl border border-border bg-muted/20 py-8 text-center text-xs text-muted-foreground">
                  No verified participants logged for this event yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs text-foreground whitespace-nowrap">
                    <thead className="border-b border-border bg-muted/40 font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2.5">MEMBERSHIP ID</th>
                        <th className="px-3 py-2.5">MEMBER NAME</th>
                        <th className="px-3 py-2.5">BRANCH</th>
                        <th className="px-3 py-2.5">PARTICIPATION STATUS</th>
                        <th className="px-3 py-2.5">VERIFICATION STATUS</th>
                        <th className="px-3 py-2.5">POINTS AWARDED</th>
                        <th className="px-3 py-2.5">VERIFIED BY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {eventParticipationsList.map((p: any) => (
                        <tr key={p.id} className="hover:bg-accent/30 transition-colors">
                          <td className="px-3 py-2.5 font-mono text-[11px] font-semibold text-blue-300">{p.membershipId || "—"}</td>
                          <td className="px-3 py-2.5 font-semibold">{p.memberName || "Member"}</td>
                          <td className="px-3 py-2.5 uppercase text-muted-foreground">{p.branch || "—"}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{p.participationStatus || "Registered"}</td>
                          <td className="px-3 py-2.5">
                            <Badge variant={p.attended ? "success" : "secondary"} className="text-[10px]">
                              {p.attended ? "Verified" : "Pending"}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 font-bold text-emerald-400">
                            {p.attended ? `+${activeDetailEvent.points} Pts` : "0 Pts"}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground text-[11px]">{p.verifierName || "System Coordinator"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {isCreateEventOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Create Robotics Event</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsCreateEventOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Event Name</label>
                <input
                  type="text"
                  required
                  value={eventName}
                  placeholder="e.g. Autonomous Maze Runner Hackathon"
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Venue</label>
                <input
                  type="text"
                  value={eventVenue}
                  placeholder="e.g. CAD Lab / Auditorium"
                  onChange={(e) => setEventVenue(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Start Date</label>
                  <input
                    type="date"
                    required
                    value={eventStartDate}
                    onChange={(e) => setEventStartDate(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Points Award</label>
                  <input
                    type="number"
                    value={eventPoints}
                    onChange={(e) => setEventPoints(Number(e.target.value))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white" disabled={isPending}>
                {isPending ? "Creating..." : "Publish Event"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isCreateTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Create Technical Task</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsCreateTaskOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  placeholder="e.g. Assemble 4WD Chassis & Motor Drivers"
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Category</label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="Hardware">Hardware</option>
                    <option value="Software">Software</option>
                    <option value="Research">Research</option>
                    <option value="Workshop">Workshop</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Points Reward</label>
                  <input
                    type="number"
                    value={taskPoints}
                    onChange={(e) => setTaskPoints(Number(e.target.value))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white" disabled={isPending}>
                {isPending ? "Creating..." : "Create Task"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Verify Task Completion Modal */}
      {isVerifyTaskOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Verify Task Completion</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsVerifyTaskOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleVerifyTask} className="space-y-4 text-left">
              <div className="text-xs text-muted-foreground">
                Task: <span className="font-bold text-foreground">{selectedTask.title}</span> ({selectedTask.points} Pts)
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Select Member (Active Semester)</label>
                <select
                  required
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none"
                >
                  <option value="">-- Select Member --</option>
                  {sortMembersByClubMembershipId(enrolledMembers).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.clubMembershipId || m.memberId || "Member"} — {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold" disabled={isPending}>
                {isPending ? "Verifying..." : "Verify & Award Points"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Verify Event Participation Modal */}
      {isVerifyEventOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Verify Participation</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsVerifyEventOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleVerifyEvent} className="space-y-4 text-left">
              <div className="text-xs text-muted-foreground">
                Event: <span className="font-bold text-foreground">{selectedEvent.name}</span> ({selectedEvent.points} Pts)
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Select Member (Active Semester)</label>
                <select
                  required
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none"
                >
                  <option value="">-- Select Member --</option>
                  {sortMembersByClubMembershipId(enrolledMembers).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.clubMembershipId || m.memberId || "Member"} — {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold" disabled={isPending}>
                {isPending ? "Verifying..." : "Confirm Participation"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
