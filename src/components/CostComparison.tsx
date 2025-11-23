import { Card } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const comparisons = [
  {
    option: "Dedicated Research Analyst",
    cost: "$150,000+",
    period: "per year",
    features: [
      { text: "Limited coverage (1-2 sectors)", available: true },
      { text: "40-hour work week constraints", available: true },
      { text: "Manual research prone to oversight", available: true },
      { text: "24/7 monitoring", available: false },
      { text: "Instant alerts", available: false },
      { text: "Global entity coverage", available: false },
    ],
  },
  {
    option: "Traditional Alt Data Provider",
    cost: "$50,000+",
    period: "per year",
    features: [
      { text: "Generic alternative data feeds", available: true },
      { text: "Limited transformation focus", available: true },
      { text: "Delayed reporting", available: true },
      { text: "ERP-specific intelligence", available: false },
      { text: "Credit & covenant monitoring", available: false },
      { text: "Custom weekly reports", available: false },
    ],
  },
  {
    option: "Our Platform",
    cost: "$59,940",
    period: "per year",
    features: [
      { text: "Comprehensive transformation signal tracking", available: true },
      { text: "Real-time alerts & monitoring", available: true },
      { text: "Equity + credit perspectives", available: true },
      { text: "12,000+ entities covered", available: true },
      { text: "API integration", available: true },
      { text: "Custom reporting options", available: true },
      { text: "6 transferrable licenses", available: true },
    ],
    highlighted: true,
  },
];

export const CostComparison = () => {
  return (
    <section className="py-24 px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <Badge variant="outline" className="mb-4">
            Value Comparison
          </Badge>
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Institutional Intelligence at a Fraction of the Cost
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Get more coverage and faster insights than traditional research approaches
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {comparisons.map((item, index) => (
            <Card
              key={index}
              className={`p-6 transition-all duration-300 ${
                item.highlighted
                  ? "border-primary bg-gradient-to-br from-card to-secondary shadow-premium"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              {item.highlighted && (
                <div className="mb-4 text-center">
                  <Badge className="bg-primary text-primary-foreground">Best Value</Badge>
                </div>
              )}

              <h3 className="mb-2 text-xl font-bold">{item.option}</h3>
              
              <div className="mb-6">
                <div className="text-3xl font-bold text-primary">{item.cost}</div>
                <div className="text-sm text-muted-foreground">{item.period}</div>
              </div>

              <ul className="space-y-3">
                {item.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        feature.available
                          ? "bg-primary/10"
                          : "bg-muted"
                      }`}
                    >
                      {feature.available ? (
                        <Check className="h-3 w-3 text-primary" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        feature.available ? "" : "text-muted-foreground line-through"
                      }`}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        {/* Bottom Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">Platform Compatibility:</span> Integrates with Bloomberg Terminal, 
            FactSet, Capital IQ, and custom risk systems via API
          </p>
        </div>
      </div>
    </section>
  );
};
