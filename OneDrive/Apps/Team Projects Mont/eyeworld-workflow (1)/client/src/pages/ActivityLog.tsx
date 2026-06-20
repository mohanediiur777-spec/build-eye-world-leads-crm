import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, MessageSquare, FileText, Clock } from "lucide-react";
import { format } from "date-fns";

const MOCK_ACTIVITIES = [
  {
    id: 1,
    type: "status_change",
    user: "Hamdi",
    action: "Approved",
    target: "Q2 Email Campaign",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    details: "Request approved for publishing",
  },
  {
    id: 2,
    type: "comment",
    user: "Bakr",
    action: "Added comment",
    target: "Social Media Graphics",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    details: "Please adjust the color scheme",
  },
  {
    id: 3,
    type: "status_change",
    user: "Hadeer",
    action: "Submitted",
    target: "Video Script",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    details: "New request created",
  },
  {
    id: 4,
    type: "status_change",
    user: "Asmaa",
    action: "Rejected",
    target: "Banner Design",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    details: "Request rejected - needs revision",
  },
  {
    id: 5,
    type: "file_upload",
    user: "Bakr",
    action: "Uploaded file",
    target: "Email Campaign Assets",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    details: "email_template_v2.pdf (2.4 MB)",
  },
];

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  "status_change": <CheckCircle className="w-5 h-5" />,
  "comment": <MessageSquare className="w-5 h-5" />,
  "file_upload": <FileText className="w-5 h-5" />,
  "assignment": <Clock className="w-5 h-5" />,
};

const ACTIVITY_COLORS: Record<string, string> = {
  "status_change": "bg-blue-100 text-blue-800",
  "comment": "bg-purple-100 text-purple-800",
  "file_upload": "bg-green-100 text-green-800",
  "assignment": "bg-amber-100 text-amber-800",
};

export default function ActivityLog() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Activity Log</h1>
            <p className="text-slate-600 mt-1">Comprehensive audit trail of all system actions</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Timeline */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200 bg-slate-50">
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              {MOCK_ACTIVITIES.length} activities in the last 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-200">
              {MOCK_ACTIVITIES.map((activity, index) => (
                <div key={activity.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex gap-4">
                    {/* Timeline Connector */}
                    <div className="flex flex-col items-center">
                      <div className={`p-2 rounded-full ${ACTIVITY_COLORS[activity.type]} border-4 border-white`}>
                        {ACTIVITY_ICONS[activity.type]}
                      </div>
                      {index < MOCK_ACTIVITIES.length - 1 && (
                        <div className="w-0.5 h-16 bg-slate-200 mt-2" />
                      )}
                    </div>

                    {/* Activity Content */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {activity.user} <span className="font-normal text-slate-600">{activity.action}</span>
                          </p>
                          <p className="text-sm text-slate-600 mt-1">
                            on <span className="font-medium text-slate-900">{activity.target}</span>
                          </p>
                          <p className="text-sm text-slate-600 mt-2">{activity.details}</p>
                        </div>
                        <Badge className={`${ACTIVITY_COLORS[activity.type]} border-0 whitespace-nowrap`}>
                          {activity.type.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-3">
                        {format(activity.timestamp, "MMM d, yyyy HH:mm:ss")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{MOCK_ACTIVITIES.length}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Status Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {MOCK_ACTIVITIES.filter(a => a.type === "status_change").length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {MOCK_ACTIVITIES.filter(a => a.type === "comment").length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Files Uploaded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {MOCK_ACTIVITIES.filter(a => a.type === "file_upload").length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
