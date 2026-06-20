import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

const MATERIAL_TYPES = [
  "Email Campaign",
  "Social Media Post",
  "Blog Article",
  "Video Script",
  "Infographic",
  "Whitepaper",
  "Case Study",
  "Press Release",
  "Landing Page",
  "Advertisement",
  "Other",
];

interface FileToUpload {
  file: File;
  id: string;
}

export default function CreateRequest() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<FileToUpload[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    materialType: "",
    targetAudience: "",
    deadline: "",
  });

  const createMutation = trpc.workflow.createRequest.useMutation({
    onSuccess: (data) => {
      toast.success("Request created successfully!");
      navigate(`/request/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create request");
      setIsSubmitting(false);
    },
  });

  const handleAddFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    const newFiles: FileToUpload[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large (max 50MB)`);
        continue;
      }
      newFiles.push({
        file,
        id: Math.random().toString(36).substr(2, 9),
      });
    }

    setFilesToUpload([...filesToUpload, ...newFiles]);
    e.currentTarget.value = "";
  };

  const handleRemoveFile = (id: string) => {
    setFilesToUpload(filesToUpload.filter(f => f.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!formData.materialType) {
      toast.error("Please select a material type");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createMutation.mutateAsync({
        title: formData.title,
        description: formData.description || undefined,
        materialType: formData.materialType,
        targetAudience: formData.targetAudience || undefined,
        deadline: formData.deadline ? new Date(formData.deadline) : undefined,
      });

      // Upload files if any
      if (filesToUpload.length > 0 && result.id) {
        for (const fileToUpload of filesToUpload) {
          try {
            const buffer = await fileToUpload.file.arrayBuffer();
            // File upload would happen here via uploadFile mutation
            // For now, we'll just log it
            console.log(`Would upload: ${fileToUpload.file.name}`);
          } catch (error) {
            console.error(`Failed to process file: ${fileToUpload.file.name}`, error);
          }
        }
      }
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Create New Request</h1>
          <p className="text-slate-600 mt-1">Submit your marketing material for review and approval</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200 bg-slate-50">
            <CardTitle>Request Details</CardTitle>
            <CardDescription>Fill in the information about your marketing material</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-700 font-medium">
                  Request Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Q2 Email Campaign"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-700 font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Provide details about your request..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Material Type */}
              <div className="space-y-2">
                <Label htmlFor="materialType" className="text-slate-700 font-medium">
                  Material Type *
                </Label>
                <Select value={formData.materialType} onValueChange={(value) => setFormData({ ...formData, materialType: value })}>
                  <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select material type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAL_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <Label htmlFor="targetAudience" className="text-slate-700 font-medium">
                  Target Audience
                </Label>
                <Input
                  id="targetAudience"
                  placeholder="e.g., Enterprise customers, Tech enthusiasts"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Deadline */}
              <div className="space-y-2">
                <Label htmlFor="deadline" className="text-slate-700 font-medium">
                  Deadline
                </Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* File Attachments */}
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">
                  Attachments (Optional)
                </Label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    onChange={handleAddFile}
                    className="hidden"
                    id="file-input"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  />
                  <label htmlFor="file-input" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-700">Click to upload files</p>
                    <p className="text-xs text-slate-500 mt-1">or drag and drop (max 50MB per file)</p>
                  </label>
                </div>

                {/* File List */}
                {filesToUpload.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {filesToUpload.map(fileToUpload => (
                      <div key={fileToUpload.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Upload className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="text-sm text-slate-700 truncate">{fileToUpload.file.name}</span>
                          <span className="text-xs text-slate-500 flex-shrink-0">
                            ({(fileToUpload.file.size / 1024 / 1024).toFixed(2)}MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(fileToUpload.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors ml-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isSubmitting ? "Creating..." : "Create Request"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
