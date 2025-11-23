import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { useToast } from "./ui/use-toast";
import { Loader2, Mail, Calendar, TrendingUp, Zap, ArrowLeft, LogOut } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export const AutomationDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [user, setUser] = useState<any>(null);
  const [frequency, setFrequency] = useState("weekly");
  const [minConfidence, setMinConfidence] = useState("0.5");
  const [audience, setAudience] = useState<"executive" | "analyst" | "technical">("analyst");
  const [reportName, setReportName] = useState("");
  const [companyFilters, setCompanyFilters] = useState("");
  const [sourceFilters, setSourceFilters] = useState<string[]>([]);
  const [customUrl, setCustomUrl] = useState("");
  const [customUrls, setCustomUrls] = useState<string[]>([]);
  const [urlError, setUrlError] = useState("");

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['report_subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_user_subscriptions');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createSubscription = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in");

      const companyFiltersArray = companyFilters
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);

      const { data, error } = await supabase
        .from('report_subscriptions')
        .insert([{
          user_id: user.id,
          email: user.email,
          frequency,
          min_confidence_score: parseFloat(minConfidence),
          audience,
          report_name: reportName || `${audience.charAt(0).toUpperCase() + audience.slice(1)} Report`,
          is_active: true,
          company_filters: companyFiltersArray.length > 0 ? companyFiltersArray : null,
          source_filters: sourceFilters.length > 0 ? sourceFilters : null,
          custom_monitor_urls: customUrls.length > 0 ? customUrls : null
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Subscription Created",
        description: "You'll start receiving automated reports at the scheduled frequency.",
      });
      queryClient.invalidateQueries({ queryKey: ['report_subscriptions'] });
      setReportName("");
      setCompanyFilters("");
      setSourceFilters([]);
      setCustomUrls([]);
      setCustomUrl("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleSubscription = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('report_subscriptions')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report_subscriptions'] });
    },
  });

  const sendTestReport = useMutation({
    mutationFn: async (subscription: any) => {
      const { data, error } = await supabase.functions.invoke('send-report', {
        body: {
          email: subscription.email,
          frequency: subscription.frequency,
          minConfidence: subscription.min_confidence_score,
          signalTypes: subscription.signal_types,
          audience: subscription.audience || 'analyst',
          companyFilters: subscription.company_filters,
          sourceFilters: subscription.source_filters,
          customMonitorUrls: subscription.custom_monitor_urls
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Test Report Sent",
        description: `Report with ${data.signalsCount} signals sent successfully!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSubscription = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('report_subscriptions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Subscription Deleted",
        description: "You will no longer receive automated reports.",
      });
      queryClient.invalidateQueries({ queryKey: ['report_subscriptions'] });
    },
  });

  const handleAddCustomUrl = () => {
    setUrlError("");
    
    if (!customUrl.trim()) {
      setUrlError("Please enter a URL");
      return;
    }

    // Validate URL format
    try {
      const url = new URL(customUrl);
      
      // Check for blocked domains
      const blockedDomains = ['linkedin.com', 'facebook.com', 'instagram.com', 'twitter.com', 'x.com'];
      const isBlocked = blockedDomains.some(domain => url.hostname.includes(domain));
      
      if (isBlocked) {
        setUrlError("⚠️ This site has strong anti-scraping protections. We cannot monitor it at this time. Please try a different source.");
        return;
      }

      if (customUrls.length >= 5) {
        setUrlError("Maximum 5 custom URLs allowed");
        return;
      }

      if (customUrls.includes(customUrl)) {
        setUrlError("URL already added");
        return;
      }

      setCustomUrls([...customUrls, customUrl]);
      setCustomUrl("");
    } catch {
      setUrlError("Please enter a valid URL (e.g., https://example.com)");
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
          <Link to="/scanner">
            <Button variant="ghost" size="sm" className="gap-2">
              Scanner
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          {user && (
            <>
              <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[200px]">{user.email}</span>
              <Button variant="ghost" size="sm" className="gap-2" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Automated Reporting</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Set it and forget it - receive transformation signals automatically
          </p>
        </div>
        <Badge variant="outline" className="text-base sm:text-lg px-3 py-1.5 sm:px-4 sm:py-2 w-fit">
          <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
          {subscriptions?.filter(s => s.is_active).length || 0} Active
        </Badge>
      </div>

      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Create New Report Subscription
          </CardTitle>
          <CardDescription>
            Get automated email reports with the latest transformation signals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reportName">Report Name (Optional)</Label>
            <Input
              id="reportName"
              placeholder="e.g., Weekly Portfolio Manager Brief"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Reports will be sent to your account email</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="audience">Report Format</Label>
                <Select value={audience} onValueChange={(value) => setAudience(value as "executive" | "analyst" | "technical")}>
                  <SelectTrigger id="audience">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="executive">
                    <div className="space-y-1">
                      <div className="font-medium">Executive</div>
                      <div className="text-xs text-muted-foreground">High-level, concise, business impact</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="analyst">
                    <div className="space-y-1">
                      <div className="font-medium">Analyst</div>
                      <div className="text-xs text-muted-foreground">Detailed metrics and evidence</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="technical">
                    <div className="space-y-1">
                      <div className="font-medium">Technical</div>
                      <div className="text-xs text-muted-foreground">Full data with raw details</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyFilters">Company Filters (Optional)</Label>
            <Input
              id="companyFilters"
              placeholder="e.g., AAPL, Microsoft, City of Austin (comma-separated, 1-5 items)"
              value={companyFilters}
              onChange={(e) => setCompanyFilters(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Filter by tickers, company names, or municipalities (comma-separated)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sourceFilters">Source Filters (Optional)</Label>
            <Select 
              value={sourceFilters.join(',')} 
              onValueChange={(value) => {
                const currentSources = sourceFilters;
                if (currentSources.includes(value)) {
                  setSourceFilters(currentSources.filter(s => s !== value));
                } else if (currentSources.length < 5) {
                  setSourceFilters([...currentSources, value]);
                }
              }}
            >
              <SelectTrigger id="sourceFilters">
                <SelectValue placeholder={sourceFilters.length > 0 ? `${sourceFilters.length} sources selected` : "Select sources (up to 5)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="reddit">Reddit</SelectItem>
                <SelectItem value="hackernews">Hacker News</SelectItem>
                <SelectItem value="glassdoor">Glassdoor</SelectItem>
                <SelectItem value="indeed">Indeed</SelectItem>
                <SelectItem value="prnewswire">PRNewswire</SelectItem>
                <SelectItem value="news_site">News Sites</SelectItem>
                <SelectItem value="company_website">Company Websites</SelectItem>
              </SelectContent>
            </Select>
            {sourceFilters.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {sourceFilters.map((source) => (
                  <Badge 
                    key={source} 
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => setSourceFilters(sourceFilters.filter(s => s !== source))}
                  >
                    {source} ×
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Select up to 5 sources to filter signals
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customUrl">Custom URL Monitoring (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="customUrl"
                placeholder="https://example.com/news"
                value={customUrl}
                onChange={(e) => {
                  setCustomUrl(e.target.value);
                  setUrlError("");
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomUrl();
                  }
                }}
              />
              <Button 
                type="button"
                variant="outline"
                onClick={handleAddCustomUrl}
                disabled={customUrls.length >= 5}
              >
                Add
              </Button>
            </div>
            {urlError && (
              <p className="text-xs text-destructive">{urlError}</p>
            )}
            {customUrls.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {customUrls.map((url, idx) => (
                  <Badge 
                    key={idx} 
                    variant="secondary"
                    className="cursor-pointer max-w-[200px] truncate"
                    onClick={() => setCustomUrls(customUrls.filter((_, i) => i !== idx))}
                  >
                    {url} ×
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Add up to 5 custom URLs to monitor. Note: Sites with anti-scraping protections (LinkedIn, Facebook, etc.) cannot be monitored.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="frequency">Report Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confidence">Min Confidence</Label>
              <Select value={minConfidence} onValueChange={setMinConfidence}>
                <SelectTrigger id="confidence">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.3">30% - All Signals</SelectItem>
                  <SelectItem value="0.5">50% - Medium+</SelectItem>
                  <SelectItem value="0.7">70% - High+</SelectItem>
                  <SelectItem value="0.9">90% - Very High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={() => createSubscription.mutate()}
            disabled={!user || createSubscription.isPending}
            className="w-full"
          >
            {createSubscription.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Create Subscription
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Subscriptions</CardTitle>
          <CardDescription>
            Manage your automated report subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : subscriptions && subscriptions.length > 0 ? (
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Report Delivery</span>
                      <Badge variant={sub.is_active ? "default" : "secondary"}>
                        {sub.is_active ? "Active" : "Paused"}
                      </Badge>
                      {sub.audience && (
                        <Badge variant="outline">
                          {sub.audience.charAt(0).toUpperCase() + sub.audience.slice(1)}
                        </Badge>
                      )}
                    </div>
                    {sub.report_name && (
                      <div className="text-sm font-medium text-primary mb-1">{sub.report_name}</div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      Frequency: <strong>{sub.frequency}</strong> | 
                      Min Confidence: <strong>{(sub.min_confidence_score * 100).toFixed(0)}%</strong>
                      {sub.last_sent_at && (
                        <> | Last Sent: {new Date(sub.last_sent_at).toLocaleDateString()}</>
                      )}
                    </div>
                    {(sub.company_filters || sub.source_filters || sub.custom_monitor_urls) && (
                      <div className="text-xs text-muted-foreground mt-1 space-y-1">
                        {sub.company_filters && sub.company_filters.length > 0 && (
                          <div>Companies: {sub.company_filters.join(', ')}</div>
                        )}
                        {sub.source_filters && sub.source_filters.length > 0 && (
                          <div>Sources: {sub.source_filters.join(', ')}</div>
                        )}
                        {sub.custom_monitor_urls && sub.custom_monitor_urls.length > 0 && (
                          <div>Custom URLs: {sub.custom_monitor_urls.length} monitored</div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={sub.is_active}
                      onCheckedChange={() => toggleSubscription.mutate({ id: sub.id, isActive: sub.is_active })}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendTestReport.mutate(sub)}
                      disabled={sendTestReport.isPending}
                    >
                      {sendTestReport.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Test Report"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteSubscription.mutate(sub.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No subscriptions yet. Create one above to get started!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
