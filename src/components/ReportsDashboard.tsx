import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar, FileText, Mail, Trash2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ReportSubscription {
  id: string;
  report_name: string;
  frequency: string;
  is_active: boolean;
  audience: string;
  last_sent_at: string | null;
  created_at: string;
}

export const ReportsDashboard = () => {
  const [subscriptions, setSubscriptions] = useState<ReportSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newReport, setNewReport] = useState({
    report_name: 'Transformation Signals Report',
    frequency: 'weekly',
    email: '',
    audience: 'analyst' as 'analyst' | 'executive' | 'technical',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .rpc('get_user_subscriptions');

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load report subscriptions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!newReport.email) {
        toast({
          title: 'Error',
          description: 'Email address is required',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('report_subscriptions')
        .insert([{
          user_id: user.id,
          report_name: newReport.report_name,
          frequency: newReport.frequency,
          email: newReport.email,
          audience: newReport.audience,
          is_active: true,
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Recurring report created successfully',
      });

      setDialogOpen(false);
      setNewReport({
        report_name: 'Transformation Signals Report',
        frequency: 'weekly',
        email: '',
        audience: 'analyst' as 'analyst' | 'executive' | 'technical',
      });
      fetchSubscriptions();
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to create recurring report',
        variant: 'destructive',
      });
    }
  };

  const toggleSubscription = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('report_subscriptions')
        .update({ is_active: !currentState })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Report ${!currentState ? 'activated' : 'paused'}`,
      });

      fetchSubscriptions();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to update subscription',
        variant: 'destructive',
      });
    }
  };

  const deleteSubscription = async (id: string) => {
    try {
      const { error } = await supabase
        .from('report_subscriptions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Report subscription deleted',
      });

      fetchSubscriptions();
    } catch (error) {
      console.error('Error deleting subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete subscription',
        variant: 'destructive',
      });
    }
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      default: return freq;
    }
  };

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'analyst': return 'Analyst Report (Detailed)';
      case 'executive': return 'Executive Report (Strategic)';
      case 'technical': return 'Technical Report';
      default: return audience;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recurring Reports</h1>
          <p className="text-muted-foreground">
            Manage automated report delivery schedules
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Recurring Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Recurring Report</DialogTitle>
              <DialogDescription>
                Set up automated report delivery with your preferred frequency and format
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Report Name</Label>
                <Input
                  value={newReport.report_name}
                  onChange={(e) => setNewReport({ ...newReport, report_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={newReport.email}
                  onChange={(e) => setNewReport({ ...newReport, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={newReport.frequency} onValueChange={(val) => setNewReport({ ...newReport, frequency: val })}>
                  <SelectTrigger>
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
                <Label>Report Type</Label>
                <Select value={newReport.audience} onValueChange={(val) => setNewReport({ ...newReport, audience: val as 'analyst' | 'executive' | 'technical' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="analyst">Analyst Report (Detailed)</SelectItem>
                    <SelectItem value="executive">Executive Report (Strategic)</SelectItem>
                    <SelectItem value="technical">Technical Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={createSubscription}>Create Report</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading subscriptions...</p>
          </CardContent>
        </Card>
      ) : subscriptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <FileText className="w-12 h-12 text-muted-foreground" />
            <p className="text-muted-foreground">No recurring reports set up yet</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {subscriptions.map((sub) => (
            <Card key={sub.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {sub.report_name}
                      {sub.is_active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Paused</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {getFrequencyLabel(sub.frequency)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        Email delivery configured
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={sub.is_active}
                      onCheckedChange={() => toggleSubscription(sub.id, sub.is_active)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSubscription(sub.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Report Type:</span>
                    <Badge variant="outline">{getAudienceLabel(sub.audience)}</Badge>
                  </div>
                  {sub.last_sent_at && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Sent:</span>
                      <span>{new Date(sub.last_sent_at).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(sub.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
