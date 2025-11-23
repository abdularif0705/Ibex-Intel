import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Plus, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SmartSearchJob {
  id: string;
  status: string;
  results_count: number;
  target_url: string;
  started_at: string;
  completed_at?: string;
}

export function SmartSearchDashboard() {
  const [keywords, setKeywords] = useState<string[]>(['SAP S/4HANA implementation']);
  const [sourceTypes, setSourceTypes] = useState<string[]>(['linkedin', 'indeed', 'greenhouse']);
  const [location, setLocation] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('last_30_days');
  const [maxResults, setMaxResults] = useState<number>(50);
  const [loading, setLoading] = useState(false);
  const [currentJob, setCurrentJob] = useState<SmartSearchJob | null>(null);
  const [recentJobs, setRecentJobs] = useState<SmartSearchJob[]>([]);
  const { toast } = useToast();

  const availableSources = [
    { value: 'linkedin', label: 'LinkedIn Jobs', priority: 'High' },
    { value: 'indeed', label: 'Indeed', priority: 'High' },
    { value: 'glassdoor', label: 'Glassdoor', priority: 'Medium' },
    { value: 'greenhouse', label: 'Greenhouse', priority: 'High' },
    { value: 'lever', label: 'Lever', priority: 'Medium' },
    { value: 'workday', label: 'Workday Careers', priority: 'High' },
    { value: 'company_website', label: 'Company Websites', priority: 'Medium' },
    { value: 'news_site', label: 'News & Press Releases', priority: 'Low' },
    { value: 'sec_edgar', label: 'SEC Edgar Filings', priority: 'High' },
  ];

  const predefinedKeywords = [
    'SAP S/4HANA implementation',
    'Workday HCM implementation',
    'Oracle ERP consultant',
    'Salesforce implementation',
    'ERP cutover manager',
    'Cloud migration architect',
    'Digital transformation lead',
  ];

  useEffect(() => {
    fetchRecentJobs();
  }, []);

  useEffect(() => {
    if (currentJob && currentJob.status === 'running') {
      const interval = setInterval(() => {
        pollJobStatus(currentJob.id);
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [currentJob]);

  const fetchRecentJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('scraping_jobs')
        .select('*')
        .eq('source_type', 'other')
        .order('started_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentJobs(data || []);
    } catch (error) {
      console.error('Error fetching recent jobs:', error);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    try {
      const { data, error } = await supabase
        .from('scraping_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;

      setCurrentJob(data);

      if (data.status === 'completed') {
        toast({
          title: 'Smart Search Complete',
          description: `Found ${data.results_count} transformation signals`,
        });
        fetchRecentJobs();
      } else if (data.status === 'failed') {
        toast({
          title: 'Smart Search Failed',
          description: data.error_message || 'An error occurred',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error polling job status:', error);
    }
  };

  const handleSearch = async () => {
    const validKeywords = keywords.filter(k => k.trim().length > 0);
    
    if (validKeywords.length === 0) {
      toast({
        title: 'No Keywords',
        description: 'Please enter at least one keyword',
        variant: 'destructive',
      });
      return;
    }

    if (sourceTypes.length === 0) {
      toast({
        title: 'No Sources Selected',
        description: 'Please select at least one source to search',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('smart-search', {
        body: {
          keywords: validKeywords,
          sourceTypes,
          location: location.trim() || undefined,
          dateRange,
          maxResults,
        }
      });

      if (error) throw error;

      setCurrentJob({
        id: data.jobId,
        status: 'running',
        results_count: 0,
        target_url: validKeywords.join(', '),
        started_at: new Date().toISOString(),
      });

      toast({
        title: 'Smart Search Started',
        description: data.message || `Scanning ${data.urlsToScrape} URLs. Estimated time: ${data.estimatedTime}`,
      });
    } catch (error: any) {
      console.error('Smart search failed:', error);
      toast({
        title: 'Search Failed',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addKeyword = () => {
    setKeywords([...keywords, '']);
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const updateKeyword = (index: number, value: string) => {
    const newKeywords = [...keywords];
    newKeywords[index] = value;
    setKeywords(newKeywords);
  };

  const toggleSource = (source: string) => {
    if (sourceTypes.includes(source)) {
      setSourceTypes(sourceTypes.filter(s => s !== source));
    } else {
      setSourceTypes([...sourceTypes, source]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Smart Search</h1>
        <p className="text-muted-foreground mt-2">
          Search across multiple sources to find companies undergoing enterprise transformations
        </p>
      </div>

      {/* Main Search Card */}
      <Card>
        <CardHeader>
          <CardTitle>Configure Search</CardTitle>
          <CardDescription>
            Enter keywords related to enterprise transformations (SAP, Workday, Oracle, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Keywords Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Search Keywords</label>
              <Button onClick={addKeyword} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Keyword
              </Button>
            </div>
            
            {/* Predefined Keywords */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs text-muted-foreground">Quick add:</span>
              {predefinedKeywords.map((keyword) => (
                <Badge
                  key={keyword}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => {
                    if (!keywords.includes(keyword)) {
                      setKeywords([...keywords.filter(k => k.trim()), keyword]);
                    }
                  }}
                >
                  {keyword}
                </Badge>
              ))}
            </div>

            {keywords.map((keyword, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={keyword}
                  onChange={(e) => updateKeyword(index, e.target.value)}
                  placeholder="e.g., SAP S/4HANA implementation consultant"
                  className="flex-1"
                />
                {keywords.length > 1 && (
                  <Button
                    onClick={() => removeKeyword(index)}
                    variant="ghost"
                    size="icon"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Sources Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Sources to Search</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableSources.map(({ value, label, priority }) => (
                <div
                  key={value}
                  className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => toggleSource(value)}
                >
                  <Checkbox
                    checked={sourceTypes.includes(value)}
                    onCheckedChange={() => toggleSource(value)}
                  />
                  <div className="flex-1">
                    <label className="text-sm font-medium cursor-pointer">
                      {label}
                    </label>
                    <Badge
                      variant={priority === 'High' ? 'default' : 'secondary'}
                      className="ml-2 text-xs"
                    >
                      {priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Location (Optional)</label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., United States, California"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Max Results</label>
              <Select value={maxResults.toString()} onValueChange={(v) => setMaxResults(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 URLs</SelectItem>
                  <SelectItem value="50">50 URLs</SelectItem>
                  <SelectItem value="100">100 URLs</SelectItem>
                  <SelectItem value="200">200 URLs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cost Estimate */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Estimated cost: ${(maxResults * 0.75).toFixed(2)} - ${(maxResults * 1.5).toFixed(2)} 
              {' '}(based on {maxResults} URLs at $0.75-1.50 per URL)
            </AlertDescription>
          </Alert>

          {/* Search Button */}
          <Button
            onClick={handleSearch}
            disabled={loading || keywords.filter(k => k.trim()).length === 0 || sourceTypes.length === 0}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting Search...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Start Smart Search
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Current Job Status */}
      {currentJob && (
        <Card>
          <CardHeader>
            <CardTitle>Search Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={currentJob.status === 'completed' ? 'default' : 'secondary'}>
                  {currentJob.status === 'running' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  {currentJob.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Keywords:</span>
                <span className="text-sm text-muted-foreground">{currentJob.target_url}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Signals Found:</span>
                <span className="text-sm font-bold">{currentJob.results_count}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Searches */}
      {recentJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{job.target_url}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(job.started_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                      {job.status}
                    </Badge>
                    <span className="text-sm font-bold">{job.results_count} signals</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}




