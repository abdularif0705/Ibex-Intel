import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface WalkthroughStep {
  title: string;
  description: string;
  tip?: string;
}

const steps: WalkthroughStep[] = [
  {
    title: "Welcome to the Platform",
    description: "SignalStream helps you detect and analyze corporate transformation signals across multiple data sources. Let's walk through the key features.",
    tip: "You can always access the navigation menu from the header at the top of the page."
  },
  {
    title: "Scanner - Configure Data Sources",
    description: "Use the Scanner to set up automated monitoring of data sources like LinkedIn, company websites, and press releases. Configure what you want to track and how often.",
    tip: "Start with a few key companies you're interested in monitoring."
  },
  {
    title: "Dashboard - View Your Signals",
    description: "The Dashboard displays all detected transformation signals with confidence scores, evidence, and filtering options. Track ERP implementations, CRM adoptions, and more.",
    tip: "Use filters to focus on specific signal types or companies."
  },
  {
    title: "Automation - Set Up Alerts",
    description: "Create automated reports and email alerts for new signals. Choose your frequency, target audience, and customize which signals to include.",
    tip: "Set up daily reports for high-priority coverage areas."
  },
  {
    title: "AI Assistant - Ask Questions",
    description: "Chat with your data using natural language. Ask about trends, specific companies, or get summaries of recent signals.",
    tip: "Try asking 'What ERP transformations were detected this week?'"
  },
  {
    title: "You're Ready to Go!",
    description: "Start by configuring your first data source in the Scanner, or explore the Dashboard to see sample signals. Need help? Check out our documentation in the Resources menu.",
    tip: "Remember: Quality signals come from consistent monitoring and proper configuration."
  }
];

interface WalkthroughTourProps {
  open: boolean;
  onClose: () => void;
}

export const WalkthroughTour = ({ open, onClose }: WalkthroughTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <DialogTitle className="text-xl">
              {currentStepData.title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
        </DialogHeader>
        
        <DialogDescription className="text-base space-y-4 py-4">
          <p className="text-foreground">{currentStepData.description}</p>
          {currentStepData.tip && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <p className="text-sm">
                <span className="font-semibold text-primary">💡 Tip: </span>
                {currentStepData.tip}
              </p>
            </div>
          )}
        </DialogDescription>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1"
          >
            {currentStep === steps.length - 1 ? (
              "Get Started"
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};