import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { useToast } from "./ui/use-toast";
import { Loader2, Search, Sparkles, TrendingUp, History, ExternalLink, Globe, BrainCircuit, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

export const GrokSearchDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [companyName, setCompanyName] = useState("");
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showAllSources, setShowAllSources] = useState(false);
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID and check for active searches on mount
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        // Check for any running tasks
        const { data: runningTasks } = await supabase
          .from('grok_search_results')
          .select('id, created_at, company_name')
          .eq('user_id', user.id)
          .eq('status', 'running')
          .order('created_at', { ascending: false })
          .limit(1);

        if (runningTasks && runningTasks.length > 0) {
          console.log("Found active search:", runningTasks);
          setCurrentSearchId(runningTasks[0].id);
          setCompanyName(runningTasks[0].company_name);
          setLoadingStep("Resuming AI scan...");
          setLoadingProgress(45); // Resume at middle
        }
      }
    };
    init();
  }, []);

  // Fetch search history
  const { data: history, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['grok_search_history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grok_search_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('grok-search', {
        body: { companyName: name },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setCurrentSearchId(data.id);
        setLoadingStep("Initializing AI scan...");
        setLoadingProgress(5);
        toast({
          title: "Scan Started",
          description: data.message || "AI analysis is running in the background.",
        });
        setCompanyName("");
      } else {
        toast({
          title: "Analysis Failed",
          description: data.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to perform AI search",
        variant: "destructive",
      });
    },
  });

  // Real-time subscription for async updates (User Level)
  useEffect(() => {
    if (!userId) return;

    console.log("Subscribing to updates for user:", userId);
    const channel = supabase
      .channel(`grok-user-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'grok_search_results',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newStatus = payload.new.status;
          const updatedId = payload.new.id;

          // Only react if it matches our current tracked search OR if we want to auto-switch
          // For now, let's just track the one we are watching, or any if we are idle
          if (currentSearchId && updatedId !== currentSearchId) return;

          if (newStatus === 'completed') {
            // Fetch full result to ensure we have all fields (payload might be partial)
            supabase
              .from('grok_search_results')
              .select('*')
              .eq('id', updatedId)
              .single()
              .then(({ data, error }) => {
                if (!error && data) {
                  setCurrentResult({
                    companyName: data.company_name,
                    phase: data.phase,
                    signalType: data.signal_type,
                    confidence: data.confidence,
                    shareImpact: data.share_impact,
                    pastImpacts: data.past_impacts,
                    futureImpacts: data.future_impacts,
                    summary: data.summary,
                    evidence: data.evidence,
                    sources: data.sources,
                    allSources: data.all_sources
                  });
                  // setCurrentResult(data);
                  setLoadingProgress(100);
                  setCurrentSearchId(null);
                  toast({
                    title: "Analysis Complete",
                    description: `Strategic insights for ${data.company_name} are ready.`,
                  });
                }
              });
          } else if (newStatus === 'failed') {
            setLoadingProgress(0);
            setCurrentSearchId(null);
            toast({
              title: "Analysis Failed",
              description: payload.new.summary || "An error occurred during analysis.",
              variant: "destructive",
            });
          }

          queryClient.invalidateQueries({ queryKey: ['grok_search_history'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, currentSearchId, queryClient, toast]);

  // Simulate loading steps (visual only, real status comes from DB)
  useEffect(() => {
    if (!currentSearchId) {
      if (!searchMutation.isPending) {
        // Only reset if we are truly done (no active search ID)
        // We keep the progress bar full if we just finished
      }
      return;
    }

    const steps = [
      { msg: "Searching live web sources...", progress: 15 },
      { msg: "Analyzing job postings & RFPs...", progress: 45 },
      { msg: "Cross-referencing financial data...", progress: 70 },
      { msg: "Generating strategic insights...", progress: 90 }
    ];

    let currentStepIndex = 0;

    const interval = setInterval(() => {
      if (currentStepIndex < steps.length) {
        setLoadingStep(steps[currentStepIndex].msg);
        setLoadingProgress(steps[currentStepIndex].progress);
        currentStepIndex++;
      } else {
        // Stay at 90% until real completion
        clearInterval(interval);
      }
    }, 60000); // Slower updates for long running task

    return () => clearInterval(interval);
  }, [currentSearchId, searchMutation.isPending]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    searchMutation.mutate(companyName);
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const parseImpact = (impactStr: string) => {
    const parts = impactStr.split('|');
    const text = parts[0].trim();
    const probability = parts.length > 1 ? parts[1].trim() : null;
    return { text, probability };
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">AI Strategic Search</h2>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Enter company name (e.g. Nike, Tesla)..."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={searchMutation.isPending || !!currentSearchId}
              className="flex-1"
            />
            <Button type="submit" disabled={searchMutation.isPending || !!currentSearchId || !companyName.trim()}>
              {searchMutation.isPending || currentSearchId ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </div>

          {(searchMutation.isPending || currentSearchId) && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  {loadingStep.includes("Searching") && <Globe className="w-3 h-3 animate-pulse" />}
                  {loadingStep.includes("Analyzing") && <FileText className="w-3 h-3 animate-pulse" />}
                  {loadingStep.includes("Generating") && <BrainCircuit className="w-3 h-3 animate-pulse" />}
                  {loadingStep}
                </span>
                <span>{loadingProgress}%</span>
              </div>
              <Progress value={loadingProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center pt-2">
                This deep scan may take up to 3-5 minutes. You can leave this page; results will appear in history.
              </p>
            </div>
          )}
        </form>
      </Card>

      {/* Current Result */}
      {currentResult && (
        <Card className="p-6 border-primary/20 bg-primary/5 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold">{currentResult.companyName}</h3>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-sm px-3 py-1">{currentResult.signalType}</Badge>
                <Badge variant="secondary" className="text-sm px-3 py-1">{currentResult.phase}</Badge>
              </div>
            </div>
            <Badge className={`${getConfidenceColor(currentResult.confidence)} text-sm px-3 py-1`}>
              {currentResult.confidence}% Confidence
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2 text-lg text-emerald-600">
                  <TrendingUp className="w-5 h-5" /> Future Strategic Forecasts
                </h4>
                <div className="bg-background p-4 rounded-lg border shadow-sm space-y-3">
                  {currentResult.futureImpacts && currentResult.futureImpacts.length > 0 ? (
                    <ul className="space-y-3">
                      {currentResult.futureImpacts.map((impact: string, i: number) => {
                        const { text, probability } = parseImpact(impact);
                        return (
                          <li key={i} className="flex items-start justify-between gap-4 text-sm border-b border-dashed pb-2 last:border-0 last:pb-0">
                            <span className="font-medium text-slate-400">{text}</span>
                            {probability && (
                              <Badge variant="outline" className="shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                                {probability}
                              </Badge>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No future forecasts available.</p>
                  )}
                </div>

                <h4 className="font-semibold flex items-center gap-2 mb-2 text-lg text-amber-600 mt-5">
                  <History className="w-5 h-5" /> Past Financial Impacts
                </h4>
                <div className="bg-background p-4 rounded-lg border shadow-sm space-y-3 mb-6">
                  {currentResult.pastImpacts && currentResult.pastImpacts.length > 0 ? (
                    <ul className="space-y-3">
                      {currentResult.pastImpacts.map((impact: string, i: number) => {
                        const { text, probability } = parseImpact(impact);
                        return (
                          <li key={i} className="flex items-start justify-between gap-4 text-sm border-b border-dashed pb-2 last:border-0 last:pb-0">
                            <span className="font-medium text-slate-400">{text}</span>
                            {/* {probability && (
                              <Badge variant="outline" className="shrink-0 bg-slate-100 text-slate-600 text-xs">
                                {probability}
                              </Badge>
                            )} */}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No historical impact data available.</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-lg">Executive Summary</h4>
                <div className="bg-background p-4 rounded-lg border shadow-sm">
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {currentResult.summary}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 text-lg">Key Evidence</h4>
                <ul className="space-y-2">
                  {currentResult.evidence?.map((item: string, i: number) => (
                    <li key={i} className="text-sm text-slate-400 flex gap-2">
                      <span className="text-primary mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {currentResult.sources && currentResult.sources.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-lg">Verified Sources</h4>
                  <div className="grid gap-2">
                    {currentResult.sources.map((source: any, i: number) => (
                      <a
                        key={i}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm p-2 rounded hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                      >
                        <ExternalLink className="w-3 h-3 text-blue-500" />
                        <span className="text-blue-600 truncate">{source.title || source.url}</span>
                      </a>
                    ))}
                  </div>

                  {/* All Sources Expander */}
                  {currentResult.allSources && currentResult.allSources.length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-400">
                          Total Sources Researched: {currentResult.allSources.length}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAllSources(!showAllSources)}
                          className="text-xs"
                        >
                          {showAllSources ? "Hide" : "View All"}
                        </Button>
                      </div>

                      {showAllSources && (
                        <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 max-h-60 overflow-y-auto pr-2">
                          {currentResult.allSources.map((source: any, i: number) => (
                            <a
                              key={`all-${i}`}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs p-2 rounded hover:bg-slate-50 transition-colors text-slate-500 hover:text-blue-600"
                            >
                              <Globe className="w-3 h-3 shrink-0" />
                              <span className="truncate">{source.title || source.url}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* History Table */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Recent Analysis</h3>
        </div>

        {isLoadingHistory ? (
          <div className="flex justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.company_name}</TableCell>
                  <TableCell>{item.phase}</TableCell>
                  <TableCell>{item.signal_type}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getConfidenceColor(item.confidence)}>
                      {item.confidence}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(item.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {
                      item.status === "running" && ("Still Scanning")
                    }
                    {
                      item.status === "failed" && ("Failed")
                    }
                    {
                      item.status === "completed" &&

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCurrentResult({
                            companyName: item.company_name,
                            phase: item.phase,
                            signalType: item.signal_type,
                            confidence: item.confidence,
                            shareImpact: item.share_impact,
                            pastImpacts: item.past_impacts,
                            futureImpacts: item.future_impacts,
                            summary: item.summary,
                            evidence: item.evidence,
                            sources: item.sources,
                            allSources: item.all_sources
                          });
                          setShowAllSources(false);
                        }}
                      >
                        View
                      </Button>}
                  </TableCell>
                </TableRow>
              ))}
              {(!history || history.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No recent searches found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};
