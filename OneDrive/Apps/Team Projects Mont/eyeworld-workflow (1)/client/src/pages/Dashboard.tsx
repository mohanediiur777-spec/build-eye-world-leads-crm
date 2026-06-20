import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  FileText, Clock, CheckCircle, Send, Eye, Truck, LogOut, Globe,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

type TaskStatus = "Sent" | "Seen" | "In Progress" | "Delivered" | "Approved";
type StatusFilter = TaskStatus | null;

const STATUS_FILTERS: { label: string; value: TaskStatus; icon: React.ReactNode; color: string }[] = [
  { label: "Sent",        value: "Sent",        icon: <Send className="w-5 h-5" />,         color: "bg-amber-50 border-amber-200 hover:bg-amber-100" },
  { label: "Seen",        value: "Seen",        icon: <Eye className="w-5 h-5" />,           color: "bg-blue-50 border-blue-200 hover:bg-blue-100" },
  { label: "In Progress", value: "In Progress", icon: <Clock className="w-5 h-5" />,         color: "bg-violet-50 border-violet-200 hover:bg-violet-100" },
  { label: "Delivered",   value: "Delivered",   icon: <Truck className="w-5 h-5" />,         color: "bg-orange-50 border-orange-200 hover:bg-orange-100" },
  { label: "Approved",    value: "Approved",    icon: <CheckCircle className="w-5 h-5" />,   color: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100" },
];

const STATUS_BADGE: Record<TaskStatus, { bg: string; text: string; icon: React.ReactNode }> = {
  "Sent":        { bg: "bg-amber-100",   text: "text-amber-800",   icon: <Send className="w-3 h-3" /> },
  "Seen":        { bg: "bg-blue-100",    text: "text-blue-800",    icon: <Eye className="w-3 h-3" /> },
  "In Progress": { bg: "bg-violet-100",  text: "text-violet-800",  icon: <Clock className="w-3 h-3" /> },
  "Delivered":   { bg: "bg-orange-100",  text: "text-orange-800",  icon: <Truck className="w-3 h-3" /> },
  "Approved":    { bg: "bg-emerald-100", text: "text-emerald-800", icon: <CheckCircle className="w-3 h-3" /> },
};

export default function Dashboard() {
  const [, navigate]     = useLocation();
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>(null);
  const [language, setLanguage] = useState("en");
  const [user, setUser]  = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      // Redirect director to their dedicated dashboard
      if (parsed.role === "director") {
        navigate("/director");
      }
    }
  }, [navigate]);

  const { data: tasks, isLoading } = trpc.workflow.getMyTasks.useQuery(undefined, {
    enabled: !!user && user.role !== "director",
  });

  const filteredTasks = selectedStatus
    ? (tasks ?? []).filter(t => t.status === selectedStatus)
    : (tasks ?? []);

  const statusCounts = STATUS_FILTERS.reduce((acc, f) => {
    acc[f.value] = (tasks ?? []).filter(t => t.status === f.value).length;
    return acc;
  }, {} as Record<TaskStatus, number>);

  const handleLogout = () => {
    fetch("/api/auth/pin-logout", { method: "POST", credentials: "include" }).finally(() => {
      localStorage.removeItem("user");
      window.location.href = "/";
    });
  };

  const roleLabel = (role: string) =>
    ({ director: "Director", media_buyer: "Media Buyer", designer: "Designer", content_creator: "Content Creator" }[role] ?? role);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm leading-none">{user?.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{user ? roleLabel(user.role) : ""}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NotificationBell />
              <button
                onClick={() => setLanguage(language === "en" ? "ar" : "en")}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-sm text-slate-600"
              >
                <Globe className="w-4 h-4" />
                {language === "en" ? "العربية" : "English"}
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-sm text-slate-600"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          <div className="mt-4">
            <h1 className="text-2xl font-bold text-slate-900">My Tasks</h1>
            <p className="text-slate-500 text-sm mt-0.5">Tasks assigned to you by the director</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status filter cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {STATUS_FILTERS.map(filter => (
            <button
              key={filter.value}
              onClick={() => setSelectedStatus(selectedStatus === filter.value ? null : filter.value)}
              className={`p-3 rounded-xl border-2 transition-all text-left ${
                selectedStatus === filter.value
                  ? `${filter.color} border-current shadow-sm`
                  : `${filter.color} border-transparent`
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">{filter.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {statusCounts[filter.value] ?? 0}
                  </p>
                </div>
                <div className="text-slate-400">{filter.icon}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Task list */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200 bg-slate-50">
            <CardTitle>Tasks</CardTitle>
            <CardDescription>
              {isLoading ? "Loading…" : `${filteredTasks.length} ${filteredTasks.length === 1 ? "task" : "tasks"}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">No tasks</p>
                <p className="text-slate-400 text-sm mt-1">
                  {selectedStatus ? "No tasks with this status" : "The director hasn't assigned any tasks yet"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filteredTasks.map(task => {
                  const badge = STATUS_BADGE[task.status as TaskStatus] ?? STATUS_BADGE["Sent"];
                  return (
                    <div
                      key={task.id}
                      onClick={() => navigate(`/task/${task.id}`)}
                      className="p-5 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 text-sm truncate">{task.title}</h3>
                          {task.projectName && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              Project: <span className="font-medium text-slate-600">{task.projectName}</span>
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                            {task.sentAt && (
                              <span>Assigned {format(new Date(task.sentAt), "MMM d, yyyy")}</span>
                            )}
                            {task.deadline && (
                              <span className="text-amber-600 font-medium">
                                · Due {format(new Date(task.deadline), "MMM d")}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border-0 ${badge.bg} ${badge.text} flex-shrink-0`}>
                          {badge.icon}
                          <span className="ml-1">{task.status}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
