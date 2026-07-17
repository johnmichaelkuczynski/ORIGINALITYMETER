import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileEdit, GraduationCap, Search, Home as HomeIcon, Zap, Activity } from "lucide-react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import DocumentRewriterPage from "@/pages/DocumentRewriter";
import HomeworkHelperPage from "@/pages/HomeworkHelper";
import Diagnostics from "@/pages/Diagnostics";
import OriginalityMeter from "@/components/OriginalityMeter";
import DocumentRewriter from "@/components/DocumentRewriter";
import HomeworkHelper from "@/components/HomeworkHelper";
import GPTBypassHome from "@/components/GPTBypassHome";
import { TextSharingProvider, useTextSharing } from "@/context/TextSharingContext";

function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Originality Analysis", icon: <Search className="h-4 w-4" /> },
    { 
      id: "document-rewriter",
      href: "#document-rewriter", 
      label: "Document Rewriter", 
      icon: <FileEdit className="h-4 w-4" />,
      isSection: true 
    },
    { 
      id: "homework-helper",
      href: "#homework-helper", 
      label: "Homework Helper", 
      icon: <GraduationCap className="h-4 w-4" />,
      isSection: true 
    },
    { 
      id: "gpt-bypass",
      href: "#gpt-bypass", 
      label: "AI Text Humanization", 
      icon: <Zap className="h-4 w-4" />,
      isSection: true 
    },
    { path: "/diagnostics", label: "System Diagnostics", icon: <Activity className="h-4 w-4" /> },
  ];

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <nav className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            item.isSection ? (
              <Button
                key={item.id}
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {item.icon}
                {item.label}
              </Button>
            ) : (
              <Link key={item.path} href={item.path!}>
                <Button
                  variant={location === item.path ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  {item.icon}
                  {item.label}
                </Button>
              </Link>
            )
          ))}
        </nav>
      </CardContent>
    </Card>
  );
}

function Router() {
  const { sendToOriginalityAnalysis } = useTextSharing();
  
  return (
    <div className="relative min-h-screen">
      {/* Contact Us link in top left corner */}
      <div className="absolute top-4 left-4 z-10">
        <a 
          href="mailto:zhi@zhicourses.org"
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
          style={{ fontSize: '11px' }}
        >
          Contact Us
        </a>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Originality Meter</h1>
          <p className="text-xl text-gray-600">Advanced AI-powered platform for scholarly writing analysis and enhancement</p>
          <div className="mt-4">
            <a 
              href="https://www.youtube.com/watch?v=lRdczUD_0PE" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              Watch Tutorial Video
            </a>
          </div>
        </div>
        
        <Navigation />
        
        <Switch>
          <Route path="/">
            <div className="space-y-12">
              {/* Originality Analysis Section */}
              <section id="originality-analysis">
                <OriginalityMeter />
              </section>
              
              {/* Document Rewriter Section */}
              <section id="document-rewriter" className="scroll-mt-8">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Document Rewriter</h2>
                  <p className="text-lg text-gray-600">
                    Transform your documents with AI-powered rewriting. Upload documents, provide custom instructions, 
                    and get professionally rewritten content with perfect mathematical notation preservation.
                  </p>
                </div>
                <DocumentRewriter onSendToAnalysis={(text: string, title?: string) => {
                  sendToOriginalityAnalysis(text);
                }} />
              </section>

              {/* Homework Helper Section */}
              <section id="homework-helper" className="scroll-mt-8">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Homework Helper</h2>
                  <p className="text-lg text-gray-600">
                    Get complete solutions to your assignments with perfect mathematical notation. 
                    Upload your homework via documents or screenshots, and receive detailed step-by-step solutions.
                  </p>
                </div>
                <HomeworkHelper />
              </section>

              {/* GPT Bypass Section */}
              <section id="gpt-bypass" className="scroll-mt-8">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">AI Text Humanization</h2>
                  <p className="text-lg text-gray-600">
                    Transform AI-generated content into natural, human-like text while maintaining quality and meaning.
                    Use advanced styling options and multiple AI providers for optimal results.
                  </p>
                </div>
                <GPTBypassHome />
              </section>

            </div>
          </Route>
          <Route path="/diagnostics" component={Diagnostics}/>
          <Route path="/rewriter" component={DocumentRewriterPage}/>
          <Route path="/homework" component={HomeworkHelperPage}/>
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TextSharingProvider>
        <Router />
        <Toaster />
      </TextSharingProvider>
    </QueryClientProvider>
  );
}

export default App;
