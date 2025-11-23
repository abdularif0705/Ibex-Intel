import { useState } from 'react';
import { AutomationDashboard } from '@/components/AutomationDashboard';
import { WelcomeDialog } from '@/components/WelcomeDialog';
import { WalkthroughTour } from '@/components/WalkthroughTour';

const Automation = () => {
  const [showTour, setShowTour] = useState(false);

  return (
    <>
      <AutomationDashboard />
      <WelcomeDialog onStartTour={() => setShowTour(true)} />
      <WalkthroughTour open={showTour} onClose={() => setShowTour(false)} />
    </>
  );
};

export default Automation;
