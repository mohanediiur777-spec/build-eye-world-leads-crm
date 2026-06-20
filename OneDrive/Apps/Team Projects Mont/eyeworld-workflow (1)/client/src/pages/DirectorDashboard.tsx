import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import {
  Plus, LogOut, Bell, Clock, Eye, MessageSquare, Truck,
  CheckCircle, ChevronRight, Send, User, Calendar,
  FolderOpen, AlertCircle, Loader2,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

// ── Status configuration ───────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode; label: string }> = {
  "Sent":       { bg: "bg-amber-50",    text: "text-amber-800",   border: "border-amber-200",  icon: <Send className="w-3 h-3" />,         label: "Sent" },
  "Seen":       { bg: "bg-blue-50",     text: "text-blue-800",    border: "border-blue-200",   icon: <Eye className="w-3 h-3" />,          label: "Seen" },
  "In Progress":{ bg: "bg-violet-50",   text: "text-violet-800",  border: "border-violet-200", icon: <Clock className="w-3 h-3" />,        label: "In Progress" },
  "Delivered":  { bg: "bg-orange-50",   text: "text-orange-800",  border: "border-orange-200", icon: <Truck className="w-3 h-3" />,        label: "Delivered" },
  "Approved":   { bg: "bg-emerald-50",  text: "text-emerald-800", border: "border-emerald-200",icon: <CheckCircle className="w-3 h-3" />,  label: "Approved" },
};

// Team members (director's view — matches pinAuth TEAM_MEMBERS)
const TEAM_MEMBERS = [
  { name: "Hadeer", role: "media_buyer",     roleLabel: "Media Buyer",     initial: "H", color: "from-violet-500 to-purple-600" },
  { name: "Bakr",   role: "designer",        roleLabel: "Designer",        initial: "B", color: "from-blue-500 to-indigo-600" },
  { name: "Asmaa",  role: "content_creator", roleLabel: "Content Creator", initial: "A", color: "from-emerald-500 to-teal-600" },
] as const;

type TeamMemberKey = typeof TEAM_MEMBERS[number];

