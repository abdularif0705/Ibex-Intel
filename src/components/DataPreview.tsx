import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";

const sampleData = [
  {
    company: "████████ Corp",
    ticker: "████",
    transformation: "ERP Migration",
    status: "In Progress",
    risk: "High",
    creditImpact: "Watch Negative",
    covenantStatus: "At Risk",
    detected: "Q4 2024",
  },
  {
    company: "████████ Healthcare",
    ticker: "████",
    transformation: "CRM Implementation",
    status: "Troubled",
    risk: "Critical",
    creditImpact: "Under Review",
    covenantStatus: "Breach Risk",
    detected: "Q4 2024",
  },
  {
    company: "████████ Industries",
    ticker: "████",
    transformation: "PLM Implementation",
    status: "Planning Phase",
    risk: "Medium",
    creditImpact: "Stable",
    covenantStatus: "Compliant",
    detected: "Q3 2024",
  },
  {
    company: "████████ Technologies",
    ticker: "████",
    transformation: "Cloud Infrastructure",
    status: "Delayed",
    risk: "Critical",
    creditImpact: "Review",
    covenantStatus: "Breach Risk",
    detected: "Q2 2024",
  },
];

export const DataPreview = () => {
  return (
    <section className="py-24 px-6 bg-gradient-subtle">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Sample Intelligence Report
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Preview of actionable insights for equity and credit portfolio managers. Full access includes company names, detailed timelines, covenant monitoring, and credit impact assessments.
          </p>
        </div>

        {/* Blurred Data Table */}
        <Card className="relative overflow-hidden border-border bg-card">
          {/* Lock Overlay */}
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Members Only</h3>
              <p className="text-sm text-muted-foreground">Create an account to access full reports</p>
            </div>
          </div>

          {/* Sample Data Table */}
          <div className="overflow-x-auto p-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-sm font-semibold text-muted-foreground">Company</th>
                  <th className="pb-3 text-left text-sm font-semibold text-muted-foreground">Ticker</th>
                  <th className="pb-3 text-left text-sm font-semibold text-muted-foreground">Transformation</th>
                  <th className="pb-3 text-left text-sm font-semibold text-muted-foreground">Status</th>
                  <th className="pb-3 text-left text-sm font-semibold text-muted-foreground">Equity Risk</th>
                  <th className="pb-3 text-left text-sm font-semibold text-muted-foreground">Credit Impact</th>
                  <th className="pb-3 text-left text-sm font-semibold text-muted-foreground">Covenant Status</th>
                  <th className="pb-3 text-left text-sm font-semibold text-muted-foreground">First Indicated</th>
                </tr>
              </thead>
              <tbody>
                {sampleData.map((row, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="py-4 text-sm font-medium blur-sm">{row.company}</td>
                    <td className="py-4 text-sm blur-sm">{row.ticker}</td>
                    <td className="py-4 text-sm">{row.transformation}</td>
                    <td className="py-4 text-sm">
                      <Badge variant="secondary">{row.status}</Badge>
                    </td>
                    <td className="py-4 text-sm">
                      <Badge 
                        variant={row.risk === "Critical" ? "destructive" : "secondary"}
                      >
                        {row.risk}
                      </Badge>
                    </td>
                    <td className="py-4 text-sm">
                      <Badge variant="outline">{row.creditImpact}</Badge>
                    </td>
                    <td className="py-4 text-sm">
                      <Badge 
                        variant={row.covenantStatus === "Breach Risk" ? "destructive" : "secondary"}
                      >
                        {row.covenantStatus}
                      </Badge>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">{row.detected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </section>
  );
};
