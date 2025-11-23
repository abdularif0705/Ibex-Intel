import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, Bot, User, Lock, FileText, Menu, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { ChatbotSidebar } from '@/components/ChatbotSidebar';

type Message = { role: 'user' | 'assistant' | 'system'; content: string };

const FREE_TRIAL_LIMIT = 3;
const STORAGE_KEY = 'chatbot_prompt_count';
const CONVERSATION_STORAGE_KEY = 'chatbot_last_conversation';
const CONVERSATION_TIMESTAMP_KEY = 'chatbot_conversation_timestamp';

const Chatbot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [promptCount, setPromptCount] = useState(0);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [reportSignals, setReportSignals] = useState<any[]>([]);
  const [reportAnalysis, setReportAnalysis] = useState<string>('');
  const [showLoadConversation, setShowLoadConversation] = useState(false);
  const [lastConversationTime, setLastConversationTime] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check authentication status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    // Load prompt count from localStorage for non-authenticated users
    if (!isAuthenticated) {
      const stored = localStorage.getItem(STORAGE_KEY);
      setPromptCount(stored ? parseInt(stored, 10) : 0);
    }

    // Check if there's a saved conversation
    const savedConversation = localStorage.getItem(CONVERSATION_STORAGE_KEY);
    const savedTimestamp = localStorage.getItem(CONVERSATION_TIMESTAMP_KEY);
    if (savedConversation && savedTimestamp) {
      setLastConversationTime(savedTimestamp);
      setShowLoadConversation(true);
    }

    // Check for report context from localStorage or navigation state
    const storedContext = localStorage.getItem('activeReportContext');
    const state = location.state as { reportContext?: string; selectedSignalIds?: string[] } | null;
    
    if (storedContext) {
      const context = JSON.parse(storedContext);
      setReportSignals(context.signals || []);
      setReportAnalysis(context.analysis || '');
      
      // Add welcome message + report context as first message (one-time, not repeated)
      if (messages.length === 0) {
        const signalsSummary = (context.signals || [])
          .map((s: any) => `• ${s.company_name}${s.company_ticker ? ` (${s.company_ticker})` : ''}: ${s.signal_type} signal, ${(s.confidence_score * 100).toFixed(0)}% confidence`)
          .join('\n');
        
        setMessages([
          {
            role: 'system',
            content: `[REPORT CONTEXT]\n\nReport Type: ${context.reportLevel === 'portfolio_manager' ? 'Portfolio Manager' : 'Analyst'}\nGenerated: ${new Date(context.generatedAt).toLocaleDateString()}\n\nAnalysis:\n${context.analysis}\n\nSignals:\n${signalsSummary}`
          } as Message,
          {
            role: 'assistant',
            content: `I've loaded your ${context.reportLevel === 'portfolio_manager' ? 'Portfolio Manager' : 'Analyst'} report with ${context.signals?.length || 0} transformation signals.\n\nClick the actionable steps in the sidebar, or ask me anything about these findings!`
          }
        ]);
      }
    } else if (state?.reportContext) {
      // Fallback to navigation state
      setMessages([{
        role: 'assistant',
        content: `I've loaded context from your transformation signals report. Feel free to ask about investment implications, risk factors, or specific recommendations!`
      }]);

      setSuggestedQuestions([
        "What are the key risks for current investors in these companies?",
        "How should I prioritize these signals in my portfolio?",
        "What's the typical timeline for these transformations?",
        "Can you explain the confidence scores in more detail?",
        "What follow-up due diligence would you recommend?"
      ]);
    }

    return () => subscription.unsubscribe();
  }, [isAuthenticated, location.state]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save conversation to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(messages));
      localStorage.setItem(CONVERSATION_TIMESTAMP_KEY, new Date().toISOString());
    }
  }, [messages]);

  const streamChat = async (userMessage: Message) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
    
    try {
      // Send conversation including any system context message (added once at start)
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          toast({
            title: "Rate limit exceeded",
            description: "Please try again later.",
            variant: "destructive",
          });
          return;
        }
        if (resp.status === 402) {
          toast({
            title: "Payment required",
            description: "Please add funds to your workspace.",
            variant: "destructive",
          });
          return;
        }
        throw new Error('Failed to start stream');
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;
      let assistantContent = '';

      // Add empty assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: 'assistant',
                  content: assistantContent,
                };
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: "Failed to get response from AI",
        variant: "destructive",
      });
      // Remove the empty assistant message
      setMessages(prev => prev.slice(0, -1));
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Check if non-authenticated user has exceeded limit
    if (!isAuthenticated && promptCount >= FREE_TRIAL_LIMIT) {
      toast({
        title: "Free trial limit reached",
        description: "Sign up to continue using the AI assistant",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Increment prompt count for non-authenticated users
    if (!isAuthenticated) {
      const newCount = promptCount + 1;
      setPromptCount(newCount);
      localStorage.setItem(STORAGE_KEY, newCount.toString());
    }

    await streamChat(userMessage);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuestionClick = (question: string) => {
    setInput(question);
    setSuggestedQuestions([]);
  };

  const loadLastConversation = () => {
    const savedConversation = localStorage.getItem(CONVERSATION_STORAGE_KEY);
    if (savedConversation) {
      try {
        const parsed = JSON.parse(savedConversation);
        setMessages(parsed);
        setShowLoadConversation(false);
        toast({
          title: "Conversation Loaded",
          description: "Your previous conversation has been restored",
        });
      } catch (error) {
        console.error('Error loading conversation:', error);
        toast({
          title: "Error",
          description: "Failed to load previous conversation",
          variant: "destructive",
        });
      }
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setShowLoadConversation(false);
    localStorage.removeItem(CONVERSATION_STORAGE_KEY);
    localStorage.removeItem(CONVERSATION_TIMESTAMP_KEY);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const remainingPrompts = isAuthenticated ? null : Math.max(0, FREE_TRIAL_LIMIT - promptCount);
  const isLimitReached = !isAuthenticated && promptCount >= FREE_TRIAL_LIMIT;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      {sidebarOpen && (
        <ChatbotSidebar 
          signals={reportSignals}
          analysis={reportAnalysis}
          onQuestionClick={handleQuestionClick}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="border-b bg-background p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">AI Assistant</h1>
                <Badge variant="secondary" className="text-xs gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Internet Access
                </Badge>
              </div>
              {reportSignals.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  📊 {reportSignals.length} signals loaded • Real-time web search enabled
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={startNewConversation}
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">New Chat</span>
              </Button>
            )}
            {!isAuthenticated && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Free Trial</p>
                <p className="text-sm font-semibold">
                  {remainingPrompts} prompt{remainingPrompts !== 1 ? 's' : ''} left
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <Card className="h-full flex flex-col m-4">
            {/* Load Last Conversation Banner */}
            {showLoadConversation && messages.length === 0 && (
              <div className="border-b bg-muted/50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Continue where you left off?</p>
                    <p className="text-xs text-muted-foreground">
                      Last active {lastConversationTime && formatTimestamp(lastConversationTime)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startNewConversation}
                    >
                      Start Fresh
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={loadLastConversation}
                    >
                      Load Conversation
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLimitReached ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md">
                    <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">Free Trial Limit Reached</h3>
                    <p className="text-muted-foreground mb-6">
                      You've used all {FREE_TRIAL_LIMIT} free prompts. Sign up to continue using the AI assistant with unlimited access.
                    </p>
                    <Button onClick={() => navigate('/auth')} size="lg">
                      Sign Up Now
                    </Button>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-2">Start a conversation with the AI assistant</p>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <span className="text-primary font-medium">Real-time internet search enabled</span>
                    </div>
                    {reportSignals.length > 0 && (
                      <p className="text-sm mt-2 text-primary">
                        💡 Click on actionable steps in the sidebar to begin
                      </p>
                    )}
                    {!isAuthenticated && (
                      <p className="text-sm mt-2">
                        {remainingPrompts} free prompt{remainingPrompts !== 1 ? 's' : ''} available
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {messages.filter(m => m.role !== 'system').map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Suggested Questions */}
                  {suggestedQuestions.length > 0 && messages.length > 0 && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">
                          Suggested follow-up questions:
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {suggestedQuestions.map((question, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary/10 transition-colors"
                            onClick={() => {
                              setInput(question);
                              setSuggestedQuestions([]);
                            }}
                          >
                            {question}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-4">
              {isLimitReached ? (
                <div className="text-center py-4">
                  <Button onClick={() => navigate('/auth')} size="lg" className="w-full">
                    Sign Up to Continue
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask me anything..."
                      className="min-h-[60px] resize-none"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      size="icon"
                      className="h-[60px] w-[60px]"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                      Press Enter to send, Shift+Enter for new line
                    </p>
                    {!isAuthenticated && remainingPrompts !== null && (
                      <p className="text-xs text-muted-foreground">
                        {remainingPrompts} free prompt{remainingPrompts !== 1 ? 's' : ''} left
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
