import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, TrendingUp, X } from 'lucide-react';

interface Signal {
  id: string;
  company_name: string;
  company_ticker: string | null;
  signal_type: string;
  confidence_score: number;
  keywords: string[];
}

interface ChatbotSidebarProps {
  signals: Signal[];
  analysis?: string; // full report analysis fallback
  onQuestionClick: (question: string) => void;
  onClose: () => void;
}

export const ChatbotSidebar = ({ signals, analysis: reportAnalysis, onQuestionClick, onClose }: ChatbotSidebarProps) => {
  const formatSignalType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const extractActionableSteps = (signal: Signal): string[] => {
    // Use per-signal analysis if present, otherwise fall back to full report analysis
    const analysis = (signal as any).analysis || reportAnalysis || '';
    
    if (!analysis) {
      // Generate default actionable steps based on signal type
      const signalType = formatSignalType(signal.signal_type);
      return [
        `Research ${signal.company_name}'s current ${signalType.toLowerCase()} progress and timeline`,
        `Identify key vendors and implementation partners for ${signal.company_name}`,
        `Analyze competitive positioning and market impact of this transformation`,
        `Review ${signal.company_name}'s recent financial filings for transformation budget details`,
        `Monitor job postings for hiring trends related to this project`
      ];
    }
    
    // Find the "Actionable Next Steps" section (handles headings or plain labels)
    const nextStepsMatch = analysis.match(/(?:^|\n)#{0,3}\s*Actionable Next Steps:?\s*([\s\S]*?)(?=\n\n[A-Z#]|$)/i);
    
    if (!nextStepsMatch) {
      // If no explicit section, extract numbered or bulleted items from the full analysis
      const steps = analysis
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.match(/^(?:\d+\.|\*{1,2}|-|•)\s+/))
        .map(line => line.replace(/^(?:\d+\.|\*{1,2}|-|•)\s+/, ''))
        .map(line => line.replace(/\*{1,2}/g, '')) // Remove markdown bold
        .map(line => line.replace(/\b(the)\s+\1\b/gi, '$1')) // Remove duplicate "the the"
        .filter(line => line.length > 15 && line.length < 200); // Reasonable length
      
      if (steps.length > 0) return steps.slice(0, 5);
      
      // Still no steps? Generate defaults
      return [
        `What is the current status of ${signal.company_name}'s transformation project?`,
        `Who are the key implementation partners working with ${signal.company_name}?`,
        `What is the estimated budget and timeline for this transformation?`,
        `How does this compare to similar transformations in the industry?`,
        `What are the main risks and challenges for this implementation?`
      ];
    }
    
    const nextStepsText = nextStepsMatch[1];
    
    // Extract bullet points (lines starting with -, *, •, or numbers)
    const steps = nextStepsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.match(/^[-*•\d.]+\s+/))
      .map(line => line.replace(/^[-*•\d.]+\s+/, ''))
      .map(line => line.replace(/\*{1,2}/g, '')) // Remove markdown bold
      .map(line => line.replace(/\b(the)\s+\1\b/gi, '$1')) // Remove duplicate "the the"
      .map(line => line.replace(/\b(\w+)\s+\1\b/gi, '$1')) // Remove any duplicate words
      .filter(line => line.length > 10); // Filter out very short lines
    
    return steps.slice(0, 5); // Limit to 5 actionable steps
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="w-80 border-r bg-muted/20 flex flex-col h-full">
      <div className="p-4 border-b bg-background flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Report Context</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {signals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No report loaded</p>
              <p className="text-xs mt-1">Generate a report to see signal context</p>
            </div>
          ) : (
            signals.map((signal) => (
              <Card key={signal.id} className="p-3">
                <div className="space-y-2">
                  <div>
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      {signal.company_name}
                    </h3>
                    {signal.company_ticker && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {signal.company_ticker}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Badge variant="outline" className="text-xs">
                      {formatSignalType(signal.signal_type)}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-full rounded-full ${getConfidenceColor(signal.confidence_score)}`} />
                      <span className="text-xs font-medium whitespace-nowrap">
                        {(signal.confidence_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {signal.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {signal.keywords.slice(0, 3).map((keyword, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {extractActionableSteps(signal).length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">
                        Actionable Next Steps:
                      </p>
                      <div className="space-y-1">
                        {extractActionableSteps(signal).map((step, idx) => (
                          <button
                            key={idx}
                            onClick={() => onQuestionClick(step)}
                            className="w-full text-left text-xs p-2 rounded hover:bg-muted transition-colors border border-transparent hover:border-primary/20"
                            title="Click to research this action"
                          >
                            {step}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-background">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => localStorage.removeItem('activeReportContext')}
        >
          Clear Context
        </Button>
      </div>
    </div>
  );
};
