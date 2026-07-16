import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { STATUSES } from "../../../shared/const";
import {
  fetchLeads,
  updateLeadStatus,
  getTrafficLight,
  formatRelativeTime,
  isLeadFromToday,
  formatFollowUpLabel,
  isFollowUpOverdue,
  Lead,
} from "@/lib/api";
import { RefreshCw, Clock, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

const SOURCES = [
  { value: "Top Care", label: "Top Care" },
  { value: "Eye World", label: "Eye World" },
  { value: "Dr. Ihab", label: "Dr. Ihab" },
  { value: "WhatsApp", label: "WhatsApp" },
];

interface MonitorProps {
  refreshTrigger?: number;
}

export default function Monitor({ refreshTrigger }: MonitorProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState("");
  const [updateNote, setUpdateNote] = useState("");

  // Pagination state
  const [viewMode, setViewMode] = useState<"today" | "month">("today");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const data = await fetchLeads();
      setLeads(data);
    } catch (error) {
      toast.error("Failed to load leads");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [refreshTrigger]);

  useEffect(() => {
    const interval = setInterval(loadLeads, 10000);
    return () => clearInterval(interval);
  }, []);

  // Get all leads (not filtered by today)
  const allFilteredLeads = leads.filter((lead) => {
    if (filter === "All") return true;
    if (filter === "New") return !lead.status;
    return lead.status === filter;
  });

  // Get today's leads for stats
  const todayLeads = allFilteredLeads.filter((lead) => isLeadFromToday(lead.timestamp));

  // Calculate stats based on TODAY's leads only
  const stats = {
    onTrack: todayLeads.filter((lead) => getTrafficLight(lead) === "green").length,
    atRisk: todayLeads.filter((lead) => getTrafficLight(lead) === "yellow").length,
    overdue: todayLeads.filter((lead) => getTrafficLight(lead) === "red").length,
  };

  const sourceStats = SOURCES.reduce(
    (acc, source) => {
      acc[source.value] = todayLeads.filter((lead) => lead.source === source.value).length;
      return acc;
    },
    {} as Record<string, number>
  );



  // Get leads for display based on view mode
  const getDisplayLeads = () => {
    if (viewMode === "today") {
      return todayLeads;
    } else {
      // Filter by selected month
      if (!selectedMonth) return [];
      const [year, month] = selectedMonth.split("-");
      return allFilteredLeads.filter((lead) => {
        if (!lead.timestamp) return false;
        const leadDate = new Date(lead.timestamp);
        return (
          leadDate.getFullYear() === parseInt(year) &&
          leadDate.getMonth() === parseInt(month) - 1
        );
      });
    }
  };

  const displayLeads = getDisplayLeads();
  const totalPages = Math.ceil(displayLeads.length / ITEMS_PER_PAGE);
  const paginatedLeads = displayLeads.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  // Generate month options (last 12 months)
  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const label = date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
      options.push({ value: `${year}-${month}`, label });
    }
    return options;
  };

  const handleOpenDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setUpdateStatus(lead.status || "");
    setUpdateNote(lead.adminNote || "");
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedLead) return;

    // Validate admin note is not empty
    if (!updateNote.trim()) {
      toast.error("A note is required to save changes");
      return;
    }

    setIsLoading(true);
    try {
      await updateLeadStatus(selectedLead.id, updateStatus, updateNote, selectedLead.followUp as any);
      toast.success("Lead updated successfully");
      setIsDialogOpen(false);
      await loadLeads();
    } catch (error: any) {
      // Display backend error message if available
      const errorMsg = error?.message || "Failed to update lead";
      toast.error(errorMsg);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrafficLightEmoji = (light: string) => {
    switch (light) {
      case "green":
        return "🟢";
      case "yellow":
        return "🟡";
      case "red":
        return "🔴";
      case "gray":
        return "⚫";
      default:
        return "⚫";
    }
  };

  const isBlackoutWindow = () => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();

    return day === 5 || day === 6 || hour < 11 || hour >= 19;
  };

  return (
    <div className="space-y-4 pb-20">
      {isBlackoutWindow() && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">Off-Hours Active</p>
            <p className="text-xs text-amber-700">SLA timers are paused outside working hours (11am-7pm, Sun-Thu)</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-primary">Today's Dashboard</h2>
        <Button
          onClick={loadLeads}
          disabled={isLoading}
          size="sm"
          variant="outline"
          className="border-primary text-primary"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Card className="border-0 shadow-sm bg-green-50">
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.onTrack}</div>
              <p className="text-xs text-green-700 font-medium">On Track</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-yellow-50">
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.atRisk}</div>
              <p className="text-xs text-yellow-700 font-medium">At Risk</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-red-50">
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <p className="text-xs text-red-700 font-medium">Overdue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-primary">Leads by Source</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {Object.entries(sourceStats).map(([source, count]) => (
            <div key={source} className="flex justify-between">
              <span className="text-foreground/70">{source}</span>
              <span className="font-medium text-primary">{count}</span>
            </div>
          ))}
        </CardContent>
      </Card>



      <div className="space-y-2">
        <div className="flex gap-1 overflow-x-auto pb-2">
          {["All", "New", "Pending Call Center", "Under Follow-Up", "Booked/Confirmed", "Canceled", "Re-engage Lead"].map((f) => (
            <Button
              key={f}
              onClick={() => {
                setFilter(f);
                setCurrentPage(0);
              }}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              className="whitespace-nowrap"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* View Mode and Pagination Controls */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              View Leads
            </label>
            <Select value={viewMode} onValueChange={(value) => {
              setViewMode(value as "today" | "month");
              setCurrentPage(0);
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today's Leads</SelectItem>
                <SelectItem value="month">By Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {viewMode === "month" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Select Month
              </label>
              <Select value={selectedMonth} onValueChange={(value) => {
                setSelectedMonth(value);
                setCurrentPage(0);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose month" />
                </SelectTrigger>
                <SelectContent>
                  {getMonthOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {displayLeads.length > 0 && (
            <div className="flex items-center justify-between text-xs text-foreground/60">
              <span>
                Showing {currentPage * ITEMS_PER_PAGE + 1}-
                {Math.min((currentPage + 1) * ITEMS_PER_PAGE, displayLeads.length)} of{" "}
                {displayLeads.length}
              </span>
              <div className="flex gap-1">
                <Button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= totalPages - 1}
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leads List */}
      <div className="space-y-2">
        {paginatedLeads.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-foreground/60">
                {viewMode === "today" ? "No leads for today" : "No leads for selected month"}
              </p>
            </CardContent>
          </Card>
        ) : (
          paginatedLeads.map((lead) => {
            const light = getTrafficLight(lead);
            const emoji = getTrafficLightEmoji(light);

            return (
              <Card
                key={lead.id}
                className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleOpenDialog(lead)}
              >
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-foreground">{lead.name}</p>
                        <p className="text-sm text-foreground/70">{lead.phone}</p>
                      </div>
                      <span className="text-2xl">{emoji}</span>
                    </div>

                    {lead.source && (
                      <div className="text-xs text-foreground/60">
                        Source: <span className="font-medium">{lead.source}</span>
                      </div>
                    )}

                    {lead.dispatchedTo && (
                      <div className="text-xs text-foreground/60">
                        Assigned to: <span className="font-medium">{lead.dispatchedTo}</span>
                      </div>
                    )}

                    {lead.dispatchTimestamp && (
                      <div className="text-xs text-foreground/60 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(lead.dispatchTimestamp)}
                      </div>
                    )}

                    {lead.status && (
                      <div className="inline-flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                          {lead.status}
                        </span>
                        {isFollowUpOverdue(lead.followUp) && (
                          <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full font-medium">
                            {formatFollowUpLabel(lead.followUp)}
                          </span>
                        )}
                      </div>
                    )}

                    {lead.adminNote && (
                      <div className="text-xs text-foreground/70 bg-secondary/30 p-2 rounded">
                        <p className="font-medium mb-1">Note:</p>
                        <p>{lead.adminNote}</p>
                      </div>
                    )}

                    <p className="text-xs text-foreground/60 pt-1">Click to update status & notes</p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Update Status Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Lead Status</DialogTitle>
            <DialogDescription>
              {selectedLead?.name} - {selectedLead?.phone}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Status
              </label>
              <Select value={updateStatus} onValueChange={setUpdateStatus}>
                <SelectTrigger className="text-black font-medium bg-slate-50 border-slate-300">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending Call Center" className="text-black">Pending Call Center</SelectItem>
                  <SelectItem value="Under Follow-Up" className="text-black">Under Follow-Up</SelectItem>
                  <SelectItem value="Booked/Confirmed" className="text-black">Booked/Confirmed</SelectItem>
                  <SelectItem value="Canceled" className="text-black">Canceled</SelectItem>
                  <SelectItem value="Re-engage Lead" className="text-black">Re-engage Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Admin Call Discussion Note *
              </label>
              <Textarea
                placeholder="Input detailed discussion or follow-up note (e.g. Called patient, discussed doctor schedule)..."
                value={updateNote}
                onChange={(e) => setUpdateNote(e.target.value)}
                className="resize-none h-24 text-black font-medium bg-slate-50 border-slate-300 placeholder:text-black/50"
              />
              <p className="text-xs text-destructive mt-1.5 font-medium">
                A note is required to save changes
              </p>
            </div>

            <div className="flex items-center justify-between border border-border p-3 rounded-md bg-secondary/20">
              <div>
                <label className="text-sm font-semibold text-foreground">Follow-Up Due Date</label>
                <p className="text-xs text-muted-foreground">
                  {formatFollowUpLabel(selectedLead?.followUp)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedLead?.followUp && selectedLead.followUp !== "Yes" ? selectedLead.followUp : ""}
                  onChange={(e) => {
                    if (selectedLead) {
                      setSelectedLead({ ...selectedLead, followUp: e.target.value });
                    }
                  }}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm text-black"
                />
                {selectedLead?.followUp && (
                  <button
                    type="button"
                    onClick={() => setSelectedLead({ ...selectedLead!, followUp: "" })}
                    className="text-xs text-muted-foreground underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => setIsDialogOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStatus}
                disabled={isLoading || !updateNote.trim()}
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold"
              >
                {isLoading ? "Saving..." : "Update Lead"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}