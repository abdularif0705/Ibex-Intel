import { useState } from 'react';
import { SignalsDashboard } from '@/components/SignalsDashboard';
import { WelcomeDialog } from '@/components/WelcomeDialog';
import { WalkthroughTour } from '@/components/WalkthroughTour';

const Dashboard = () => {
  const [showTour, setShowTour] = useState(false);

  return (
    <>
      <SignalsDashboard />
      <WelcomeDialog onStartTour={() => setShowTour(true)} />
      <WalkthroughTour open={showTour} onClose={() => setShowTour(false)} />
    </>
  );
};

export default Dashboard;
