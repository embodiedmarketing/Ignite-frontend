import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import jsPDF from "jspdf";
import { Download, FileText, Save, Loader2 } from "lucide-react";
import { apiRequest } from "@/services/queryClient";
import { useToast } from "@/hooks/use-toast";

export function TripwireFunnelPageEditor({
  page,
  pageType,
  offerId,
  userId,
}: {
  page: any;
  pageType: string;
  offerId: number;
  userId: number;
}) {
  const [sections, setSections] = useState(page?.sections || {});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSectionChange = (field: string, value: string | string[]) => {
    setSections((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await apiRequest(
        "PATCH",
        `/api/tripwire-templates/${page.id}`,
        { sections }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to save");
      }

      // Invalidate React Query cache to refresh UI
      queryClient.invalidateQueries({
        queryKey: ["/api/tripwire-templates", offerId],
      });

      setIsEditing(false);

      toast({
        title: "Saved!",
        description: "Page updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save changes.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = () => {
    const pdf = new jsPDF();
    let y = 20;
    const margin = 15;
    const pageHeight = pdf.internal.pageSize.height;
    const maxWidth = pdf.internal.pageSize.width - 2 * margin;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text(pageType, margin, y);
    y += 15;

    const addSection = (title: string, content: string | string[]) => {
      if (y > pageHeight - 40) {
        pdf.addPage();
        y = margin;
      }

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text(title, margin, y);
      y += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      const text = Array.isArray(content) ? content.join("\n• ") : content;
      const splitText = pdf.splitTextToSize(text, maxWidth);
      pdf.text(splitText, margin, y);
      y += splitText.length * 5 + 5;
    };

    Object.entries(sections).forEach(([key, value]) => {
      const title =
        key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");
      addSection(title, value as string | string[]);
    });

    pdf.save(`${pageType.toLowerCase().replace(/\s+/g, "-")}.pdf`);

    toast({
      title: "Downloaded!",
      description: "Page exported as PDF",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{pageType}</CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={handleExportPDF}
              variant="outline"
              size="sm"
              data-testid="button-export-pdf"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                className="border-[#689cf2] text-[#689cf2] hover:bg-[#689cf2] hover:text-white"
                data-testid="button-edit-template"
              >
                <FileText className="w-4 h-4 mr-2" />
                Edit
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => {
                    setSections(page?.sections || {});
                    setIsEditing(false);
                  }}
                  variant="outline"
                  size="sm"
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  size="sm"
                  className="bg-[#689cf2] hover:bg-[#5a8ce0] text-white"
                  data-testid="button-save-template"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(sections).map(([key, value]) => {
          const label =
            key.charAt(0).toUpperCase() +
            key.slice(1).replace(/([A-Z])/g, " $1");
          const isArray = Array.isArray(value);

          return (
            <div key={key}>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                {label}
              </label>
              {isEditing ? (
                isArray ? (
                  <div className="space-y-2">
                    {(value as string[]).map((item, index) => (
                      <Input
                        key={index}
                        value={item}
                        onChange={(e) => {
                          const newArray = [...(value as string[])];
                          newArray[index] = e.target.value;
                          handleSectionChange(key, newArray);
                        }}
                        className="w-full"
                        data-testid={`input-${key}-${index}`}
                      />
                    ))}
                  </div>
                ) : (
                  <Textarea
                    value={value as string}
                    onChange={(e) => handleSectionChange(key, e.target.value)}
                    className="w-full resize-none"
                    rows={4}
                    data-testid={`textarea-${key}`}
                  />
                )
              ) : (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  {isArray ? (
                    <ul className="list-disc list-inside space-y-1">
                      {(value as string[]).map((item, index) => (
                        <li key={index} className="text-slate-700">
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {value as string}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

