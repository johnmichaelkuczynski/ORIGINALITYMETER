import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AnalysisResult, PassageData, SupportingDocument } from "@/lib/types";
import { FileDropzone } from "@/components/ui/file-dropzone";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FeedbackFormProps {
  category: 'conceptualLineage' | 'semanticDistance' | 'noveltyHeatmap' | 
            'derivativeIndex' | 'conceptualParasite' | 'coherence' | 
            'accuracy' | 'depth' | 'clarity';
  categoryName: string;
  result: AnalysisResult;
  passageA: PassageData;
  passageB: PassageData;
  isSinglePassageMode?: boolean;
  onFeedbackProcessed: (updatedResult: AnalysisResult) => void;
}

export default function FeedbackForm({
  category,
  categoryName,
  result,
  passageA,
  passageB,
  isSinglePassageMode = false,
  onFeedbackProcessed
}: FeedbackFormProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [supportingDocument, setSupportingDocument] = useState<SupportingDocument | null>(null);
  const [fileUploading, setFileUploading] = useState(false);
  
  // Get the provider from the result metadata if available, default to OpenAI
  const provider = result.metadata?.provider || "openai";
  
  // Check if this category already has feedback
  const existingFeedback = result[category]?.feedback;

  // Mutation for submitting feedback
  const feedbackMutation = useMutation({
    mutationFn: async (data: {
      category: string;
      feedback: string;
      supportingDocument?: SupportingDocument;
    }) => {
      console.log("Submitting feedback:", {
        category: data.category,
        feedback: data.feedback.substring(0, 20) + "...",
        supportingDocument: data.supportingDocument ? "Provided" : "None",
        passageA: passageA.text ? passageA.text.substring(0, 20) + "..." : "Empty",
        passageB: passageB.text ? passageB.text.substring(0, 20) + "..." : "Empty",
        isSinglePassageMode
      });

      try {
        // Initial safeguards in case of empty data
        if (!passageA.text) {
          throw new Error("Invalid passage A data");
        }
        
        if (!isSinglePassageMode && !passageB.text) {
          throw new Error("Invalid passage B data");
        }
        
        if (!result) {
          throw new Error("Missing original analysis result");
        }

        // Ensure we have the minimum viable data for the category
        const categoryKey = data.category as keyof AnalysisResult;
        const categoryData = result[categoryKey];
        if (!categoryData) {
          throw new Error(`Missing data for category: ${data.category}`);
        }

        // Now make the request with validated data
        const payload = {
          category: data.category,
          feedback: data.feedback,
          supportingDocument: data.supportingDocument,
          originalResult: result,
          passageA: {
            title: passageA.title || "",
            text: passageA.text
          },
          passageB: {
            title: passageB.title || "",
            text: passageB.text || ""
          },
          isSinglePassageMode: !!isSinglePassageMode,
          provider: provider // Include the provider from the original analysis
        };

        // Log the structure without accessing properties by string index
        console.log("Feedback payload contains:", Object.keys(payload).join(", "));
        
        const response = await apiRequest("POST", "/api/feedback", payload);
        return await response.json();
      } catch (error) {
        console.error("Feedback submission error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Feedback submitted",
        description: "Your feedback has been processed.",
      });
      onFeedbackProcessed(data.revisedResult);
      setIsOpen(false);
      setFeedback("");
      setSupportingDocument(null);
    },
    onError: (error) => {
      toast({
        title: "Error submitting feedback",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Handle file upload for supporting documents
  const handleFileUpload = async (file: File) => {
    // Validate file type
    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (fileType !== 'txt' && fileType !== 'docx' && fileType !== 'pdf') {
      toast({
        title: "Unsupported file format",
        description: "Please upload a .txt, .docx, or .pdf file",
        variant: "destructive",
      });
      return;
    }

    setFileUploading(true);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Upload file
      const response = await fetch('/api/upload/supporting', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const data = await response.json();
      setSupportingDocument({
        title: data.title,
        content: data.content
      });

      toast({
        title: "File uploaded",
        description: "Your supporting document has been processed.",
      });
    } catch (error) {
      toast({
        title: "Error uploading file",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setFileUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      toast({
        title: "Feedback required",
        description: "Please provide your feedback before submitting",
        variant: "destructive",
      });
      return;
    }

    feedbackMutation.mutate({
      category,
      feedback,
      supportingDocument: supportingDocument || undefined
    });
  };

  // Define these state variables outside the conditional to avoid React hooks rules violations
  const [continuingConversation, setContinuingConversation] = useState(false);
  const [followUpFeedback, setFollowUpFeedback] = useState("");
  
  // Define the follow-up functions outside the conditional rendering
  const handleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpFeedback.trim()) return;
    
    // Reset the form fields before submitting
    const currentFeedback = followUpFeedback;
    setFollowUpFeedback("");
    setContinuingConversation(false);
    
    // Submit the follow-up feedback
    feedbackMutation.mutate({
      category,
      feedback: currentFeedback,
      supportingDocument: supportingDocument || undefined
    });
  };
  
  // Handle keydown for pressing Enter
  const handleFollowUpKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (followUpFeedback.trim()) {
        handleFollowUpSubmit(e);
      }
    }
  };
  
  // Conditional rendering logic - No hooks inside conditionals
  if (existingFeedback) {
    
    return (
      <Card className="mt-4 border border-slate-200 bg-slate-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">Feedback on {categoryName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-md border border-slate-200">
              <p className="text-sm font-medium text-slate-700 mb-1">Your feedback:</p>
              <p className="text-sm text-slate-600">{existingFeedback.comment}</p>
            </div>
            
            <div className="bg-white p-3 rounded-md border border-slate-200">
              <p className="text-sm font-medium text-slate-700 mb-1">AI Response:</p>
              <p className="text-sm text-slate-600">{existingFeedback.aiResponse}</p>
            </div>
            
            {existingFeedback.isRevised && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-sm text-green-800">
                  The analysis was revised based on your feedback.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Continue conversation section */}
            {continuingConversation ? (
              <form onSubmit={handleFollowUpSubmit} className="pt-2">
                <Textarea
                  placeholder="Continue the conversation..."
                  value={followUpFeedback}
                  onChange={(e) => setFollowUpFeedback(e.target.value)}
                  onKeyDown={handleFollowUpKeyDown}
                  className="min-h-[80px] text-sm"
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setContinuingConversation(false)}
                    disabled={feedbackMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={feedbackMutation.isPending || !followUpFeedback.trim()}
                  >
                    {feedbackMutation.isPending ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => setContinuingConversation(true)}
              >
                Continue Conversation
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4">
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full border-dashed border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
        >
          <span className="text-sm">Don't agree? Tell us why.</span>
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-2">
        <Card className="border border-slate-200">
          <form onSubmit={handleSubmit}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Submit Feedback on {categoryName}</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Explain why you disagree with the analysis..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (feedback.trim()) {
                      handleSubmit(e);
                    }
                  }
                }}
                className="min-h-[100px]"
              />
              
              <div className="space-y-2">
                <p className="text-sm text-slate-600">Upload supporting document (optional)</p>
                
                <FileDropzone
                  onFileSelect={handleFileUpload}
                  accept=".txt,.docx,.pdf"
                  disabled={fileUploading || feedbackMutation.isPending}
                  isUploading={fileUploading}
                  maxSizeInMB={20}
                  className="bg-white border-slate-200"
                  showButton={true}
                  buttonText="Upload Document"
                />
                
                {supportingDocument && (
                  <div className="bg-slate-50 p-2 rounded-md mt-2">
                    <p className="text-xs text-slate-700 font-medium">{supportingDocument.title}</p>
                    <p className="text-xs text-slate-600 truncate">{supportingDocument.content.substring(0, 100)}...</p>
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end gap-2 pt-0">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => setIsOpen(false)}
                disabled={feedbackMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                size="sm"
                disabled={feedbackMutation.isPending || !feedback.trim()}
              >
                {feedbackMutation.isPending ? "Submitting..." : "Submit & Re-Evaluate"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}