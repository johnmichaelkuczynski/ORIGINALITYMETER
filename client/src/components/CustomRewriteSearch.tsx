import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  pagemap?: {
    cse_thumbnail?: Array<{
      src: string;
      width: string;
      height: string;
    }>;
    metatags?: Array<Record<string, string>>;
  };
}

interface CustomRewriteSearchProps {
  passageText: string;
  onApplySearch: (selectedResults: SearchResult[], instructions: string) => void;
  onClose: () => void;
}

export default function CustomRewriteSearch({
  passageText,
  onApplySearch,
  onClose
}: CustomRewriteSearchProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [generatedQueries, setGeneratedQueries] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedResults, setSelectedResults] = useState<SearchResult[]>([]);
  const [customInstructions, setCustomInstructions] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingQueries, setIsGeneratingQueries] = useState(false);
  const [showQueryGenerator, setShowQueryGenerator] = useState(false);
  const [activeQuery, setActiveQuery] = useState("");

  // Generate search queries based on passage content when component mounts
  useEffect(() => {
    generateQueries();
  }, []);

  // Toggle selection of a search result
  const toggleResultSelection = (result: SearchResult) => {
    if (selectedResults.some(r => r.link === result.link)) {
      setSelectedResults(selectedResults.filter(r => r.link !== result.link));
    } else {
      setSelectedResults([...selectedResults, result]);
    }
  };

  // Generate search queries based on passage content
  const generateQueries = async () => {
    if (!passageText.trim()) {
      toast({
        title: "Error",
        description: "Passage text is required to generate search queries",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsGeneratingQueries(true);
      setShowQueryGenerator(true);
      
      const response = await fetch("/api/generate-search-queries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          passage: passageText,
          count: 5,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate search queries");
      }
      
      const data = await response.json();
      setGeneratedQueries(data.queries || []);
      
      // If queries were generated, set the first one as active
      if (data.queries && data.queries.length > 0) {
        setSearchQuery(data.queries[0]);
        setActiveQuery(data.queries[0]);
      }
      
    } catch (error) {
      console.error("Error generating search queries:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate search queries",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQueries(false);
    }
  };

  // Perform search with the current query
  const performSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search query",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSearching(true);
      setSearchResults([]);
      
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchQuery,
          numResults: 5,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Search failed");
      }
      
      const data = await response.json();
      setSearchResults(data.results || []);
      setActiveQuery(searchQuery);
      
    } catch (error) {
      console.error("Error performing search:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to perform search",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Use a suggested query
  const useQuery = (query: string) => {
    setSearchQuery(query);
    // Auto-search when selecting a suggested query
    setSearchQuery(query);
    setTimeout(() => {
      performSearch();
    }, 100);
  };

  // Handle custom instructions change
  const handleInstructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomInstructions(e.target.value);
  };

  // Apply selected search results
  const handleApplySearch = () => {
    if (selectedResults.length === 0) {
      toast({
        title: "No results selected",
        description: "Please select at least one search result to include in the rewrite",
        variant: "destructive",
      });
      return;
    }
    
    onApplySearch(selectedResults, customInstructions);
    onClose();
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Custom Rewrite with Online Search</h2>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
      
      <Separator />
      
      {/* Search Query Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Label htmlFor="searchQuery">Search Query</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="searchQuery"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter search terms..."
                className="flex-1"
              />
              <Button 
                onClick={performSearch}
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
          
          <div>
            <Label>&nbsp;</Label>
            <Button 
              variant="outline" 
              className="mt-1 w-full"
              onClick={() => setShowQueryGenerator(!showQueryGenerator)}
            >
              {showQueryGenerator ? "Hide Suggestions" : "Show Suggestions"}
            </Button>
          </div>
        </div>
        
        {/* Query Suggestions */}
        {showQueryGenerator && (
          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex justify-between items-center">
                <h3 className="font-medium text-sm">Suggested Search Queries</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={generateQueries}
                  disabled={isGeneratingQueries}
                >
                  {isGeneratingQueries ? "Generating..." : "Regenerate"}
                </Button>
              </div>
              
              {isGeneratingQueries ? (
                <div className="py-4 text-center text-gray-500">Generating suggestions...</div>
              ) : generatedQueries.length === 0 ? (
                <div className="py-4 text-center text-gray-500">No suggestions available</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {generatedQueries.map((query, index) => (
                    <Button
                      key={index}
                      variant={activeQuery === query ? "default" : "outline"}
                      size="sm"
                      className="justify-start overflow-hidden text-ellipsis"
                      onClick={() => useQuery(query)}
                    >
                      {query}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Search Results</h3>
          
          <div className="space-y-3">
            {searchResults.map((result, index) => (
              <Card key={index} className={`border ${selectedResults.some(r => r.link === result.link) ? 'border-primary' : 'border-gray-200'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`result-${index}`}
                      checked={selectedResults.some(r => r.link === result.link)}
                      onCheckedChange={() => toggleResultSelection(result)}
                    />
                    <div className="space-y-1">
                      <a 
                        href={result.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {result.title}
                      </a>
                      <p className="text-sm text-gray-500">{result.link}</p>
                      <p className="text-sm" dangerouslySetInnerHTML={{ __html: result.snippet }}></p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Custom Instructions */}
      <div className="space-y-2">
        <Label htmlFor="customInstructions">
          Custom Instructions for AI Rewrite
        </Label>
        <Textarea
          id="customInstructions"
          value={customInstructions}
          onChange={handleInstructionsChange}
          placeholder="Tell the AI how to incorporate the selected search results in your rewritten passage..."
          className="min-h-[150px]"
        />
        <p className="text-xs text-gray-500">
          Example: "Use concepts from result #2 to strengthen my argument about X, and incorporate the statistics from result #1 to support my point about Y."
        </p>
      </div>
      
      {/* Selected Results Summary */}
      {selectedResults.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Selected Results ({selectedResults.length})</h3>
            <Accordion type="single" collapsible className="w-full">
              {selectedResults.map((result, index) => (
                <AccordionItem key={index} value={`result-${index}`}>
                  <AccordionTrigger className="text-sm">{result.title}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-gray-600 mb-1">{result.link}</p>
                    <p className="text-sm" dangerouslySetInnerHTML={{ __html: result.snippet }}></p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
      
      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleApplySearch}
          disabled={selectedResults.length === 0}
        >
          Apply Selected Results
        </Button>
      </div>
    </div>
  );
}