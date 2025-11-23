import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Search, TrendingUp, Building2, AlertCircle, ExternalLink, Loader2, FileText, Download, Key, Lock, FileBarChart } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ROICalculator } from '@/components/ROICalculator';
import { ReportsDashboard } from '@/components/ReportsDashboard';

interface Signal {
  id: string;
  company_name: string;
  company_ticker: string | null;
  signal_type: string;
  confidence_score: number;
  source_type: string;
  source_url: string;
  keywords: string[];
  detected_at: string;
}

export const SignalsDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [filteredSignals, setFilteredSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [targetUrl, setTargetUrl] = useState('');
  const [sourceType, setSourceType] = useState('linkedin');
  const [selectedSignals, setSelectedSignals] = useState<Set<string>>(new Set());
  const [generatingReport, setGeneratingReport] = useState<'analyst' | 'portfolio_manager' | null>(null);
  const { toast } = useToast();
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

  useEffect(() => {
    if (user) {
      fetchSignals();
    }
  }, [user]);

  useEffect(() => {
    filterSignals();
  }, [signals, searchTerm, filterType]);

  const fetchSignals = async (scanTypeFilter?: 'smart' | 'manual') => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('signals')
        .select('*');
      
      if (scanTypeFilter) {
        query = query.eq('scan_type', scanTypeFilter);
      }
      
      const { data, error } = await query.order('detected_at', { ascending: false });

      if (error) throw error;
      setSignals(data || []);
    } catch (error) {
      console.error('Error fetching signals:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch signals',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSignals = () => {
    let filtered = signals;

    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(s => s.signal_type === filterType);
    }

    setFilteredSignals(filtered);
  };

  const startScraping = async () => {
    if (!targetUrl) {
      toast({
        title: 'Error',
        description: 'Please enter a URL to scrape',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to scrape sources',
        variant: 'destructive',
      });
      return;
    }

    setScraping(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('scrape-source', {
        body: { sourceType, targetUrl },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Found ${data.signalsFound} transformation signals`,
      });

      fetchSignals();
      setTargetUrl('');
    } catch (error) {
      console.error('Error scraping:', error);
      toast({
        title: 'Error',
        description: 'Failed to scrape source',
        variant: 'destructive',
      });
    } finally {
      setScraping(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const formatSignalType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const exportToCSV = () => {
    const headers = ['Company', 'Ticker', 'Signal Type', 'Source Type', 'Confidence Score', 'Keywords', 'Detected At', 'Source URL'];
    const rows = filteredSignals.map(signal => [
      signal.company_name,
      signal.company_ticker || 'N/A',
      formatSignalType(signal.signal_type),
      signal.source_type,
      `${(signal.confidence_score * 100).toFixed(0)}%`,
      signal.keywords.join(', '),
      new Date(signal.detected_at).toLocaleDateString(),
      signal.source_url
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transformation-signals-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Success',
      description: 'CSV report exported successfully',
    });
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
    if (selectedSignals.size === filteredSignals.length) {
      setSelectedSignals(new Set());
    } else {
      setSelectedSignals(new Set(filteredSignals.map(s => s.id)));
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
        : 'Analyst Transformation Report';
      const subtitle = 'Enterprise SAAS Transformation Intelligence';
      
      pdf.addBrandedHeader(title, subtitle);
      
      // Add metadata
      pdf.addMetadata({
        'Generated': new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        'Report Type': reportLevel === 'portfolio_manager' ? 'Executive Portfolio Manager' : 'Detailed Analyst',
        'Signals Analyzed': String(selectedSignals.size),
        'Confidence Threshold': '50%+'
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
        formatSignalType(signal.signal_type),
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

      // Add evidence summary if available
      const hasEvidence = data.signals.some((s: any) => s.signal_evidence && s.signal_evidence.length > 0);
      if (hasEvidence) {
        pdf.addPage();
        pdf.addSectionHeader('Evidence Summary', 1);
        
        data.signals.forEach((signal: any) => {
          if (signal.signal_evidence && signal.signal_evidence.length > 0) {
            pdf.addSectionHeader(signal.company_name, 3);
            const evidenceItems = signal.signal_evidence.slice(0, 3).map((e: any) => 
              `${e.evidence_type}: ${e.evidence_text?.substring(0, 200)}...`
            );
            pdf.addBulletList(evidenceItems);
          }
        });
      }

      const filename = `${reportLevel}-report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

      // Store report context for chatbot consumption
      const reportContext = {
        signals: data.signals,
        analysis: data.analysis,
        reportLevel,
        generatedAt: new Date().toISOString(),
        reportId: `${reportLevel}-${Date.now()}`
      };
      localStorage.setItem('activeReportContext', JSON.stringify(reportContext));

      // Extract key insights for initial context preview
      const insights = data.analysis.split('\n\n').slice(0, 3).join('\n\n');

      // Show toast with chatbot navigation option
      toast({
        title: '✅ Report Generated Successfully!',
        description: `📄 ${filename} downloaded. Continue analysis in the AI chatbot.`,
        action: (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              navigate('/chatbot', { state: { reportContext: insights, selectedSignalIds: Array.from(selectedSignals) } });
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

  const exportToPDF = async () => {
    const { PDFReportBuilder, DEFAULT_BRANDING } = await import('@/lib/pdf-utils');
    const { getLogoAsBase64 } = await import('@/lib/logo-utils');
    
    // Get logo as base64
    const logoBase64 = await getLogoAsBase64();
    
    const pdf = new PDFReportBuilder({
      ...DEFAULT_BRANDING,
      logoBase64
    });
    
    // Add branded header
    pdf.addBrandedHeader(
      'Transformation Signals Report',
      'Quick Export - All Detected Signals'
    );
    
    // Add metadata
    pdf.addMetadata({
      'Generated': new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      'Total Signals': String(filteredSignals.length),
      'Active Filters': searchTerm || filterType !== 'all' ? 'Yes' : 'None'
    });
    
    pdf.addSectionHeader('All Signals', 1);
    
    // Prepare table data
    const tableData = filteredSignals.map(signal => [
      signal.company_name,
      signal.company_ticker || 'N/A',
      formatSignalType(signal.signal_type),
      signal.source_type,
      `${(signal.confidence_score * 100).toFixed(0)}%`,
      signal.keywords.slice(0, 3).join(', '),
      new Date(signal.detected_at).toLocaleDateString()
    ]);

    // Add table
    autoTable(pdf.getDoc(), {
      startY: pdf.getCurrentY(),
      head: [['Company', 'Ticker', 'Signal Type', 'Source', 'Confidence', 'Keywords', 'Date']],
      body: tableData,
      styles: { fontSize: 7, cellPadding: 2, lineWidth: 0.1, lineColor: [200, 200, 200] },
      headStyles: { 
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 30, fontStyle: 'bold' },
        1: { cellWidth: 18 },
        2: { cellWidth: 30 },
        3: { cellWidth: 22 },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 38 },
        6: { cellWidth: 22 }
      }
    });
    
    const filename = `transformation-signals-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);

    // Store minimal context for chatbot
    const exportContext = {
      signals: filteredSignals.slice(0, 10), // First 10 signals
      generatedAt: new Date().toISOString(),
      totalSignals: filteredSignals.length
    };
    localStorage.setItem('activeReportContext', JSON.stringify(exportContext));

    toast({
      title: '✅ Export Complete!',
      description: `📄 ${filename} downloaded successfully.`,
      action: (
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => {
            navigate('/chatbot', { state: { exportedReport: true } });
          }}
        >
          💬 Analyze in Chatbot
        </Button>
      ),
      duration: 8000,
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Transformation Signals</h1>
          <p className="text-muted-foreground">
            Track ERP, CRM, and infrastructure transformation signals across multiple sources
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <TrendingUp className="w-4 h-4 mr-2" />
            {signals.length} Total Signals
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportToCSV}
            disabled={filteredSignals.length === 0}
          >
            <FileText className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportToPDF}
            disabled={filteredSignals.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button 
            variant="default" 
            size="sm" 
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
                Analyst Report ({selectedSignals.size})
              </>
            )}
          </Button>
          <Button 
            variant="default" 
            size="sm" 
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
                PM Report ({selectedSignals.size})
              </>
            )}
          </Button>
          <ROICalculator />
        </div>
      </div>

      <Tabs defaultValue="signals" className="space-y-6">
        <TabsList>
          <TabsTrigger value="signals">Signals</TabsTrigger>
          <TabsTrigger value="reports">Recurring Reports</TabsTrigger>
          <TabsTrigger value="sources">Add Sources</TabsTrigger>
          <TabsTrigger value="api">
            <Key className="w-4 h-4 mr-2" />
            API Access
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-6">
          <ReportsDashboard />
        </TabsContent>

        <TabsContent value="sources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New Source</CardTitle>
              <CardDescription>
                Scrape a new source for transformation signals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Select value={sourceType} onValueChange={setSourceType}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="glassdoor">Glassdoor</SelectItem>
                    <SelectItem value="indeed">Indeed</SelectItem>
                    <SelectItem value="company_website">Company Website</SelectItem>
                    <SelectItem value="news_site">News Site</SelectItem>
                    <SelectItem value="reddit">Reddit</SelectItem>
                    <SelectItem value="hackernews">Hacker News</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Enter URL to scrape..."
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={startScraping} disabled={scraping}>
                  {scraping ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    'Start Scraping'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="rounded-full bg-muted p-6">
                <Lock className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold">API Access</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Programmatic access to transformation signals with tenant-based API keys
              </p>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Coming Soon
              </Badge>
              <div className="text-sm text-muted-foreground text-center max-w-lg space-y-2 pt-4">
                <p>Future features will include:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Tenant-specific API keys</li>
                  <li>RESTful endpoints for signal queries</li>
                  <li>Webhook notifications for new signals</li>
                  <li>Rate limiting and usage analytics</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signals" className="space-y-6">
          <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search companies or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="erp_transformation">ERP Transformation</SelectItem>
            <SelectItem value="crm_implementation">CRM Implementation</SelectItem>
            <SelectItem value="infrastructure_modernization">Infrastructure Modernization</SelectItem>
            <SelectItem value="digital_transformation">Digital Transformation</SelectItem>
            <SelectItem value="cloud_migration">Cloud Migration</SelectItem>
            <SelectItem value="data_analytics">Data Analytics</SelectItem>
            <SelectItem value="cybersecurity_upgrade">Cybersecurity Upgrade</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredSignals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No signals found. Start scraping sources to identify potential transformation signals.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-4">
            <Checkbox
              checked={selectedSignals.size === filteredSignals.length && filteredSignals.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedSignals.size > 0 
                ? `${selectedSignals.size} signal${selectedSignals.size > 1 ? 's' : ''} selected`
                : 'Select signals to generate reports'}
            </span>
          </div>
          <div className="grid gap-4">
            {filteredSignals.map((signal) => (
              <Card key={signal.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedSignals.has(signal.id)}
                      onCheckedChange={() => toggleSignalSelection(signal.id)}
                      className="mt-1"
                    />
                    <div className="flex items-start justify-between flex-1">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                      <h3 className="text-xl font-semibold">{signal.company_name}</h3>
                      {signal.company_ticker && (
                        <Badge variant="secondary">{signal.company_ticker}</Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        Detected Signal: {formatSignalType(signal.signal_type)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="font-medium">{formatSignalType(signal.signal_type)}</Badge>
                        <Badge variant="outline">{signal.source_type}</Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {signal.keywords.map((keyword, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Detected {new Date(signal.detected_at).toLocaleDateString()}</span>
                      <a 
                        href={signal.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        View Source <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {(signal.confidence_score * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Confidence</div>
                        </div>
                        <div className={`h-2 w-24 rounded-full ${getConfidenceColor(signal.confidence_score)}`} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
        </TabsContent>
      </Tabs>
    </div>
  );
};