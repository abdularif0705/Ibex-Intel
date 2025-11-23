import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, Target, Database } from "lucide-react";

const metrics = [
  {
    icon: Target,
    value: "87%",
    label: "Indicator Accuracy",
    description: "Of major transformations where our signals preceded public disclosure",
  },
  {
    icon: Clock,
    value: "63 days",
    label: "Average Lead Time",
    description: "Early signal appearance before earnings impact or market reaction",
  },
  {
    icon: Database,
    value: "12,000+",
    label: "Entities Monitored",
    description: "Public companies, private firms, and government entities",
  },
  {
    icon: TrendingUp,
    value: "240+",
    label: "Transformation Signals",
    description: "Indicators of potential ERP, PLM, and infrastructure changes in 2024",
  },
];

export const TrackRecord = () => {
  return (
    <section className="bg-secondary/30 py-24 px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <Badge variant="secondary" className="mb-4">
            Proven Results
          </Badge>
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Our Track Record
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Proprietary OSINT methodology delivering institutional-grade intelligence signals with measurable early indicators
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <Card
              key={index}
              className="group border-border bg-card p-6 text-center transition-all duration-300 hover:border-primary/50 hover:shadow-premium"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <metric.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="mb-2 text-4xl font-bold text-primary">{metric.value}</div>
              <div className="mb-2 text-sm font-semibold">{metric.label}</div>
              <p className="text-xs text-muted-foreground">{metric.description}</p>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
};
