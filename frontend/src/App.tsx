import { useState, useMemo } from "react";
import { WeeklyView } from "@/pages/WeeklyPage";
import { CalendarView } from "@/pages/CalendarPage";
import { GoalsPage } from "@/pages/GoalsPage";
import { CompanionsPage } from "@/pages/CompanionsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { NotesPage } from "@/pages/NotesPage";
import { AppShellLayout } from "@/app/layout";
import {
  useWeekState,
  getMostRecentSunday,
  formatDateISO,
} from "@/features/weekly/useWeekState";
import { convertWeekToCalendarEvents } from "@/shared/lib/calendar/eventAdapters";

function App() {
  const [activeTab, setActiveTab] = useState("notes");
  const { weekState, actions, availableWeekStartsISO } = useWeekState();
  const [pendingWeeklyTaskId, setPendingWeeklyTaskId] = useState<string | null>(
    null
  );

  const handleOpenWeeklyTask = (taskId: string) => {
    setPendingWeeklyTaskId(taskId);
    setActiveTab("weekly");
  };

  const handleTabChange = (nextTab: string) => {
    if (nextTab === "weekly" && activeTab !== "weekly") {
      actions.setWeekStart(formatDateISO(getMostRecentSunday()));
      setActiveTab("weekly");
      return;
    }
    setActiveTab(nextTab);
  };

  // Convert weekly tasks to calendar events
  const calendarEvents = useMemo(() => {
    return convertWeekToCalendarEvents(weekState);
  }, [weekState]);

  return (
    <AppShellLayout activeTab={activeTab} onTabChange={handleTabChange}>
      {activeTab === "weekly" && (
        <WeeklyView
          weekState={weekState}
          actions={actions}
          openTaskId={pendingWeeklyTaskId}
          onOpenTaskHandled={() => setPendingWeeklyTaskId(null)}
          availableWeekStartsISO={availableWeekStartsISO}
          onSelectWeekStart={(iso) => {
            actions.setWeekStart(iso);
            setActiveTab("weekly");
          }}
          onCreateCurrentWeek={actions.createOrSelectCurrentWeek}
          onCreateWeekForDate={actions.createOrSelectWeekForDate}
        />
      )}
      {activeTab === "calendar" && <CalendarView events={calendarEvents} />}
      {activeTab === "goals" && (
        <GoalsPage
          weekState={weekState}
          actions={actions}
          onOpenWeeklyTask={handleOpenWeeklyTask}
        />
      )}
      {activeTab === "companions" && (
        <CompanionsPage weekState={weekState} actions={actions} />
      )}
      {activeTab === "settings" && (
        <SettingsPage weekState={weekState} actions={actions} />
      )}
      {activeTab === "notes" && <NotesPage />}
    </AppShellLayout>
  );
}

export default App;
