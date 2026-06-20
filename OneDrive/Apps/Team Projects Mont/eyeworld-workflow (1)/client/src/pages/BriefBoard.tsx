import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";

const MOCK_BRIEFS = [
  {
    id: 1,
    title: "Q2 Email Campaign",
    description: "Create email templates for Q2 product launch",
    assignedTo: "Bakr",
    status: "Seen",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    seenAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 2,
    title: "Social Media Assets",
    description: "Design social media graphics for summer campaign",
    assignedTo: "Asmaa",
    status: "In Progress",
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    seenAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: 3,
    title: "Video Script",
    description: "Write script for product demo video",
    assignedTo: "Bakr",
    status: "Draft",
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    seenAt: null,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
];

const STATUS_COLORS: Record<string, string> = {
  "Draft": "bg-slate-100 text-slate-800",
  "Seen": "bg-green-100 text-green-800",
  "In Progress": "bg-amber-100 text-amber-800",
  "Done": "bg-green-100 text-green-800",
};

export default function BriefBoard() {
  const [, navigate] = useLocation();
  const [briefs, setBriefs] = useState(MOCK_BRIEFS);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleMarkSeen = (briefId: number) => {
    setBriefs(briefs.map(b =>
      b.id === briefId
        ? { ...b, status: "Seen", seenAt: new Date() }
        : b
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Brief Board</h1>
              <p className="text-slate-600 mt-1">Campaign briefs and team assignments</p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                  <Plus className="w-5 h-5 mr-2" />
                  New Brief
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Brief</DialogTitle>
                  <DialogDescription>
                    Create a campaign brief and assign it to a team member
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Brief Title</Label>
                    <Input id="title" placeholder="Enter brief title" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" placeholder="Brief description" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignee">Assign To</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bakr">Bakr</SelectItem>
                        <SelectItem value="asmaa">Asmaa</SelectItem>
                        <SelectItem value="hadeer">Hadeer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input id="deadline" type="datetime-local" />
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Create Brief
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {briefs.map(brief => (
            <Card key={brief.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg line-clamp-2">{brief.title}</CardTitle>
                    <CardDescription className="mt-1">
                      Assigned to: <span className="font-medium text-slate-700">{brief.assignedTo}</span>
                    </CardDescription>
                  </div>
                  <Badge className={`${STATUS_COLORS[brief.status]} border-0 whitespace-nowrap`}>
                    {brief.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600 line-clamp-2">{brief.description}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Deadline:</span>
                    <span className="font-medium">{format(brief.deadline, "MMM d, yyyy")}</span>
                  </div>
                  {brief.seenAt && (
                    <div className="flex justify-between text-green-600">
                      <span>Seen:</span>
                      <span className="font-medium">{format(brief.seenAt, "MMM d, yyyy")}</span>
                    </div>
                  )}
                </div>

                {brief.status === "Draft" && (
                  <Button
                    onClick={() => handleMarkSeen(brief.id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Seen
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {briefs.length === 0 && (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No briefs yet</p>
            <p className="text-slate-500 text-sm mt-1">Create your first campaign brief</p>
          </div>
        )}
      </div>
    </div>
  );
}
