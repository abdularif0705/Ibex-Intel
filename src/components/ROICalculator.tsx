import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calculator, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

export const ROICalculator = () => {
  const [aum, setAum] = useState("");
  const [showResults, setShowResults] = useState(false);

  const calculateROI = () => {
    if (aum && parseFloat(aum) > 0) {
      setShowResults(true);
    }
  };

  const aumValue = parseFloat(aum) || 0;
  const avgPositionSize = aumValue * 0.02; // 2% position
  const potentialLoss = avgPositionSize * 0.35; // 35% drop (Lamb Weston scenario)
  const annualCost = 4995 * 12; // Monthly subscription
  const roiMultiple = (potentialLoss / annualCost).toFixed(1);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" variant="premium" className="gap-2">
          <Calculator className="h-5 w-5" />
          Calculate Your ROI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            ROI Calculator
          </DialogTitle>
          <DialogDescription>
            See potential value from early transformation risk signals
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="aum">Assets Under Management ($ Millions)</Label>
            <Input
              id="aum"
              type="number"
              placeholder="e.g., 2000"
              value={aum}
              onChange={(e) => setAum(e.target.value)}
              min="0"
            />
          </div>

          <Button onClick={calculateROI} className="w-full" disabled={!aum}>
            Calculate Potential Savings
          </Button>

          {showResults && aumValue > 0 && (
            <Card className="border-primary/20 bg-gradient-to-br from-card to-secondary p-4">
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Average Position Size (2% of AUM)</div>
                  <div className="text-2xl font-bold text-primary">
                    ${avgPositionSize.toFixed(1)}M
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Potential Loss from One Event (35% drop)
                  </div>
                  <div className="text-2xl font-bold text-destructive">
                    ${potentialLoss.toFixed(1)}M
                  </div>
                </div>
                <div className="border-t pt-3">
                  <div className="text-sm text-muted-foreground">Annual Subscription Cost</div>
                  <div className="text-xl font-bold">${annualCost.toLocaleString()}</div>
                </div>
                <div className="rounded-lg bg-primary/10 p-3">
                  <div className="text-xs text-muted-foreground">ROI Multiple</div>
                  <div className="text-3xl font-bold text-primary">{roiMultiple}x</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Early warning signals on one Lamb Weston-style event could provide {roiMultiple}x value
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
