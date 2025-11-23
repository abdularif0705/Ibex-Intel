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
import { Loader2, Search, ArrowLeft, Building2, TrendingUp, Info, ExternalLink, FileBarChart, MessageCircle, CheckCircle2, Globe } from "lucide-react";
import { Progress } from "./ui/progress";
import { Checkbox } from "./ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

const FREE_TRIAL_SCAN_LIMIT = 15;

export const CompanySearchDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [companyName, setCompanyName] = useState("");
  const [ticker, setTicker] = useState("");
  const [scanProgress, setScanProgress] = useState<any>(null);
  const [selectedSignals, setSelectedSignals] = useState<Set<string>>(new Set());
  const [generatingReport, setGeneratingReport] = useState<'analyst' | 'portfolio_manager' | null>(null);
  const [reportInsights, setReportInsights] = useState<string>('');
  const [verifiedCompany, setVerifiedCompany] = useState<any>(null);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [showManualVerificationDialog, setShowManualVerificationDialog] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string>('');
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

  // Real-time subscription for new signals
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'signals'
        },
        (payload) => {
          console.log(payload)
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Invalidate and refetch signals when a new one comes in or is updated
            queryClient.invalidateQueries({ queryKey: ['signals', 'smart'] });
            
            // Optional: Show a toast or notification for new signals
            if (payload.eventType === 'INSERT') {
              toast({
                title: "New Signal Detected",
                description: "A new signal has been found by the deep scan.",
                duration: 3000,
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Supabase Realtime Status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: scanLimits } = useQuery({
    queryKey: ['user_scan_limits', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      let { data, error } = await supabase
        .from('user_scan_limits')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
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

  const { data: signals, isLoading } = useQuery({
    queryKey: ['signals', 'smart'], // Separate query key for smart scans
    queryFn: async () => {
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .eq('scan_type', 'smart') // Only fetch smart scans
        .order('detected_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isFreeTrialUser = scanLimits?.plan_type === 'free_trial';
  const remainingScans = isFreeTrialUser 
    ? Math.max(0, FREE_TRIAL_SCAN_LIMIT - (scanLimits?.scan_count || 0))
    : null;

  const scanMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('intelligent-scan', {
        body: { 
          companyName: (verifiedCompany?.name || companyName || ticker) || undefined,
          ticker: (verifiedCompany?.ticker || ticker) || undefined
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setScanProgress(data.progress);
      
      toast({
        title: "✅ Deep Scan In progress",
        description: `Scanning multiple sources with job posting analysis.`,
        duration: 5000,
      });
      
      queryClient.invalidateQueries({ queryKey: ['signals', 'smart'] });
      queryClient.invalidateQueries({ queryKey: ['user_scan_limits'] });
      setCompanyName("");
      
      setTimeout(() => setScanProgress(null), 3000);
    },
    onError: (error: any) => {
      setScanProgress(null);
      // Try to surface structured error from backend if present
      const message = typeof error?.message === 'string' && !/non-2xx/i.test(error.message)
        ? error.message
        : (error?.context?.error || error?.context?.message || 'Deep scan failed');
      toast({
        title: "Scan Failed",
        description: message,
        variant: "destructive",
      });
    },
  });

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

      const { default: autoTable } = await import('jspdf-autotable');
      const { PDFReportBuilder, parseMarkdownSections } = await import('@/lib/pdf-utils');
      
      const pdf = new PDFReportBuilder();
      
      // Add branded header
      const title = reportLevel === 'portfolio_manager' 
        ? 'Portfolio Manager Investment Report' 
        : 'Deep Intelligence Transformation Report';
      const subtitle = 'Smart Scan Results - Job Posting Analysis';
      
      pdf.addBrandedHeader(title, subtitle);
      
      // Add metadata
      pdf.addMetadata({
        'Generated': new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        'Report Type': reportLevel === 'portfolio_manager' ? 'Executive Portfolio Manager' : 'Detailed Analyst',
        'Signals Analyzed': String(selectedSignals.size),
        'Scan Type': 'Deep Intelligence (Job Postings)'
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
        signal.signal_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
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

      const filename = `smart-${reportLevel}-report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

      const reportContext = {
        signals: data.signals,
        analysis: data.analysis,
        reportLevel,
        scanType: 'smart',
        generatedAt: new Date().toISOString(),
        reportId: `smart-${reportLevel}-${Date.now()}`
      };
      localStorage.setItem('activeReportContext', JSON.stringify(reportContext));

      // Extract key insights for chatbot follow-up
      const insights = data.analysis.split('\n\n').slice(0, 3).join('\n\n');
      setReportInsights(insights);

      // Show toast with chatbot navigation option
      toast({
        title: '✅ Report Generated Successfully!',
        description: `📄 ${filename} downloaded. These are deep-scanned signals with job posting analysis.`,
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
    } catch (error: any) {
      console.error('Error generating report:', error);
      
      let errorMessage = 'Failed to generate report';
      
      // Check if it's a Supabase function error with a message
      if (error?.message) {
        errorMessage = error.message;
      }
      // Check if the error data contains a more specific error
      else if (typeof error === 'object' && error !== null) {
        if ('error' in error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
        duration: 8000,
      });
    } finally {
      setGeneratingReport(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() && !ticker.trim()) {
      toast({
        title: "Company Name or Ticker Required",
        description: "Please enter a company name or stock ticker",
        variant: "destructive",
      });
      return;
    }
    verifyCompany();
  };

  const verifyCompany = async () => {
    setVerifying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('verify-company', {
        body: { 
          companyName: companyName.trim() || undefined,
          ticker: ticker.trim() || undefined
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) throw error;
      
      // Handle AI verification failure gracefully
      if (!data.success) {
        setVerificationError(data.error || 'Could not verify company information');
        setShowManualVerificationDialog(true);
        setVerifying(false);
        return;
      }
      
      // Handle low confidence
      if (data.company.confidence < 0.5) {
        setVerificationError('Low confidence in company verification');
        setShowManualVerificationDialog(true);
        setVerifying(false);
        return;
      }

      setVerifiedCompany(data.company);
      setShowVerificationDialog(true);
    } catch (error: any) {
      console.error('Error verifying company:', error);
      
      let errorMessage = 'Could not verify company information';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        if ('error' in error && typeof error.error === 'string') {
          errorMessage = error.error;
        }
      }
      
      setVerificationError(errorMessage);
      setShowManualVerificationDialog(true);
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirmScan = () => {
    setShowVerificationDialog(false);
    scanMutation.mutate();
  };

  const handleManualConfirmScan = () => {
    setShowManualVerificationDialog(false);
    // Create a basic company object from user input
    setVerifiedCompany({
      name: companyName.trim(),
      ticker: ticker.trim() || null,
      website: null,
      industry: null,
      location: null,
      type: 'unknown',
      confidence: 0
    });
    scanMutation.mutate();
  };

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

  if (!user) {
    return null;
  }

  const progressPercentage = scanProgress 
    ? (scanProgress.sourcesScanned.length / (scanProgress.sourcesScanned.length + 1)) * 100
    : 0;

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Deep Company Scanner</h1>
              <p className="text-muted-foreground mt-1">
                Comprehensive scans across all sources including individual job postings
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Search Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Company Deep Scan</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p className="text-sm">
                    Deep scanning analyzes:
                    <br />• Job board listing pages
                    <br />• Top 10 individual job postings per source
                    <br />• Company websites and career pages
                    <br />• News and official announcements
                    <br />
                    <br />~77 credits per search for comprehensive coverage
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {isFreeTrialUser && remainingScans !== null && (
            <Badge variant={remainingScans <= 5 ? "destructive" : "secondary"}>
              {remainingScans} scans remaining
            </Badge>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company Name</label>
              <Input
                placeholder="e.g., Salesforce, Nike, City of Austin"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={verifying || scanMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Stock Ticker (Optional)</label>
              <Input
                placeholder="e.g., CRM, NKE"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                disabled={verifying || scanMutation.isPending}
                className="uppercase"
              />
            </div>
          </div>
          <Button 
            type="submit" 
            disabled={verifying || scanMutation.isPending || (!companyName.trim() && !ticker.trim())}
            className="gap-2 w-full"
          >
            {verifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying Company...
              </>
            ) : scanMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Verify & Deep Scan
              </>
            )}
          </Button>

          {scanMutation.isPending && (
            <div className="space-y-2">
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                Deep scanning with individual job posting analysis...
              </p>
            </div>
          )}

          {scanProgress && !scanMutation.isPending && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="w-4 h-4 text-primary" />
                Scan Summary
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Sources Scanned:</span>
                  <span className="ml-2 font-medium">{scanProgress.sourcesScanned.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Signals Found:</span>
                  <span className="ml-2 font-medium">{scanProgress.signalsFound}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Max Confidence:</span>
                  <span className="ml-2 font-medium">{(scanProgress.currentConfidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          )}
        </form>
      </Card>

      {/* Signals List with Selection */}
      {signals && signals.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Deep Scan Results ({signals.length})</h2>
              <Checkbox
                checked={signals.length > 0 && selectedSignals.size === signals.length}
                onCheckedChange={toggleSelectAll}
                id="select-all"
              />
              <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">
                Select All
              </label>
            </div>
            {selectedSignals.size > 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={() => generateAIReport('analyst')}
                  disabled={generatingReport !== null}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {generatingReport === 'analyst' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileBarChart className="w-4 h-4" />
                  )}
                  Analyst Report ({selectedSignals.size})
                </Button>
                <Button
                  onClick={() => generateAIReport('portfolio_manager')}
                  disabled={generatingReport !== null}
                  size="sm"
                  className="gap-2"
                >
                  {generatingReport === 'portfolio_manager' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileBarChart className="w-4 h-4" />
                  )}
                  Portfolio Manager Report
                </Button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {signals.map((signal) => (
                <div 
                  key={signal.id} 
                  className={`flex items-start gap-3 p-4 border rounded-lg transition-colors ${
                    selectedSignals.has(signal.id) ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                  }`}
                >
                  <Checkbox
                    checked={selectedSignals.has(signal.id)}
                    onCheckedChange={() => toggleSignalSelection(signal.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{signal.company_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {formatSourceType(signal.source_type)}
                          </Badge>
                          <Badge className={`${getConfidenceBadgeColor(signal.confidence_score)} text-xs`}>
                            {(signal.confidence_score * 100).toFixed(0)}% Confidence
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Deep Scan
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="shrink-0"
                      >
                        <a href={signal.source_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                    {signal.keywords && signal.keywords.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        <span className="font-medium">Keywords:</span> {signal.keywords.slice(0, 5).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {signals && signals.length === 0 && !isLoading && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No deep scan results yet. Run a scan to get started.
          </p>
        </Card>
      )}

      {/* Company Verification Dialog */}
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Company Verified
            </DialogTitle>
            <DialogDescription>
              Please confirm this is the correct company before proceeding with the deep scan
            </DialogDescription>
          </DialogHeader>
          
          {verifiedCompany && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                  <p className="text-lg font-semibold mt-1">{verifiedCompany.name}</p>
                </div>
                {verifiedCompany.ticker && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Stock Ticker</label>
                    <p className="text-lg font-semibold mt-1">{verifiedCompany.ticker}</p>
                  </div>
                )}
              </div>

              {verifiedCompany.website && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Website</label>
                  <a 
                    href={verifiedCompany.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline mt-1"
                  >
                    <Globe className="w-4 h-4" />
                    {verifiedCompany.website}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {verifiedCompany.industry && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Industry</label>
                    <p className="mt-1">{verifiedCompany.industry}</p>
                  </div>
                )}
                {verifiedCompany.location && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Location</label>
                    <p className="mt-1">{verifiedCompany.location}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Company Type</label>
                <Badge className="mt-1">
                  {verifiedCompany.type === 'public' && 'Publicly Traded'}
                  {verifiedCompany.type === 'private' && 'Private Company'}
                  {verifiedCompany.type === 'municipality' && 'Municipality/Government'}
                  {verifiedCompany.type === 'unknown' && 'Unknown Type'}
                </Badge>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Proceeding with the scan will analyze job postings, career pages, 
                  and other sources to detect SAAS implementation signals for <strong>{verifiedCompany.name}</strong>.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerificationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmScan} className="gap-2">
              <Search className="w-4 h-4" />
              Confirm & Start Deep Scan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Verification Dialog */}
      <Dialog open={showManualVerificationDialog} onOpenChange={setShowManualVerificationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-yellow-500" />
              AI Verification Unavailable
            </DialogTitle>
            <DialogDescription>
              {verificationError}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
              <p className="text-sm">
                You can proceed with the scan using the company information you entered. 
                The scan will still work normally, but we couldn't verify the company details via AI.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                <p className="text-lg font-semibold mt-1">{companyName}</p>
              </div>
              {ticker && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stock Ticker</label>
                  <p className="text-lg font-semibold mt-1">{ticker}</p>
                </div>
              )}
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> The scan will use "{companyName}" to search for SAAS implementation signals 
                across job postings, career pages, and other sources.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualVerificationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleManualConfirmScan} className="gap-2">
              <Search className="w-4 h-4" />
              Proceed Without AI Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
