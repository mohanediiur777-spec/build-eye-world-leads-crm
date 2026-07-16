import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { getTrafficLight, fetchLeads, updateLeadStatus, Lead, formatRelativeTime, formatFollowUpLabel, isFollowUpOverdue } from "@/lib/api";

const FILTER_TABS = [
  "All",
  "Pending Call Center",
  "Under Follow-Up",
  "Booked/Confirmed",
  "Canceled",
  "Re-engage Lead",
];

export default function CallCenter() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState("");
  const [newNote, setNewNote] = useState("");

  const loadLeads = async () => {
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
    const interval = setInterval(loadLeads, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredLeads = leads
    .filter((lead) => {
      if (filter === "All") return true;
      return lead.status === filter;
    })
    .sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });

  const reEngageCount = leads.filter((l) => l.status === "Re-engage Lead").length;

  const handleRowClick = (lead: Lead) => {
    setSelectedLead(lead);
    setUpdateStatus(lead.status || "Pending Call Center");
    setNewNote("");
    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    if (!selectedLead) return;
    setIsLoading(true);
    try {
      await updateLeadStatus(selectedLead.id, updateStatus, newNote, selectedLead.followUp as any);
      toast.success("Lead updated successfully");
      setIsSheetOpen(false);
      await loadLeads();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update lead");
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority?: string) => {
    if (priority?.startsWith("Hot")) return "bg-red-100 text-red-700";
    if (priority?.startsWith("Warm")) return "bg-orange-100 text-orange-700";
    if (priority?.startsWith("Cold")) return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-700";
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Pending Call Center":
        return "bg-yellow-100 text-yellow-700";
      case "Under Follow-Up":
        return "bg-blue-100 text-blue-700";
      case "Booked/Confirmed":
        return "bg-green-100 text-green-700";
      case "Canceled":
        return "bg-gray-100 text-gray-600";
      case "Re-engage Lead":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTrafficLightEmoji = (light: string) => {
    if (light === "red") return "🔴";
    if (light === "yellow") return "🟡";
    if (light === "green") return "🟢";
    return "⚫";
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Call Center Dashboard</h1>
        <Badge variant="secondary" className="text-sm">
          {leads.length} Leads
        </Badge>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {FILTER_TABS.map((tab) => (
          <Button
            key={tab}
            onClick={() => setFilter(tab)}
            variant={filter === tab ? "default" : "outline"}
            size="sm"
            className="whitespace-nowrap flex items-center gap-2"
          >
            {tab}
            {tab === "Re-engage Lead" && reEngageCount > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 min-w-[20px] text-xs">
                {reEngageCount}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {isLoading && leads.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading leads...</p>
      ) : (
        <div className="space-y-2">
          {filteredLeads.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-foreground/60">No leads found for this filter</p>
              </CardContent>
            </Card>
          ) : (
            filteredLeads.map((lead) => {
              const entity = lead.entity || lead.source || "N/A";
              const slaEmoji = getTrafficLightEmoji(getTrafficLight(lead));

              return (
                <Card
                  key={lead.id}
                  className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleRowClick(lead)}
                >
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-base">{lead.name}</p>
                        <a
                          href={`tel:${lead.phone}`}
                          className="text-sm text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {lead.phone}
                        </a>
                      </div>
                      <span className="text-2xl">{slaEmoji}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {entity}
                      </Badge>
                      {lead.platform && (
                        <Badge variant="outline" className="text-xs">
                          {lead.platform}
                        </Badge>
                      )}
                      {lead.priority && (
                        <Badge className={`text-xs border-0 ${getPriorityColor(lead.priority)} hover:${getPriorityColor(lead.priority)}`}>
                          {lead.priority}
                        </Badge>
                      )}
                      <Badge className={`text-xs border-0 ${getStatusColor(lead.status)} hover:${getStatusColor(lead.status)}`}>
                        {lead.status || "New"}
                      </Badge>
                      {isFollowUpOverdue(lead.followUp) && (
                        <Badge className="text-xs border-0 bg-destructive/10 text-destructive hover:bg-destructive/10">
                          {formatFollowUpLabel(lead.followUp)}
                        </Badge>
                      )}
                    </div>

                    {lead.note && (
                      <p
                        className="text-sm text-muted-foreground truncate max-w-full"
                        title={lead.note}
                      >
                        {lead.note.length > 60 ? `${lead.note.substring(0, 60)}...` : lead.note}
                      </p>
                    )}

                    <div className="text-xs text-muted-foreground">
                      {formatRelativeTime(lead.timestamp)}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Lead Details</SheetTitle>
          </SheetHeader>

          {selectedLead && (
            <div className="space-y-6">
              <div className="space-y-2 text-sm bg-muted/30 p-3 rounded-md">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{selectedLead.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <a href={`tel:${selectedLead.phone}`} className="font-medium text-primary hover:underline">
                    {selectedLead.phone}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entity:</span>
                  <span className="font-medium">{selectedLead.entity || selectedLead.source || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform:</span>
                  <span className="font-medium">{selectedLead.platform || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority:</span>
                  <span className="font-medium">{selectedLead.priority || "N/A"}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Original Inquiry</label>
                <div className="text-sm bg-muted/50 p-3 rounded-md min-h-[60px] whitespace-pre-wrap">
                  {selectedLead.note || "No notes provided."}
                </div>
              </div>

              {selectedLead.adminNote && (
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-foreground">Call History</label>
                  <div className="text-sm bg-secondary/30 p-3 rounded-md min-h-[60px] whitespace-pre-wrap">
                    {selectedLead.adminNote}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Call Outcome Note *</label>
                <Textarea
                  placeholder="Input call discussion notes or action items..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[100px] resize-none text-black font-medium bg-slate-50 border-slate-300 placeholder:text-black/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Status</label>
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

              <div className="flex items-center justify-between border border-border p-3 rounded-md bg-secondary/20">
                <div>
                  <label className="text-sm font-semibold text-foreground">Follow-Up Due Date</label>
                  <p className="text-xs text-muted-foreground">
                    {formatFollowUpLabel(selectedLead.followUp)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={selectedLead.followUp && selectedLead.followUp !== "Yes" ? selectedLead.followUp : ""}
                    onChange={(e) =>
                      setSelectedLead({ ...selectedLead, followUp: e.target.value })
                    }
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm text-black"
                  />
                  {selectedLead.followUp && (
                    <button
                      type="button"
                      onClick={() => setSelectedLead({ ...selectedLead, followUp: "" })}
                      className="text-xs text-muted-foreground underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11"
              >
                {isLoading ? "Saving..." : "Save Updates"}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}