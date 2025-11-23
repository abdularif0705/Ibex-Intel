import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { useToast } from "./ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2, Search, ExternalLink, Calendar, ArrowLeft, FileBarChart, MessageCircle } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const allSourceTypes = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'glassdoor', label: 'Glassdoor' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'ashby', label: 'Ashby' },
  { value: 'greenhouse', label: 'Greenhouse' },
  { value: 'clay', label: 'Clay' },
  { value: 'levels_fyi', label: 'Levels.fyi' },
  { value: 'teksystems', label: 'TEKsystems' },
  { value: 'toptal', label: 'Toptal' },
  { value: 'adecco_group', label: 'The Adecco Group' },
  { value: 'headhunter', label: 'Headhunter (Robert Half, etc.)' },
  { value: 'recruiting_site', label: 'Recruiting Website' },
  { value: 'glg', label: 'GLG' },
  { value: 'tegus', label: 'Tegus' },
  { value: 'alphasights', label: 'Alphasights' },
  { value: 'cio_magazine', label: 'CIO Magazine' },
  { value: 'company_website', label: 'Company Website' },
  { value: 'news_site', label: 'News Site' },
  { value: 'prnewswire', label: 'PRNewswire' },
  { value: 'blog', label: 'Blog' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'hackernews', label: 'Hacker News' },
  { value: 'teamblind', label: 'Team Blind' },
  { value: 'sec_edgar', label: 'SEC Edgar' },
  { value: 'other', label: 'Other' },
];

const freeTrialSourceTypes = [
  { value: 'company_website', label: 'Company Website' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'indeed', label: 'Indeed' },
];

const FREE_TRIAL_SCAN_LIMIT = 15;

