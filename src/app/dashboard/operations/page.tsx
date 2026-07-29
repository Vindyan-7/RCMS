import { getEventsAction } from "@/actions/operations/events.actions";
import { getTasksAction } from "@/actions/operations/tasks.actions";
import { OperationsClient } from "@/components/operations/operations-client";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const [eventsRes, tasksRes] = await Promise.all([
    getEventsAction(),
    getTasksAction(),
  ]);

  const events = eventsRes.data?.items || [];
  const tasks = tasksRes.data?.items || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Operations Engine
        </h1>
        <p className="text-sm text-muted-foreground">
          Robotics Club workshops, competitions, technical task engine & participation verification
        </p>
      </div>

      <OperationsClient initialEvents={events} initialTasks={tasks} />
    </div>
  );
}
