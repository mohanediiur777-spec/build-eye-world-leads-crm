import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { saveLead, fetchLeads, sendDailyReport, getTodayDate, getYesterdayDate, isLeadFromDate, getDefaultFollowUpDate } from "@/lib/api";
import { PAGES_OPTIONS, CHANNELS_OPTIONS, PRIORITY_OPTIONS, EMAIL_RECIPIENTS } from "../../../shared/const";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, Send, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";

interface LeadIntakeProps {
  onLeadSaved?: () => void;
}

export default function LeadIntake({ onLeadSaved }: LeadIntakeProps) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    entity: "",     // Level 1: Page (Dr. Ihab, Eye World, Top Care)
    platform: "",   // Level 2: Channel (Facebook, Instagram, WhatsApp, Snapchat, TikTok)
    priority: "",   // Hot, Warm, Cold
    note: "",       // Inquiry/Complaint
  });
  const [followUpEnabled, setFollowUpEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<"today" | "yesterday">("today");
  const [showNoteWarning, setShowNoteWarning] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "note" && value.trim()) {
      setShowNoteWarning(false);
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.phone.trim()) {
      toast.error("Phone number is required");
      return false;
    }
    const digitsOnly = formData.phone.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      toast.error("Phone number must be at least 10 digits");
      return false;
    }
    if (!formData.entity) {
      toast.error("Please select Level 1 Page source");
      return false;
    }
    if (!formData.platform) {
      toast.error("Please select Level 2 Channel");
      return false;
    }
    if (!formData.priority) {
      toast.error("Please select Priority level");
      return false;
    }
    return true;
  };

  const handleSaveLead = async () => {
    if (!formData.note.trim()) {
      setShowNoteWarning(true);
      toast.warning("Inquiry note is required before submitting.");
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const strippedPriority = formData.priority.split(" ")[0];
      await saveLead(
        formData.name.trim(),
        formData.phone.trim(),
        formData.entity,
        formData.platform,
        strippedPriority,
        formData.note.trim(),
        followUpEnabled ? getDefaultFollowUpDate() : ""
      );
      toast.success("Lead submitted & saved to Google Sheets successfully!");
      setFormData({
        name: "",
        phone: "",
        entity: "",
        platform: "",
        priority: "",
        note: "",
      });
      setFollowUpEnabled(false);
      onLeadSaved?.();
    } catch (error) {
      toast.error("Failed to save lead to backend. Please check network.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendDailyReport = async () => {
    setIsLoading(true);
    try {
      const selectedDate = reportPeriod === "today" ? getTodayDate() : getYesterdayDate();
      const targetEmail = EMAIL_RECIPIENTS.HAMDI; // Always route to Hamdi per user spec

      await sendDailyReport(selectedDate, targetEmail);
      toast.success(`Automated Daily Report request sent directly to Hamdi (${targetEmail})!`);
    } catch (error) {
      toast.error("Failed to trigger daily report automation.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <Card className="border border-border shadow-md bg-card">
        <CardHeader className="pb-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-bold text-foreground">New Lead Intake</CardTitle>
          </div>
          <CardDescription className="text-sm text-muted-foreground">
            Log incoming patient contacts. All input text is rendered in solid high-contrast black.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Patient Name */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              Patient Name
            </label>
            <Input
              type="text"
              name="name"
              placeholder="Input full name of the patient (e.g. Ahmed Hassan)"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isLoading}
              className="text-black font-medium bg-slate-50 border-slate-300 placeholder:text-black/50"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              Phone Number *
            </label>
            <Input
              type="tel"
              name="phone"
              placeholder="Input 11-digit mobile phone number (e.g. 01234567890)"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={isLoading}
              className="text-black font-medium bg-slate-50 border-slate-300 placeholder:text-black/50"
            />
          </div>

          {/* Cascading Dropdowns: Level 1 Page & Level 2 Channel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">
                Level 1: Page *
              </label>
              <Select value={formData.entity} onValueChange={(v) => handleSelectChange('entity', v)} disabled={isLoading}>
                <SelectTrigger className="text-black font-medium bg-slate-50 border-slate-300">
                  <SelectValue placeholder="Select Page..." />
                </SelectTrigger>
                <SelectContent>
                  {PAGES_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-black">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">
                Level 2: Channel *
              </label>
              <Select value={formData.platform} onValueChange={(v) => handleSelectChange('platform', v)} disabled={isLoading}>
                <SelectTrigger className="text-black font-medium bg-slate-50 border-slate-300">
                  <SelectValue placeholder="Select Channel..." />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-black">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              Priority Level *
            </label>
            <Select value={formData.priority} onValueChange={(v) => handleSelectChange('priority', v)} disabled={isLoading}>
              <SelectTrigger className="text-black font-medium bg-slate-50 border-slate-300">
                <SelectValue placeholder="Select Priority (Hot, Warm, Cold)..." />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-black font-semibold">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Inquiry / Complaint */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-foreground">
                Inquiry / Medical Complaint *
              </label>
              {showNoteWarning && (
                <span className="text-xs text-destructive flex items-center gap-1 font-bold animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5" /> Note is mandatory
                </span>
              )}
            </div>
            <Textarea
              name="note"
              placeholder="Input detailed inquiry notes or medical complaint (e.g. Patient asking about LASIK surgery price and doctor schedule)"
              value={formData.note}
              onChange={handleInputChange}
              disabled={isLoading}
              className={`text-black font-medium bg-slate-50 border-slate-300 resize-none h-24 placeholder:text-black/50 ${showNoteWarning ? "border-destructive ring-1 ring-destructive" : ""}`}
            />
          </div>

          {/* Follow-up Switch */}
          <div className="flex items-center justify-between border border-border p-3.5 rounded-lg bg-secondary/20">
            <div>
              <label className="text-sm font-semibold text-foreground">Flag for Call Center Follow-Up</label>
              <p className="text-xs text-muted-foreground">
                {followUpEnabled
                  ? `Due date will be set to ${getDefaultFollowUpDate()} (adjustable in Call Center)`
                  : "Assign this lead directly to Call Center agents"}
              </p>
            </div>
            <Switch
              checked={followUpEnabled}
              onCheckedChange={setFollowUpEnabled}
              disabled={isLoading}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSaveLead}
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11 text-base shadow"
          >
            {isLoading ? "Submitting to Backend..." : "Submit & Save Lead"}
          </Button>
        </CardContent>
      </Card>

      {/* Moderator Daily Action Card */}
      <Card className="border border-border/80 shadow-sm bg-accent/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
            <Send className="w-4 h-4" /> Moderator Actions & Reporting
          </CardTitle>
          <CardDescription className="text-xs">
            Trigger automated summary report. Routed strictly to Hamdi ({EMAIL_RECIPIENTS.HAMDI}).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-foreground mb-1">Period</label>
              <Select value={reportPeriod} onValueChange={(v: "today" | "yesterday") => setReportPeriod(v)} disabled={isLoading}>
                <SelectTrigger className="h-9 text-black font-medium bg-slate-50 border-slate-300 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today" className="text-black text-xs">Today's Leads</SelectItem>
                  <SelectItem value="yesterday" className="text-black text-xs">Yesterday's Leads</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSendDailyReport}
              disabled={isLoading}
              variant="outline"
              className="flex-1 mt-5 h-9 bg-primary text-white hover:bg-primary/90 hover:text-white font-semibold text-xs border-0"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Send Report to Hamdi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}