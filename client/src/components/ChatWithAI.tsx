import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { Send, Bot, User, ArrowUp, Copy, Loader2, Paperclip, X, FileText, FileEdit, GraduationCap } from 'lucide-react';
import { PassageData, AnalysisResult } from '@/lib/types';
import DocumentUpload from './DocumentUpload';
import { VoiceDictation } from '@/components/ui/voice-dictation';
import { convertMarkdownWithMath, renderMathInElement } from '@/lib/mathUtils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachedFiles?: string[];
}

interface ChatWithAIProps {
  currentPassage?: PassageData;
  analysisResult?: AnalysisResult;
  onSendToInput: (text: string, title?: string) => void;
  onSendToRewriter?: (text: string, title?: string) => void;
  onSendToHomework?: (text: string) => void;
}

export default function ChatWithAI({ currentPassage, analysisResult, onSendToInput, onSendToRewriter, onSendToHomework }: ChatWithAIProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [attachedDocuments, setAttachedDocuments] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  // Render math in all message elements when messages change
  useEffect(() => {
    const renderAllMath = async () => {
      const elements = Array.from(messageRefs.current.values());
      for (const element of elements) {
        if (element) {
          await renderMathInElement(element);
        }
      }
    };
    
    if (messages.length > 0) {
      setTimeout(renderAllMath, 100);
    }
  }, [messages]);

  const handleDocumentProcessed = (content: string, filename?: string) => {
    // Prevent duplicate documents
    if (attachedDocuments.some(doc => doc === content)) {
      toast({
        title: "Document already attached",
        description: `${filename} is already in the conversation.`,
      });
      return;
    }
    
    setAttachedDocuments(prev => [...prev, content]);
    setShowUpload(false); // Hide upload area after successful upload
    toast({
      title: "Document attached",
      description: `${filename} is now available in the conversation.`,
    });
  };

  const removeAttachedDocument = (index: number) => {
    setAttachedDocuments(prev => prev.filter((_, i) => i !== index));
  };

  // File processing functions
  const processFiles = async (files: FileList) => {
    setIsProcessingFiles(true);
    
    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/process-document', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to process ${file.name}: ${response.statusText}`);
        }

        const result = await response.json();
        handleDocumentProcessed(result.content, file.name);
      } catch (error) {
        console.error('Error processing file:', error);
        toast({
          title: "Error processing file",
          description: `Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      }
    }
    
    setIsProcessingFiles(false);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // Create context from current app state
      const context = {
        currentPassage: currentPassage ? {
          title: currentPassage.title,
          text: currentPassage.text.substring(0, 2000) + (currentPassage.text.length > 2000 ? '...' : '')
        } : null,
        analysisResult: analysisResult ? {
          conceptualLineage: analysisResult.conceptualLineage,
          derivativeIndex: analysisResult.derivativeIndex,
          semanticDistance: analysisResult.semanticDistance
        } : null,
        conversationHistory: messages.slice(-6), // Last 6 messages for context
        attachedDocuments: attachedDocuments.length > 0 ? attachedDocuments : null
      };

      const response = await apiRequest(
        'POST',
        '/api/chat',
        {
          message,
          context,
          provider: 'openai' // Use OpenAI for chat
        }
      );
      return await response.json();
    },
    onSuccess: (response) => {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setInputMessage('');
      
      // Focus back to textarea
      setTimeout(() => textareaRef.current?.focus(), 100);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      toast({
        title: 'Chat Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim() || sendMessageMutation.isPending) return;

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate(inputMessage.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'Message content has been copied.',
    });
  };

  const sendToInput = (text: string) => {
    // Extract potential title from the beginning of the text
    const lines = text.split('\n');
    const firstLine = lines[0].trim();
    let title = 'Generated from Chat';
    let content = text;

    // If first line looks like a title (short and contains certain keywords)
    if (firstLine.length < 100 && (
      firstLine.includes('Exam') || 
      firstLine.includes('Assignment') || 
      firstLine.includes('Exercise') ||
      firstLine.includes('Problem') ||
      firstLine.includes('#') ||
      firstLine.includes('Test')
    )) {
      title = firstLine.replace(/^#+\s*/, ''); // Remove markdown headers
      content = lines.slice(1).join('\n').trim();
    }

    onSendToInput(content, title);
    toast({
      title: 'Sent to Input',
      description: 'Content has been added to the input box for analysis.',
    });
  };

  const sendToRewriter = (text: string) => {
    if (!onSendToRewriter) return;
    
    // Extract potential title from the beginning of the text
    const lines = text.split('\n');
    const firstLine = lines[0].trim();
    let title = 'Generated from Chat';
    let content = text;

    // If first line looks like a title (short and contains certain keywords)
    if (firstLine.length < 100 && (
      firstLine.includes('Exam') || 
      firstLine.includes('Assignment') || 
      firstLine.includes('Exercise') ||
      firstLine.includes('Problem') ||
      firstLine.includes('#') ||
      firstLine.includes('Test') ||
      firstLine.includes('Analysis') ||
      firstLine.includes('Essay') ||
      firstLine.includes('Paper')
    )) {
      title = firstLine.replace(/^#+\s*/, ''); // Remove markdown headers
      content = lines.slice(1).join('\n').trim();
    }

    onSendToRewriter(content, title);
    
    toast({
      title: 'Sent to Rewriter',
      description: 'Content has been sent to the Document Rewriter for editing.',
    });
  };

  const sendToHomework = (text: string) => {
    if (!onSendToHomework) return;
    
    onSendToHomework(text);
    
    toast({
      title: 'Sent to Homework Helper',
      description: 'Content has been sent to the Homework Helper for solving.',
    });
  };

  // Auto-send context when input changes
  useEffect(() => {
    if (currentPassage && messages.length === 0) {
      const contextMessage = `I'm working with a text titled "${currentPassage.title}" in the Originality Meter app. The text contains ${currentPassage.text.length} characters. I may ask you questions about this text or request analysis and improvements.`;
      
      setMessages([{
        id: `context-${Date.now()}`,
        role: 'assistant',
        content: `I can see you're working with "${currentPassage.title}" in the Originality Meter. I'm here to help you analyze, improve, or generate new content based on your text. I can also help you create completely new content like exams, assignments, or any other text you need. What would you like to work on?`,
        timestamp: new Date()
      }]);
    }
  }, [currentPassage?.title]); // Only trigger on title change to avoid loops

  return (
    <Card className="w-full mt-8 border-t-4 border-t-blue-500">
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            Chat with AI
            <Badge variant="secondary" className="ml-2">
              Context Aware
            </Badge>
          </div>
          <Button variant="ghost" size="sm">
            {isExpanded ? '−' : '+'}
          </Button>
        </CardTitle>
        {!isExpanded && (
          <p className="text-sm text-gray-600">
            Ask anything, generate content, or discuss your analysis results
          </p>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Chat Messages */}
          <ScrollArea ref={scrollAreaRef} className="h-96 w-full border rounded-md p-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Start a conversation with AI</p>
                <p className="text-sm">I can help analyze your text, generate new content, or answer any questions.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0">
                        <Bot className="h-6 w-6 text-blue-600 mt-1" />
                      </div>
                    )}
                    
                    <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : ''}`}>
                      <div
                        ref={(el) => {
                          if (el) {
                            messageRefs.current.set(message.id, el);
                          }
                        }}
                        className={`rounded-lg p-3 text-sm math-container ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                        dangerouslySetInnerHTML={{ 
                          __html: message.role === 'assistant' 
                            ? convertMarkdownWithMath(message.content)
                            : message.content.replace(/\n/g, '<br>')
                        }}
                      />
                      
                      {/* Action buttons for assistant messages */}
                      {message.role === 'assistant' && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => copyToClipboard(message.content)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs bg-green-50 hover:bg-green-100 text-green-700"
                            onClick={() => sendToInput(message.content)}
                          >
                            <ArrowUp className="h-3 w-3 mr-1" />
                            Send to Input
                          </Button>
                          {onSendToRewriter && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700"
                              onClick={() => sendToRewriter(message.content)}
                            >
                              <FileEdit className="h-3 w-3 mr-1" />
                              Send to Rewriter
                            </Button>
                          )}
                          {onSendToHomework && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700"
                              onClick={() => sendToHomework(message.content)}
                            >
                              <GraduationCap className="h-3 w-3 mr-1" />
                              Send to Homework
                            </Button>
                          )}
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>

                    {message.role === 'user' && (
                      <div className="flex-shrink-0 order-3">
                        <User className="h-6 w-6 text-blue-600 mt-1" />
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Loading indicator */}
                {sendMessageMutation.isPending && (
                  <div className="flex gap-3">
                    <Bot className="h-6 w-6 text-blue-600 mt-1" />
                    <div className="bg-gray-100 rounded-lg p-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <Separator />

          {/* Attached Documents */}
          {attachedDocuments.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">Attached Documents:</Label>
              <div className="flex flex-wrap gap-2">
                {attachedDocuments.map((doc, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Document {index + 1}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-red-100"
                      onClick={() => removeAttachedDocument(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Document Upload */}
          {showUpload && (
            <DocumentUpload
              onDocumentProcessed={handleDocumentProcessed}
              acceptImages={true}
              placeholder="Upload documents or screenshots to discuss with AI"
              className="border border-gray-200 rounded-md"
            />
          )}

          {/* Input Area with Drag and Drop */}
          <div 
            className={`space-y-2 relative ${isDragOver ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isDragOver && (
              <div className="absolute inset-0 bg-blue-100 bg-opacity-75 border-2 border-dashed border-blue-400 rounded-md flex items-center justify-center z-10">
                <div className="text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-blue-700 font-medium">Drop files here to attach them</p>
                  <p className="text-blue-600 text-sm">PDF, Word, TXT, or images</p>
                </div>
              </div>
            )}
            
            <Textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything, request content generation, or discuss your analysis... You can also drag & drop files here!"
              className="min-h-[80px] resize-none"
              disabled={sendMessageMutation.isPending || isProcessingFiles}
            />
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <VoiceDictation
                  onTranscriptionComplete={(text) => {
                    const updatedMessage = inputMessage 
                      ? inputMessage.trim() + (inputMessage.endsWith('.') || inputMessage.endsWith('?') || inputMessage.endsWith('!') ? ' ' : '. ') + text
                      : text;
                    setInputMessage(updatedMessage);
                    toast({
                      title: "Voice message added",
                      description: "Your dictated message has been added.",
                    });
                  }}
                  disabled={sendMessageMutation.isPending || isProcessingFiles}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1"
                  disabled={isProcessingFiles}
                >
                  <Paperclip className="h-4 w-4" />
                  {isProcessingFiles ? 'Processing...' : 'Attach'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUpload(!showUpload)}
                  className="flex items-center gap-1"
                >
                  <FileText className="h-4 w-4" />
                  Upload
                </Button>
                {isProcessingFiles && (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Processing files...
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  Press Enter to send, Shift+Enter for new line
                </div>
              </div>
              
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                size="sm"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send
              </Button>
            </div>
          </div>

          {/* Context Info */}
          {(currentPassage || analysisResult) && (
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-xs font-medium text-blue-900 mb-1">Current Context:</p>
              <div className="text-xs text-blue-800 space-y-1">
                {currentPassage && (
                  <div>📄 Text: "{currentPassage.title}" ({currentPassage.text.length} chars)</div>
                )}
                {analysisResult && (
                  <div>📊 Analysis: Results available for discussion</div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}