import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, TrendingUp, AlertCircle, CheckCircle, Plus } from "lucide-react";

const MOCK_CAMPAIGNS = [
  {
    id: 1,
    name: "Q2 Product Launch",
    currentSpend: 4500,
    budgetLimit: 5000,
    cpl: 12.5,
    status: "healthy",
  },
  {
    id: 2,
    name: "Summer Sale Campaign",
    currentSpend: 8900,
    budgetLimit: 10000,
    cpl: 15.2,
    status: "warning",
  },
  {
    id: 3,
    name: "Brand Awareness",
    currentSpend: 9800,
    budgetLimit: 10000,
    cpl: 18.9,
    status: "critical",
  },
];

const getHealthColor = (status: string) => {
  switch (status) {
    case "healthy":
      return "bg-green-100 text-green-800 border-green-300";
    case "warning":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "critical":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-slate-100 text-slate-800";
  }
};

const getHealthIcon = (status: string) => {
  switch (status) {
    case "healthy":
      return <CheckCircle className="w-5 h-5" />;
    case "warning":
      return <AlertCircle className="w-5 h-5" />;
    case "critical":
      return <AlertCircle className="w-5 h-5" />;
    default:
      return <TrendingUp className="w-5 h-5" />;
  }
};

export default function MediaBuyerDashboard() {
  const [, navigate] = useLocation();
  const [showReportDialog, setShowReportDialog] = useState(false);

  const totalBudget = MOCK_CAMPAIGNS.reduce((sum, c) => sum + c.budgetLimit, 0);
  const totalSpend = MOCK_CAMPAIGNS.reduce((sum, c) => sum + c.currentSpend, 0);
  const avgCPL = (MOCK_CAMPAIGNS.reduce((sum, c) => sum + c.cpl, 0) / MOCK_CAMPAIGNS.length).toFixed(2);

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
              <h1 className="text-3xl font-bold text-slate-900">Media Buyer Dashboard</h1>
              <p className="text-slate-600 mt-1">Campaign Command Center & Budget Tracking</p>
            </div>
            <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                  <Plus className="w-5 h-5 mr-2" />
                  Daily Report
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Submit Daily Report</DialogTitle>
                  <DialogDescription>
                    Update campaign metrics and status
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaign">Campaign</Label>
                    <select id="campaign" className="w-full px-3 py-2 border border-slate-300 rounded-md">
                      {MOCK_CAMPAIGNS.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spend">Current Spend ($)</Label>
                    <Input id="spend" type="number" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpl">CPL ($)</Label>
                    <Input id="cpl" type="number" placeholder="0.00" step="0.01" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status Update</Label>
                    <Textarea id="status" placeholder="Campaign status and notes..." rows={3} />
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Submit Report
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">${totalBudget.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">Across all campaigns</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Spend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">${totalSpend.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">
                {((totalSpend / totalBudget) * 100).toFixed(1)}% of budget used
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Avg CPL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">${avgCPL}</div>
              <p className="text-xs text-slate-500 mt-1">Cost per lead</p>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Command Center */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200 bg-slate-50">
            <CardTitle>Campaign Command Center</CardTitle>
            <CardDescription>
              CPL Health & Budget Tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-200">
              {MOCK_CAMPAIGNS.map(campaign => {
                const spendPercent = (campaign.currentSpend / campaign.budgetLimit) * 100;
                return (
                  <div key={campaign.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{campaign.name}</h3>
                        <p className="text-sm text-slate-600 mt-1">CPL: ${campaign.cpl.toFixed(2)}</p>
                      </div>
                      <Badge className={`${getHealthColor(campaign.status)} border flex items-center gap-1`}>
                        {getHealthIcon(campaign.status)}
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </Badge>
                    </div>

                    {/* Budget Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Budget Usage</span>
                        <span className="font-medium text-slate-900">
                          ${campaign.currentSpend.toLocaleString()} / ${campaign.budgetLimit.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            campaign.status === "healthy"
                              ? "bg-green-500"
                              : campaign.status === "warning"
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${Math.min(spendPercent, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        Publish
                      </Button>
                      <Button size="sm" variant="outline" className="border-slate-300">
                        Back for Update
                      </Button>
                      <Button size="sm" variant="outline" className="border-slate-300">
                        Close
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