export const ScrapingDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [targetUrl, setTargetUrl] = useState("");
  const [sourceType, setSourceType] = useState("company_website");
  const [scrapingMethod, setScrapingMethod] = useState<'firecrawl' | 'fetch' | 'python'>('firecrawl');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSignals, setSelectedSignals] = useState<Set<string>>(new Set());
  const [generatingReport, setGeneratingReport] = useState<'analyst' | 'portfolio_manager' | null>(null);
  const [showChatbotPrompt, setShowChatbotPrompt] = useState(false);
  const [reportInsights, setReportInsights] = useState<string>('');
  const isMobile = useIsMobile();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: signals, isLoading } = useQuery({
    queryKey: ['signals', 'manual'], // Separate query key for manual scans
    queryFn: async () => {
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .eq('scan_type', 'manual') // Only fetch manual scans
        .order('detected_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching signals:', error);
        throw error;
      }
      console.log('Fetched manual signals:', data);
      return data;
    },
    enabled: !!user,
  });

  const { data: jobs } = useQuery({
    queryKey: ['scraping_jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scraping_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: scanLimits, isLoading: limitsLoading } = useQuery({
    queryKey: ['user_scan_limits', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      // Try to get existing limits
      let { data, error } = await supabase
        .from('user_scan_limits')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      // If no record exists, create one
      if (error && error.code === 'PGRST116') {
        const { data: newData, error: insertError } = await supabase
          .from('user_scan_limits')
          .insert({
            user_id: user.id,
            scan_count: 0,
            plan_type: 'free_trial'
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        data = newData;
      } else if (error) {
        throw error;
      }
      
      return data;
    },
    enabled: !!user,
  });

  const isFreeTrialUser = scanLimits?.plan_type === 'free_trial';
  const remainingScans = isFreeTrialUser 
    ? Math.max(0, FREE_TRIAL_SCAN_LIMIT - (scanLimits?.scan_count || 0))
    : null;
  const hasReachedLimit = isFreeTrialUser && remainingScans !== null && remainingScans <= 0;
  const sourceTypes = allSourceTypes; // All sources enabled for testing

  const scrapeMutation = useMutation({
    mutationFn: async () => {
      if (hasReachedLimit) {
        throw new Error('You have reached your free trial scan limit of 15 scans');
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      // Use advanced scraping methods if selected
      if (scrapingMethod === 'fetch' || scrapingMethod === 'python') {
        const { data, error } = await supabase.functions.invoke('advanced-scrape', {
          body: { 
            url: targetUrl,
            method: scrapingMethod,
          },
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });

        if (error) throw error;

        // If scraping failed, throw an error
        if (data && !data.success) {
          throw new Error(data.error || 'Advanced scraping failed');
        }

        // Now analyze the content with the standard scraping service
        // Pass the scraped content to the scrape-source function
        const analysisResult = await supabase.functions.invoke('scrape-source', {
          body: { 
            sourceType, 
            targetUrl, 
            searchQuery,
            scrapedContent: data.content, // Pass pre-scraped content
            scrapingMethod: scrapingMethod
          },
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });

        if (analysisResult.error) throw analysisResult.error;
        if (analysisResult.data && analysisResult.data.success === false) {
          throw new Error(analysisResult.data.error || 'Content analysis failed');
        }
        
        return analysisResult.data;
      }

      // Use standard Firecrawl method
      const { data, error } = await supabase.functions.invoke('scrape-source', {
        body: { sourceType, targetUrl, searchQuery },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) throw error;

      // If backend returned a structured error in a 200 response, surface it
      if (data && data.success === false) {
        throw new Error(data.error || 'Scraping failed');
      }
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Scraping Complete",
        description: `Found ${data.signalsFound} transformation signals`,
      });
      queryClient.invalidateQueries({ queryKey: ['signals', 'manual'] });
      queryClient.invalidateQueries({ queryKey: ['scraping_jobs'] });
      queryClient.invalidateQueries({ queryKey: ['user_scan_limits'] });
      setTargetUrl("");
    },
    onError: (error: Error) => {
      toast({
        title: "Scraping Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getConfidenceBadgeColor = (score: number) => {
    if (score >= 0.8) return "bg-green-500";
    if (score >= 0.5) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const formatSourceType = (sourceType: string) => {
    return sourceType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const toggleSignalSelection = (signalId: string) => {
    const newSelected = new Set(selectedSignals);
    if (newSelected.has(signalId)) {
      newSelected.delete(signalId);
    } else {
      newSelected.add(signalId);
    }
    setSelectedSignals(newSelected);
  };

  const toggleSelectAll = () => {
    if (signals && selectedSignals.size === signals.length) {
      setSelectedSignals(new Set());
    } else if (signals) {
      setSelectedSignals(new Set(signals.map(s => s.id)));
    }
  };

  const generateAIReport = async (reportLevel: 'analyst' | 'portfolio_manager') => {
    if (selectedSignals.size === 0) {
      toast({
        title: 'No Signals Selected',
        description: 'Please select at least one signal to generate a report',
        variant: 'destructive',
      });
      return;
    }

    setGeneratingReport(reportLevel);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { 
          signalIds: Array.from(selectedSignals),
          reportLevel 
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) throw error;

      // Import PDF utilities
      const { default: autoTable } = await import('jspdf-autotable');
      const { PDFReportBuilder, parseMarkdownSections, DEFAULT_BRANDING } = await import('@/lib/pdf-utils');
      const { getLogoAsBase64 } = await import('@/lib/logo-utils');
      
      // Get logo as base64
      const logoBase64 = await getLogoAsBase64();
      
      const pdf = new PDFReportBuilder({
        ...DEFAULT_BRANDING,
        logoBase64
      });
      
      // Add branded header
      const title = reportLevel === 'portfolio_manager' 
        ? 'Portfolio Manager Investment Report' 
        : 'Custom Source Transformation Report';
      const subtitle = 'Multi-Source Aggregated Intelligence';
      
      pdf.addBrandedHeader(title, subtitle);
      
      // Add metadata
      pdf.addMetadata({
        'Generated': new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        'Report Type': reportLevel === 'portfolio_manager' ? 'Executive Portfolio Manager' : 'Detailed Analyst',
        'Signals Analyzed': String(selectedSignals.size),
        'Sources': 'Custom URLs'
      });
      
      // Parse and add AI analysis with proper formatting
      const sections = parseMarkdownSections(data.analysis);
      sections.forEach(section => {
        if (section.type === 'header') {
          pdf.addSectionHeader(section.content, (section.level as 1 | 2 | 3) || 1);
        } else if (section.type === 'paragraph') {
          pdf.addParagraph(section.content);
        } else if (section.type === 'list') {
          pdf.addBulletList(section.content.split('|||'));
        }
      });
      
      // Add signal details table
      if (pdf.getCurrentY() > 200) {
        pdf.addPage();
      }
      pdf.addSectionHeader('Signal Details', 1);
      
      const tableData = data.signals.map((signal: any) => [
        signal.company_name,
        signal.company_ticker || 'N/A',
        formatSourceType(signal.signal_type),
        `${(signal.confidence_score * 100).toFixed(0)}%`,
        signal.keywords.slice(0, 3).join(', '),
        new Date(signal.detected_at).toLocaleDateString(),
      ]);

      autoTable(pdf.getDoc(), {
        startY: pdf.getCurrentY(),
        head: [['Company', 'Ticker', 'Signal Type', 'Confidence', 'Keywords', 'Date']],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 3, lineWidth: 0.1, lineColor: [200, 200, 200] },
        headStyles: { 
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 35, fontStyle: 'bold' },
          1: { cellWidth: 20 },
          2: { cellWidth: 40 },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 45 },
          5: { cellWidth: 25 }
        }
      });

      const filename = `custom-${reportLevel}-report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

      // Store report context in localStorage for chatbot
      const reportContext = {
        signals: data.signals,
        analysis: data.analysis,
        reportLevel,
        generatedAt: new Date().toISOString(),
        reportId: `${reportLevel}-${Date.now()}`
      };
      localStorage.setItem('activeReportContext', JSON.stringify(reportContext));

      // Extract key insights for chatbot follow-up
      const insights = data.analysis.split('\n\n').slice(0, 3).join('\n\n');
      setReportInsights(insights);
      setShowChatbotPrompt(true);

      // Show toast with chatbot navigation option
      toast({
        title: '✅ Report Generated Successfully!',
        description: `📄 ${filename} has been downloaded. Click below to research these findings further in the AI chatbot.`,
        action: (
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full"
            onClick={() => {
              navigate('/chatbot', { 
                state: { 
                  reportContext: insights,
                  selectedSignalIds: Array.from(selectedSignals)
                }
              });
            }}
          >
            💬 Open Chatbot
          </Button>
        ),
        duration: 10000,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setGeneratingReport(null);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 sm:gap-4 mb-2">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Transformation Signal Scanner</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Monitor for ERP, CRM, and infrastructure transformation signals</p>
        </div>
        <Link to="/automation">
          <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Automated Reports</span>
            <span className="sm:hidden">Reports</span>
          </Button>
        </Link>
      </div>

      {/* Scraping Form */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">Start New Scan</h2>
          {isFreeTrialUser && remainingScans !== null && (
            <Badge variant={remainingScans <= 3 ? "destructive" : "secondary"}>
              {remainingScans} scans remaining
            </Badge>
          )}
        </div>
        {hasReachedLimit && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive font-medium">
              You've reached your free trial limit of {FREE_TRIAL_SCAN_LIMIT} scans. Upgrade to continue scanning.
            </p>
          </div>
        )}
        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">Scraping Method</label>
          <Select value={scrapingMethod} onValueChange={(value: any) => setScrapingMethod(value)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="firecrawl">
                <div className="flex flex-col">
                  <span className="font-medium">Firecrawl (Default)</span>
                  <span className="text-xs text-muted-foreground">Standard scraping with retry logic</span>
                </div>
              </SelectItem>
              <SelectItem value="fetch">
                <div className="flex flex-col">
                  <span className="font-medium">Enhanced Fetch</span>
                  <span className="text-xs text-muted-foreground">Browser-like headers for light anti-bot</span>
                </div>
              </SelectItem>
              <SelectItem value="python">
                <div className="flex flex-col">
                  <span className="font-medium">Python + curl_cffi</span>
                  <span className="text-xs text-muted-foreground">TLS fingerprint spoofing (requires setup)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Select value={sourceType} onValueChange={setSourceType}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sourceTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Enter URL to scrape..."
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            className="flex-1"
          />

          <Button 
            onClick={() => scrapeMutation.mutate()}
            disabled={!targetUrl || scrapeMutation.isPending || hasReachedLimit || limitsLoading}
            className="w-full sm:w-auto"
          >
            {scrapeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Scan
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Recent Jobs */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Recent Scans</h2>
        <div className="space-y-2">
          {jobs?.slice(0, 5).map((job) => (
            <div key={job.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-3 border rounded">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm sm:text-base">{formatSourceType(job.source_type)}</div>
                <div className="text-xs sm:text-sm text-muted-foreground truncate">{job.target_url}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={job.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </Badge>
                {job.results_count > 0 && (
                  <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{job.results_count} signals</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Signals */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">
            Detected Signals {signals && `(${signals.length})`}
          </h2>
          {signals && signals.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => generateAIReport('analyst')}
                disabled={selectedSignals.size === 0 || generatingReport !== null}
              >
                {generatingReport === 'analyst' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileBarChart className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Analyst Report ({selectedSignals.size})</span>
                    <span className="sm:hidden">Analyst ({selectedSignals.size})</span>
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={() => generateAIReport('portfolio_manager')}
                disabled={selectedSignals.size === 0 || generatingReport !== null}
              >
                {generatingReport === 'portfolio_manager' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileBarChart className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">PM Report ({selectedSignals.size})</span>
                    <span className="sm:hidden">PM ({selectedSignals.size})</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : signals && signals.length > 0 ? (
          <>
            <div className="flex items-center gap-4 mb-4">
              <Checkbox
                checked={selectedSignals.size === signals.length}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                {selectedSignals.size > 0 
                  ? `${selectedSignals.size} signal${selectedSignals.size > 1 ? 's' : ''} selected`
                  : 'Select signals to generate reports'}
              </span>
            </div>
            <div className="space-y-4">
              {signals.map((signal) => (
                <Card key={signal.id} className="p-3 sm:p-4 border-2 border-primary/20">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedSignals.has(signal.id)}
                      onCheckedChange={() => toggleSignalSelection(signal.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-2">
                        <div className="flex-1">
                    <h3 className="font-semibold text-base sm:text-lg">{signal.company_name}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge className="text-xs">{signal.signal_type.split('_').join(' ')}</Badge>
                      {signal.content_type && (
                        <Badge variant="secondary" className="text-xs">
                          {formatSourceType(signal.content_type)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Confidence:</span>
                      <Badge className={getConfidenceBadgeColor(signal.confidence_score)}>
                        {(signal.confidence_score * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(signal.detected_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                {signal.keywords && signal.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {signal.keywords.map((keyword: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}

                {signal.extracted_data && 
                 typeof signal.extracted_data === 'object' && 
                 signal.extracted_data !== null &&
                 'content_snippet' in signal.extracted_data && (
                  <div className="my-3 p-3 bg-muted/50 rounded-md border">
                    <p className="text-sm text-muted-foreground mb-1 font-medium">Content Preview:</p>
                    <p className="text-sm line-clamp-3">
                      {String((signal.extracted_data as any).content_snippet)}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <span>Source: {formatSourceType(signal.source_type)}</span>
                  <span className="hidden sm:inline">•</span>
                  <a 
                    href={signal.source_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Source
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          </>
        ) : (
          <div className="text-center p-8 text-sm sm:text-base text-muted-foreground">
            No signals found yet. Start a scan to identify potential transformation signals.
          </div>
        )}
      </Card>

      {/* Chatbot Follow-up Dialog */}
      <Dialog open={showChatbotPrompt} onOpenChange={setShowChatbotPrompt}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Research Further with AI Chatbot
            </DialogTitle>
            <DialogDescription>
              Your report has been generated. Want to dive deeper into the findings?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Key Insights from Report:</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-6">
                {reportInsights}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              The AI chatbot can help you:
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
              <li>Explore investment implications in detail</li>
              <li>Compare transformation risks across companies</li>
              <li>Get specific recommendations for your portfolio</li>
              <li>Understand confidence score methodologies</li>
            </ul>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowChatbotPrompt(false)}>
              Maybe Later
            </Button>
            <Button 
              onClick={() => {
                setShowChatbotPrompt(false);
                navigate('/chatbot', { 
                  state: { 
                    reportContext: reportInsights,
                    selectedSignalIds: Array.from(selectedSignals)
                  }
                });
              }}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Open Chatbot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};