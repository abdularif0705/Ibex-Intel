import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, TrendingUp, Building2, DollarSign, ChevronRight } from 'lucide-react';

// TODO: Consider expanding functionality for credit risk/rating analysts
// They may benefit from specialized signal filtering and confidence scoring adjustments
// based on credit-relevant transformation signals (e.g., ERP, financial system upgrades)
const professionalRoles = [
  { 
    id: 'investment', 
    label: 'Investment Professional', 
    icon: TrendingUp,
    requiresDetails: true 
  },
  { 
    id: 'credit_rating', 
    label: 'Credit Rating Professional', 
    icon: Briefcase,
    requiresDetails: false 
  },
  { 
    id: 'investment_banking', 
    label: 'Investment Banking Professional', 
    icon: Building2,
    requiresDetails: false 
  },
  { 
    id: 'private_equity', 
    label: 'Private Equity Investment Professional', 
    icon: DollarSign,
    requiresDetails: false 
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState('');
  const [assetClass, setAssetClass] = useState('');
  const [marketSegment, setMarketSegment] = useState('');
  const [coverageGroup, setCoverageGroup] = useState('');

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data } = await supabase
        .from('user_preferences')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.onboarding_completed) {
        navigate('/');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    const role = professionalRoles.find(r => r.id === roleId);
    if (role?.requiresDetails) {
      setStep(2);
    } else {
      handleComplete(roleId);
    }
  };

  const handleComplete = async (roleId?: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No user found');
      }

      const finalRole = roleId || selectedRole;
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          professional_role: finalRole,
          asset_class: assetClass || null,
          market_segment: marketSegment || null,
          coverage_group: coverageGroup || null,
          onboarding_completed: true,
        });

      if (error) throw error;

      toast({
        title: 'Welcome!',
        description: 'Your preferences have been saved.',
      });

      navigate('/');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save preferences. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
          <CardHeader className="text-center px-4 sm:px-6">
            <CardTitle className="text-2xl sm:text-3xl font-bold">Welcome to Transformation Signals</CardTitle>
            <CardDescription className="text-base sm:text-lg mt-2">
              Let's personalize your experience. What best describes your role?
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
              {professionalRoles.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleRoleSelect(role.id)}
                    disabled={loading}
                    className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-all duration-200 p-4 sm:p-6 text-left bg-card hover:bg-accent/5"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-base sm:text-lg mb-1">{role.label}</h3>
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary transition-colors absolute right-3 sm:right-4 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl">Tell us more about your coverage</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            This helps us tailor the signals and insights to your specific area of focus.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
          <div className="space-y-2">
            <Label htmlFor="assetClass" className="text-sm sm:text-base">Asset Class (Optional)</Label>
            <Input
              id="assetClass"
              placeholder="e.g., Equities, Fixed Income, Alternatives"
              value={assetClass}
              onChange={(e) => setAssetClass(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="marketSegment" className="text-sm sm:text-base">Market Segment (Optional)</Label>
            <Input
              id="marketSegment"
              placeholder="e.g., Large Cap, Mid Cap, Small Cap"
              value={marketSegment}
              onChange={(e) => setMarketSegment(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverageGroup" className="text-sm sm:text-base">Coverage Group (Optional)</Label>
            <Input
              id="coverageGroup"
              placeholder="e.g., Industrials Group, Technology, Healthcare"
              value={coverageGroup}
              onChange={(e) => setCoverageGroup(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              disabled={loading}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={() => handleComplete()}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Saving...' : 'Complete Setup'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
