import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket, BookOpen, X } from "lucide-react";

interface WelcomeDialogProps {
  onStartTour?: () => void;
}

export const WelcomeDialog = ({ onStartTour }: WelcomeDialogProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome dialog
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      // Small delay to let the page load first
      setTimeout(() => setOpen(true), 500);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("hasSeenWelcome", "true");
    setOpen(false);
  };

  const handleStartTour = () => {
    localStorage.setItem("hasSeenWelcome", "true");
    setOpen(false);
    onStartTour?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Rocket className="h-6 w-6 text-primary" />
              Welcome to SignalStream!
            </DialogTitle>
          </div>
          <DialogDescription className="text-base pt-4 space-y-4">
            <p>
              You're all set! Here's what you can do with SignalStream:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span><strong>Scanner:</strong> Configure data sources and monitor transformation signals</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span><strong>Dashboard:</strong> View and analyze detected signals in real-time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span><strong>Automation:</strong> Set up automated reports and alerts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span><strong>AI Assistant:</strong> Chat with your data using natural language</span>
              </li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4 mr-2" />
            Got It
          </Button>
          <Button
            className="flex-1"
            onClick={handleStartTour}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Take a Quick Tour
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};