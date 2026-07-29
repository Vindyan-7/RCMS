"use client";

/**
 * Operations Engine Client Component
 */

import { useState, useTransition } from "react";
import {
  createEventAction,
  updateEventAction,
  verifyEventParticipationAction,
  getEventsAction,
} from "@/actions/operations/events.actions";
import {
  createTaskAction,
  updateTaskAction,
  completeTaskAction,
  getTasksAction,
} from "@/actions/operations/tasks.actions";
import { EventSelect, TaskSelect } from "@/db/schema";
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
} from "lucide-react";

interface OperationsClientProps {
  initialEvents: EventSelect[];
  initialTasks: TaskSelect[];
}

export function OperationsClient({ initialEvents, initialTasks }: OperationsClientProps) {
  const [eventsList, setEventsList] = useState<EventSelect[]>(initialEvents);
  const [tasksList, setTasksList] = useState<TaskSelect[]>(initialTasks);
  const [activeTab, setActiveTab] = useState<"events" | "tasks">("events");

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

  const refreshAll = async () => {
    startTransition(async () => {
      const [evRes, tkRes] = await Promise.all([
        getEventsAction(),
        getTasksAction(),
      ]);
      if (evRes.success && evRes.data) setEventsList(evRes.data.items);
      if (tkRes.success && tkRes.data) setTasksList(tkRes.data.items);
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
        refreshAll();
      } else {
        alert(res.error?.message || "Event participation verification failed");
      }
    });
  };

  return (
    <div className="space-y-6 text-left">
      {/* Controls & Tab Selection */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-2 border-b border-border text-sm font-semibold">
          <button
            onClick={() => setActiveTab("events")}
            className={`pb-2 px-3 flex items-center space-x-2 ${
              activeTab === "events" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Robotics Operations & Events ({eventsList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`pb-2 px-3 flex items-center space-x-2 ${
              activeTab === "tasks" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            <span>Technical Tasks Engine ({tasksList.length})</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={refreshAll} disabled={isPending}>
            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          </Button>
          {activeTab === "events" ? (
            <Button className="flex items-center space-x-2" onClick={() => setIsCreateEventOpen(true)}>
              <Plus className="h-4 w-4" />
              <span>Create Event</span>
            </Button>
          ) : (
            <Button className="flex items-center space-x-2" onClick={() => setIsCreateTaskOpen(true)}>
              <Plus className="h-4 w-4" />
              <span>Create Task</span>
            </Button>
          )}
        </div>
      </div>

      {/* Events View */}
      {activeTab === "events" && (
        <div className="grid gap-6 md:grid-cols-2">
          {eventsList.map((evt) => (
            <div key={evt.id} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-foreground text-base">{evt.name}</h3>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{evt.venue || "Main Auditorium"}</span>
                  </div>
                </div>
                <Badge variant={evt.status === "published" ? "success" : "info"}>
                  {evt.status}
                </Badge>
              </div>

              <div className="flex justify-between items-center text-xs text-muted-foreground border-t border-border pt-3">
                <span className="flex items-center space-x-1">
                  <Award className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="font-semibold text-emerald-500">{evt.points} Points Reward</span>
                </span>
                <span>Date: {new Date(evt.startDate).toLocaleDateString()}</span>
              </div>

              <div className="pt-2 flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs flex items-center justify-center space-x-1"
                  onClick={() => {
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

      {/* Tasks View */}
      {activeTab === "tasks" && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tasksList.map((tsk) => (
            <div key={tsk.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-foreground text-sm">{tsk.title}</h4>
                  <Badge variant="outline" className="mt-1 text-[10px]">
                    {(tsk as any).category || "Hardware"}
                  </Badge>
                </div>
                <Badge variant={tsk.status === "active" ? "success" : "secondary"}>
                  {tsk.status}
                </Badge>
              </div>

              <div className="flex justify-between items-center text-xs text-muted-foreground border-t border-border pt-3">
                <span className="font-bold text-emerald-500">{tsk.points} Pts Reward</span>
              </div>

              <Button
                size="sm"
                className="w-full text-xs flex items-center justify-center space-x-1"
                onClick={() => {
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

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Creating Event..." : "Publish Event"}
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
                  placeholder="e.g. Wire motor driver circuit"
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
                    <option value="Robotics">Robotics</option>
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

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Creating Task..." : "Save Task"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Verify Task Modal */}
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
                <label className="text-xs font-semibold">Member UUID</label>
                <input
                  type="text"
                  required
                  value={memberId}
                  placeholder="Paste Member ID..."
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
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
                <label className="text-xs font-semibold">Member UUID</label>
                <input
                  type="text"
                  required
                  value={memberId}
                  placeholder="Paste Member ID..."
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Verifying..." : "Confirm Participation"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
