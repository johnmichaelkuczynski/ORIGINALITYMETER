import { useState } from "react";
import SemanticAnalyzer from "@/components/SemanticAnalyzer";
import DocumentRewriter from "@/components/DocumentRewriter";
import ChunkBasedRewriter from "@/components/ChunkBasedRewriter";
import HomeworkHelper from "@/components/HomeworkHelper";
import GraphGenerator from "@/components/GraphGenerator";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileEdit, Scissors } from "lucide-react";

export default function Home() {
  const [rewriterContent, setRewriterContent] = useState<string>("");
  const [rewriterTitle, setRewriterTitle] = useState<string>("");
  const [homeworkContent, setHomeworkContent] = useState<string>("");

  const handleSendToRewriter = (text: string, title?: string) => {
    setRewriterContent(text);
    setRewriterTitle(title || "Content from Chat");
    // Scroll to rewriter section
    document.getElementById('document-rewriter')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendToHomework = (text: string) => {
    setHomeworkContent(text);
    // Scroll to homework section
    document.getElementById('homework-helper')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendToAnalysis = (text: string, title?: string) => {
    // This will be handled by SemanticAnalyzer
    window.location.href = `/?analysis=${encodeURIComponent(text)}&title=${encodeURIComponent(title || '')}`;
  };

  return (
    <div className="space-y-8">
      <SemanticAnalyzer 
        onSendToRewriter={handleSendToRewriter}
        onSendToHomework={handleSendToHomework}
      />
      
      <Separator className="my-8" />
      
      <div id="document-rewriter">
        <Tabs defaultValue="full-rewrite" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="full-rewrite" className="flex items-center gap-2">
              <FileEdit className="h-4 w-4" />
              Rewrite Entire Document
            </TabsTrigger>
            <TabsTrigger value="chunk-rewrite" className="flex items-center gap-2">
              <Scissors className="h-4 w-4" />
              Select Chunks to Rewrite
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="full-rewrite">
            <DocumentRewriter 
              onSendToAnalysis={handleSendToAnalysis}
              onSendToHomework={handleSendToHomework}
              initialContent={rewriterContent}
              initialTitle={rewriterTitle}
            />
          </TabsContent>
          
          <TabsContent value="chunk-rewrite">
            <ChunkBasedRewriter 
              onSendToAnalysis={handleSendToAnalysis}
              initialContent={rewriterContent}
              initialTitle={rewriterTitle}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      <Separator className="my-8" />
      
      <div id="homework-helper">
        <HomeworkHelper 
          onSendToAnalysis={handleSendToAnalysis}
          onSendToRewriter={handleSendToRewriter}
          initialContent={homeworkContent}
        />
      </div>
      
      <Separator className="my-8" />
      
      <div id="graph-generator">
        <GraphGenerator />
      </div>
    </div>
  );
}