// ── Timestamp timeline row ─────────────────────────────────────────────────
function TimelineRow({ label, date, icon }: { label: string; date: Date | null | undefined; icon: React.ReactNode }) {
  if (!date) {
    return (
      <div className="flex items-center gap-3 text-slate-400">
        <span className="w-5 h-5 flex-shrink-0 opacity-30">{icon}</span>
        <span className="text-xs">{label}</span>
        <span className="ml-auto text-xs">—</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 text-slate-700">
      <span className="w-5 h-5 flex-shrink-0 text-blue-500">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
      <span className="ml-auto text-xs text-slate-500">{format(date, "MMM d, HH:mm")}</span>
    </div>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-200", icon: null, label: status };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ── Main director dashboard ────────────────────────────────────────────────
export default function DirectorDashboard() {
  const [, navigate]    = useLocation();
  const [selectedMember, setSelectedMember] = useState<TeamMemberKey>(TEAM_MEMBERS[0]);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  // Quick-assign form state
  const [form, setForm] = useState({ title: "", projectName: "", description: "", deadline: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch team members from DB to get their IDs
  const { data: dbTeamMembers } = trpc.workflow.getTeamMembers.useQuery();

  // Get the DB user for the selected member
  useEffect(() => {
    if (dbTeamMembers) {
      const found = dbTeamMembers.find(u => u.name === selectedMember.name);
      setSelectedMemberId(found ? found.id : null);
      setSelectedTaskId(null);
    }
  }, [selectedMember, dbTeamMembers]);

  // Fetch tasks for selected member
  const { data: tasks, isLoading: tasksLoading, refetch: refetchTasks } = trpc.workflow.getTeamMemberTasks.useQuery(
    { userId: selectedMemberId! },
    { enabled: selectedMemberId !== null }
  );

  // Fetch selected task detail
  const { data: taskDetail, isLoading: taskDetailLoading, refetch: refetchDetail } = trpc.workflow.getRequest.useQuery(
    { id: selectedTaskId! },
    { enabled: selectedTaskId !== null }
  );

  // Create task mutation
  const createTaskMutation = trpc.workflow.createTask.useMutation({
    onSuccess: () => {
      toast.success("Task assigned!");
      setForm({ title: "", projectName: "", description: "", deadline: "" });
      setIsSubmitting(false);
      refetchTasks();
    },
    onError: err => {
      toast.error(err.message || "Failed to create task");
      setIsSubmitting(false);
    },
  });

  // Approve mutation
  const approveMutation = trpc.workflow.approveTask.useMutation({
    onSuccess: () => { toast.success("Task approved!"); refetchDetail(); refetchTasks(); },
    onError: err => toast.error(err.message || "Failed to approve"),
  });

  // Request changes mutation
  const changesMutation = trpc.workflow.requestChanges.useMutation({
    onSuccess: () => { toast.success("Changes requested."); refetchDetail(); refetchTasks(); },
    onError: err => toast.error(err.message || "Failed"),
  });

  const handleLogout = () => {
    fetch("/api/auth/pin-logout", { method: "POST", credentials: "include" }).finally(() => {
      localStorage.removeItem("user");
      window.location.href = "/";
    });
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.projectName.trim()) {
      toast.error("Title and Project Name are required");
      return;
    }
    if (!selectedMemberId) {
      toast.error("Could not find team member ID — check DB connection");
      return;
    }
    setIsSubmitting(true);
    await createTaskMutation.mutateAsync({
      title: form.title,
      projectName: form.projectName,
      description: form.description || undefined,
      assignedToId: selectedMemberId,
      deadline: form.deadline ? new Date(form.deadline) : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* ── Header ── */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow">
              H
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm leading-none">Hamdi</p>
              <p className="text-xs text-slate-500">Director</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors text-sm text-slate-600 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-[240px_1fr_360px] gap-6 min-h-[calc(100vh-5rem)]">

          {/* ── LEFT: Team member selector ── */}
          <aside className="space-y-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">Team</h2>
            {TEAM_MEMBERS.map(member => {
              const isSelected = member.name === selectedMember.name;
              const memberTasks = tasks;
              const undelivered = memberTasks?.filter(t => t.status !== "Approved" && t.status !== "Delivered").length ?? 0;
              const isCurrentMember = member.name === selectedMember.name;

              return (
                <button
                  key={member.name}
                  onClick={() => setSelectedMember(member)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                    {member.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${isSelected ? "text-blue-900" : "text-slate-900"}`}>
                      {member.name}
                    </p>
                    <p className={`text-xs ${isSelected ? "text-blue-600" : "text-slate-500"}`}>
                      {member.roleLabel}
                    </p>
                  </div>
                  {isCurrentMember && undelivered > 0 && (
                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {undelivered}
                    </span>
                  )}
                  {isSelected && <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                </button>
              );
            })}

            {/* Quick assign form */}
            <div className="mt-6">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1 mb-3">
                Quick Assign to {selectedMember.name}
              </h2>
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <form onSubmit={handleCreateTask} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="taskTitle" className="text-xs text-slate-600 font-medium">
                        Task Title *
                      </Label>
                      <Input
                        id="taskTitle"
                        placeholder="e.g. Instagram Banner"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        className="h-8 text-sm border-slate-200"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="projectName" className="text-xs text-slate-600 font-medium">
                        Project Name *
                      </Label>
                      <Input
                        id="projectName"
                        placeholder="e.g. Q3 Launch"
                        value={form.projectName}
                        onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))}
                        className="h-8 text-sm border-slate-200"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="taskDesc" className="text-xs text-slate-600 font-medium">
                        Notes (optional)
                      </Label>
                      <Textarea
                        id="taskDesc"
                        placeholder="Additional details…"
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        rows={2}
                        className="text-sm border-slate-200 resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="taskDeadline" className="text-xs text-slate-600 font-medium">
                        Deadline (optional)
                      </Label>
                      <Input
                        id="taskDeadline"
                        type="datetime-local"
                        value={form.deadline}
                        onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                        className="h-8 text-sm border-slate-200"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !form.title || !form.projectName}
                      className="w-full h-8 text-sm bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isSubmitting
                        ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Sending…</>
                        : <><Send className="w-3.5 h-3.5 mr-1.5" />Assign Task</>
                      }
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* ── CENTER: Task history ── */}
          <main className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {selectedMember.name}'s Tasks
                </h1>
                <p className="text-slate-500 text-sm mt-0.5">{selectedMember.roleLabel}</p>
              </div>
              <div className="text-sm text-slate-500">
                {tasks ? `${tasks.length} task${tasks.length !== 1 ? "s" : ""}` : ""}
              </div>
            </div>

            {tasksLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
              </div>
            ) : !tasks || tasks.length === 0 ? (
              <Card className="border-dashed border-slate-300 bg-slate-50/50">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <FolderOpen className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-slate-600 font-medium">No tasks yet</p>
                  <p className="text-slate-400 text-sm mt-1">Use the form on the left to assign a task.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {tasks.map(task => {
                  const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG["Sent"];
                  const isSelected = task.id === selectedTaskId;
                  return (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTaskId(isSelected ? null : task.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-sm ${
                        isSelected
                          ? "border-blue-400 bg-blue-50/50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900 text-sm truncate">{task.title}</p>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            <span className="font-medium text-slate-600">{task.projectName || "—"}</span>
                            {task.deadline && (
                              <span className="ml-2 text-amber-600">
                                · Due {format(new Date(task.deadline), "MMM d")}
                              </span>
                            )}
                          </p>
                        </div>
                        <StatusBadge status={task.status} />
                      </div>
                      {/* Compact timestamp row */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                        {task.sentAt && <span title="Sent"><Send className="w-3 h-3 inline mr-1" />{format(new Date(task.sentAt), "MMM d")}</span>}
                        {task.viewedAt && <span title="Seen"><Eye className="w-3 h-3 inline mr-1" />{format(new Date(task.viewedAt), "MMM d")}</span>}
                        {task.repliedAt && <span title="Replied"><MessageSquare className="w-3 h-3 inline mr-1" />{format(new Date(task.repliedAt), "MMM d")}</span>}
                        {task.deliveredAt && <span title="Delivered"><Truck className="w-3 h-3 inline mr-1" />{format(new Date(task.deliveredAt), "MMM d")}</span>}
                        {task.approvedAt && <span title="Approved"><CheckCircle className="w-3 h-3 inline mr-1 text-emerald-500" />{format(new Date(task.approvedAt), "MMM d")}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </main>

          {/* ── RIGHT: Task detail panel ── */}
          <aside className="space-y-4">
            {selectedTaskId === null ? (
              <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400">
                <MessageSquare className="w-8 h-8 mb-3 opacity-40" />
                <p className="text-sm">Select a task to view details</p>
              </div>
            ) : taskDetailLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
            ) : taskDetail ? (
              <>
                {/* Task info card */}
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="border-b border-slate-200 bg-slate-50 pb-3 pt-4 px-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base text-slate-900 leading-tight">{taskDetail.title}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          Project: <span className="font-medium text-slate-700">{taskDetail.projectName || "—"}</span>
                        </CardDescription>
                      </div>
                      <StatusBadge status={taskDetail.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {taskDetail.description && (
                      <p className="text-sm text-slate-700">{taskDetail.description}</p>
                    )}
                    {taskDetail.deadline && (
                      <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Due {format(new Date(taskDetail.deadline), "MMM d, yyyy HH:mm")}</span>
                      </div>
                    )}

                    {/* Timeline */}
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Timeline</p>
                      <TimelineRow label="Sent"      date={taskDetail.sentAt}      icon={<Send className="w-3.5 h-3.5" />} />
                      <TimelineRow label="Seen"      date={taskDetail.viewedAt}    icon={<Eye className="w-3.5 h-3.5" />} />
                      <TimelineRow label="Replied"   date={taskDetail.repliedAt}   icon={<MessageSquare className="w-3.5 h-3.5" />} />
                      <TimelineRow label="Delivered" date={taskDetail.deliveredAt} icon={<Truck className="w-3.5 h-3.5" />} />
                      <TimelineRow label="Approved"  date={taskDetail.approvedAt}  icon={<CheckCircle className="w-3.5 h-3.5" />} />
                    </div>

                    {/* Director actions */}
                    {(taskDetail.status === "Delivered" || taskDetail.status === "In Progress" || taskDetail.status === "Seen") && (
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate({ taskId: taskDetail.id })}
                          disabled={approveMutation.isPending}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => changesMutation.mutate({ taskId: taskDetail.id })}
                          disabled={changesMutation.isPending}
                          className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50 text-xs h-8"
                        >
                          <AlertCircle className="w-3.5 h-3.5 mr-1" />
                          Request Changes
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Attachments */}
                {taskDetail.attachments && taskDetail.attachments.length > 0 && (
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-2 pt-3 px-4 border-b border-slate-100">
                      <CardTitle className="text-sm text-slate-700">Files ({taskDetail.attachments.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2">
                      {taskDetail.attachments.map(att => {
                        const isImage = att.mimeType?.startsWith("image/");
                        const isPdf   = att.mimeType === "application/pdf";
                        return (
                          <div key={att.id} className="border border-slate-200 rounded-lg overflow-hidden">
                            {isImage && att.storageUrl && !att.isDeleted && (
                              <img
                                src={att.storageUrl}
                                alt={att.fileName}
                                className="w-full max-h-48 object-cover"
                                loading="lazy"
                              />
                            )}
                            {isPdf && att.storageUrl && !att.isDeleted && (
                              <iframe
                                src={att.storageUrl}
                                title={att.fileName}
                                className="w-full h-48"
                              />
                            )}
                            <div className="flex items-center gap-2 p-2 bg-slate-50">
                              <p className="text-xs font-medium text-slate-700 truncate flex-1">{att.fileName}</p>
                              {att.isDeleted ? (
                                <span className="text-xs text-slate-400 italic">Deleted</span>
                              ) : att.storageUrl && (
                                <a
                                  href={att.storageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline flex-shrink-0"
                                >
                                  Open
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}

                {/* Comments thread */}
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-2 pt-3 px-4 border-b border-slate-100">
                    <CardTitle className="text-sm text-slate-700">
                      Thread ({taskDetail.comments?.length ?? 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2 max-h-64 overflow-y-auto">
                    {!taskDetail.comments || taskDetail.comments.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No messages yet</p>
                    ) : (
                      taskDetail.comments.map(comment => {
                        const isDirectorComment = comment.author?.role === "director";
                        return (
                          <div key={comment.id} className={`p-2.5 rounded-lg text-sm ${isDirectorComment ? "bg-blue-50 border border-blue-100" : "bg-slate-50 border border-slate-200"}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-semibold ${isDirectorComment ? "text-blue-700" : "text-slate-700"}`}>
                                {comment.author?.name ?? `User #${comment.authorId}`}
                              </span>
                              <span className="text-xs text-slate-400">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-slate-700 text-xs leading-relaxed">{comment.content}</p>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>

                {/* View full task link */}
                <Button
                  variant="outline"
                  className="w-full border-slate-200 text-slate-600 text-sm"
                  onClick={() => navigate(`/task/${selectedTaskId}`)}
                >
                  Open Full Task View
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
