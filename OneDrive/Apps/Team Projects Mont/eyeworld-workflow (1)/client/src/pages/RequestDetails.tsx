import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft, Send, Eye, Clock, CheckCircle, Truck,
  Loader2, FileText, Download, Upload, X,
  MessageSquare, AlertCircle, Calendar,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

// ── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  "Sent":        { bg: "bg-amber-100",   text: "text-amber-800",   icon: <Send className="w-3 h-3" /> },
  "Seen":        { bg: "bg-blue-100",    text: "text-blue-800",    icon: <Eye className="w-3 h-3" /> },
  "In Progress": { bg: "bg-violet-100",  text: "text-violet-800",  icon: <Clock className="w-3 h-3" /> },
  "Delivered":   { bg: "bg-orange-100",  text: "text-orange-800",  icon: <Truck className="w-3 h-3" /> },
  "Approved":    { bg: "bg-emerald-100", text: "text-emerald-800", icon: <CheckCircle className="w-3 h-3" /> },
};

interface TaskDetailProps {
  requestId: string;
}

export default function TaskDetail({ requestId }: TaskDetailProps) {
  const [, navigate]  = useLocation();
  const id            = parseInt(requestId, 10);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  const [newComment, setNewComment]     = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isDelivering, setIsDelivering] = useState(false);
  const [isApproving, setIsApproving]   = useState(false);
  const [isChanges, setIsChanges]       = useState(false);
  const [changesReason, setChangesReason] = useState("");
  const [showChangesInput, setShowChangesInput] = useState(false);
  const [pendingFile, setPendingFile]   = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const viewedRef   = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const { data: task, isLoading, refetch } = trpc.workflow.getRequest.useQuery(
    { id },
    { enabled: !isNaN(id) }
  );

  // Record first view (team member)
  const recordViewedMutation = trpc.workflow.recordViewed.useMutation();
  useEffect(() => {
    if (!task || viewedRef.current) return;
    if (user?.role !== "director") {
      viewedRef.current = true;
      recordViewedMutation.mutate({ taskId: id });
    }
  }, [task, user]);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [task?.comments?.length]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const addCommentMutation = trpc.workflow.addComment.useMutation({
    onSuccess: () => { setNewComment(""); setIsCommenting(false); refetch(); },
    onError: err => { toast.error(err.message || "Failed to send"); setIsCommenting(false); },
  });

  const uploadFileMutation = trpc.workflow.uploadFile.useMutation({
    onSuccess: () => { setPendingFile(null); refetch(); toast.success("File uploaded!"); },
    onError: err => { toast.error(err.message || "Upload failed"); },
  });

  const markDeliveredMutation = trpc.workflow.markDelivered.useMutation({
    onSuccess: () => { toast.success("Marked as Delivered!"); setIsDelivering(false); refetch(); },
    onError: err => { toast.error(err.message || "Failed"); setIsDelivering(false); },
  });

  const approveMutation = trpc.workflow.approveTask.useMutation({
    onSuccess: () => { toast.success("Task approved!"); setIsApproving(false); refetch(); },
    onError: err => { toast.error(err.message || "Failed to approve"); setIsApproving(false); },
  });

  const changesMutation = trpc.workflow.requestChanges.useMutation({
    onSuccess: () => { toast.success("Changes requested."); setIsChanges(false); setChangesReason(""); setShowChangesInput(false); refetch(); },
    onError: err => { toast.error(err.message || "Failed"); setIsChanges(false); },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsCommenting(true);
    await addCommentMutation.mutateAsync({ requestId: id, content: newComment });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error("File too large (max 50MB)"); return; }
    setPendingFile(file);
    e.currentTarget.value = "";
  };

  const handleFileUpload = async () => {
    if (!pendingFile) return;
    const buffer = await pendingFile.arrayBuffer();
    await uploadFileMutation.mutateAsync({
      requestId: id,
      fileName: pendingFile.name,
      fileContent: new Uint8Array(buffer),
      mimeType: pendingFile.type || "application/octet-stream",
    });
  };

  const isDirector   = user?.role === "director";
  const isTeamMember = !isDirector;

  // Can mark as delivered: team member when status is Sent/Seen/In Progress
  const canDeliver = isTeamMember && task && ["Sent", "Seen", "In Progress"].includes(task.status);
  // Can approve/request changes: director when status is Delivered (or Seen/In Progress for flexibility)
  const canApprove = isDirector && task && ["Delivered", "In Progress", "Seen", "Sent"].includes(task.status);
  const isApproved = task?.status === "Approved";

  const statusCfg = task ? (STATUS_CONFIG[task.status] ?? STATUS_CONFIG["Sent"]) : null;

  // ── Loading / not found ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <Card className="border-slate-200">
            <CardContent className="p-12 text-center">
              <p className="text-slate-600 font-medium">Task not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* ── Header ── */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(isDirector ? "/director" : "/")}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {isDirector ? "Director Dashboard" : "My Tasks"}
          </button>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* ── Task header ── */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{task.title}</h1>
              <p className="text-slate-500 text-sm mt-1">
                Project: <span className="font-medium text-slate-700">{task.projectName || "—"}</span>
              </p>
            </div>
            {statusCfg && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${statusCfg.bg} ${statusCfg.text} flex-shrink-0`}>
                {statusCfg.icon}
                <span>{task.status}</span>
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Main: chat/thread ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Lifecycle timeline */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3 pt-4 border-b border-slate-100 bg-slate-50">
                <CardTitle className="text-sm text-slate-700">Task Timeline</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center gap-0 relative">
                  {[
                    { label: "Sent",      ts: task.sentAt,      icon: <Send className="w-4 h-4" /> },
                    { label: "Seen",      ts: task.viewedAt,    icon: <Eye className="w-4 h-4" /> },
                    { label: "Replied",   ts: task.repliedAt,   icon: <MessageSquare className="w-4 h-4" /> },
                    { label: "Delivered", ts: task.deliveredAt, icon: <Truck className="w-4 h-4" /> },
                    { label: "Approved",  ts: task.approvedAt,  icon: <CheckCircle className="w-4 h-4" /> },
                  ].map((step, idx, arr) => {
                    const done = !!step.ts;
                    return (
                      <div key={step.label} className="flex-1 flex flex-col items-center relative">
                        {/* Connecting line */}
                        {idx > 0 && (
                          <div className={`absolute left-0 right-1/2 top-4 h-0.5 ${done ? "bg-blue-400" : "bg-slate-200"}`} style={{ transform: "translateX(-50%)" }} />
                        )}
                        {idx < arr.length - 1 && (
                          <div className={`absolute left-1/2 right-0 top-4 h-0.5 ${arr[idx + 1].ts ? "bg-blue-400" : "bg-slate-200"}`} style={{ transform: "translateX(50%)" }} />
                        )}
                        {/* Dot */}
                        <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                          done ? "bg-blue-500 border-blue-500 text-white" : "bg-white border-slate-300 text-slate-400"
                        }`}>
                          {step.icon}
                        </div>
                        <p className={`text-xs mt-1.5 font-medium ${done ? "text-slate-700" : "text-slate-400"}`}>{step.label}</p>
                        {step.ts && (
                          <p className="text-[10px] text-slate-400 mt-0.5">{format(new Date(step.ts), "MMM d")}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {task.description && (
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</p>
                  <p className="text-slate-700 text-sm leading-relaxed">{task.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Chat / comments thread */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3 pt-4 border-b border-slate-100 bg-slate-50">
                <CardTitle className="text-sm text-slate-700 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Collaboration Thread ({task.comments?.length ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Messages */}
                <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                  {!task.comments || task.comments.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-6">No messages yet. Start the conversation.</p>
                  ) : (
                    task.comments.map(comment => {
                      const commentIsDirector = comment.author?.role === "director";
                      const isOwn = comment.author?.name === user?.name;
                      return (
                        <div key={comment.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] rounded-xl px-4 py-2.5 ${
                            commentIsDirector
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-900"
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-semibold ${commentIsDirector ? "text-blue-100" : "text-slate-600"}`}>
                                {comment.author?.name ?? `User #${comment.authorId}`}
                              </span>
                              <span className={`text-xs ${commentIsDirector ? "text-blue-200" : "text-slate-400"}`}>
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed">{comment.content}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Attachments preview in thread */}
                {task.attachments && task.attachments.length > 0 && (
                  <div className="px-4 pb-4 space-y-2 border-t border-slate-100 pt-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Uploaded Files</p>
                    {task.attachments.map(att => {
                      const isImage = att.mimeType?.startsWith("image/");
                      const isPdf   = att.mimeType === "application/pdf";
                      return (
                        <div key={att.id} className="border border-slate-200 rounded-lg overflow-hidden">
                          {!att.isDeleted && isImage && att.storageUrl && (
                            <img
                              src={att.storageUrl}
                              alt={att.fileName}
                              className="w-full max-h-56 object-cover"
                              loading="lazy"
                            />
                          )}
                          {!att.isDeleted && isPdf && att.storageUrl && (
                            <iframe
                              src={att.storageUrl}
                              title={att.fileName}
                              className="w-full h-56"
                            />
                          )}
                          <div className="flex items-center gap-2 p-2 bg-slate-50">
                            <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-700 truncate">{att.fileName}</p>
                              {att.fileSize && (
                                <p className="text-xs text-slate-400">{(att.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                              )}
                            </div>
                            {att.isDeleted ? (
                              <span className="text-xs text-slate-400 italic flex-shrink-0">Deleted</span>
                            ) : att.storageUrl ? (
                              <a
                                href={att.storageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0"
                                title="Download"
                              >
                                <Download className="w-4 h-4 text-blue-600 hover:text-blue-800" />
                              </a>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Comment input + file upload */}
                {!isApproved && (
                  <div className="p-4 border-t border-slate-200 space-y-3">
                    {/* Pending file */}
                    {pendingFile && (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-sm text-blue-700 truncate flex-1">{pendingFile.name}</span>
                        <button
                          onClick={() => setPendingFile(null)}
                          className="text-blue-400 hover:text-blue-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <Button
                          size="sm"
                          onClick={handleFileUpload}
                          disabled={uploadFileMutation.isPending}
                          className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
                        >
                          {uploadFileMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Upload"}
                        </Button>
                      </div>
                    )}

                    <form onSubmit={handleSendComment} className="flex gap-2">
                      <Textarea
                        placeholder="Type a message…"
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        rows={2}
                        className="flex-1 text-sm border-slate-200 resize-none"
                        disabled={isCommenting}
                        onKeyDown={e => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (newComment.trim()) handleSendComment(e as any);
                          }
                        }}
                      />
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="h-9 w-9 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
                          title="Attach file"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                        <Button
                          type="submit"
                          disabled={!newComment.trim() || isCommenting}
                          className="h-9 w-9 p-0 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isCommenting
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Send className="w-4 h-4" />
                          }
                        </Button>
                      </div>
                    </form>
                    <input
                      ref={fileRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileSelect}
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                    />
                    <p className="text-xs text-slate-400">
                      Press Enter to send · Shift+Enter for new line · Max 50MB per file
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Sidebar: actions + meta ── */}
          <div className="space-y-4">
            {/* Team member: Mark as Delivered */}
            {canDeliver && (
              <Card className="border-orange-200 bg-orange-50 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-orange-900 mb-1">Ready to deliver?</p>
                  <p className="text-xs text-orange-700 mb-3">Click below to mark this task as delivered for director review.</p>
                  <Button
                    onClick={() => { setIsDelivering(true); markDeliveredMutation.mutate({ taskId: id }); }}
                    disabled={isDelivering}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                  >
                    {isDelivering
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Delivering…</>
                      : <><Truck className="w-4 h-4 mr-2" />Mark as Delivered</>
                    }
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Director: Approve / Request changes */}
            {canApprove && !isApproved && (
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Director Actions</p>
                  <Button
                    onClick={() => { setIsApproving(true); approveMutation.mutate({ taskId: id }); }}
                    disabled={isApproving}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isApproving
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Approving…</>
                      : <><CheckCircle className="w-4 h-4 mr-2" />Approve Task</>
                    }
                  </Button>

                  {showChangesInput ? (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="What changes are needed? (optional)"
                        value={changesReason}
                        onChange={e => setChangesReason(e.target.value)}
                        rows={2}
                        className="text-sm border-slate-200 resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowChangesInput(false)}
                          className="flex-1 border-slate-200 text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => { setIsChanges(true); changesMutation.mutate({ taskId: id, reason: changesReason || undefined }); }}
                          disabled={isChanges}
                          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs"
                        >
                          {isChanges ? <Loader2 className="w-3 h-3 animate-spin" /> : "Send"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setShowChangesInput(true)}
                      className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Request Changes
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Approved state */}
            {isApproved && (
              <Card className="border-emerald-200 bg-emerald-50 shadow-sm">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-emerald-800">Task Approved</p>
                  {task.approvedAt && (
                    <p className="text-xs text-emerald-600 mt-1">
                      {format(new Date(task.approvedAt), "MMM d, yyyy HH:mm")}
                    </p>
                  )}
                  <p className="text-xs text-emerald-600 mt-2">Files will be auto-deleted after 5 days.</p>
                </CardContent>
              </Card>
            )}

            {/* Task metadata */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2 pt-3 px-4 border-b border-slate-100 bg-slate-50">
                <CardTitle className="text-sm text-slate-700">Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {task.assignee && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Assigned To</p>
                    <p className="text-sm font-medium text-slate-900 mt-1">{task.assignee.name}</p>
                  </div>
                )}
                {task.submitter && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Assigned By</p>
                    <p className="text-sm font-medium text-slate-900 mt-1">{task.submitter.name}</p>
                  </div>
                )}
                {task.deadline && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-amber-50 border border-amber-100 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-amber-800 font-medium">Deadline</p>
                      <p className="text-xs text-amber-700">{format(new Date(task.deadline), "MMM d, yyyy HH:mm")}</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Created</p>
                  <p className="text-xs text-slate-600 mt-1">{format(new Date(task.createdAt), "MMM d, yyyy HH:mm")}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
