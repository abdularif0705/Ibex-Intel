import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Professional",
    price: "4,995",
    period: "month",
    description: "Essential intelligence for active portfolio managers",
    features: [
      "Unlimited entity signal tracking (ERP, CRM, PLM)",
      "ERP, CRM & infrastructure risk signal alerts",
      "Equity & credit risk assessments",
      "Historical data access",
      "API access for integration",
      "Email support",
    ],
    highlighted: false,
  },
  {
    name: "Enterprise",
    price: "9,995",
    period: "month",
    description: "Advanced features with customized reporting",
    features: [
      "Everything in Professional",
      "Weekly custom reports by ticker",
      "Weekly reports by entity (private companies)",
      "Government & municipal bond mapping",
      "Sector-specific transformation signal tracking",
      "Priority alert customization",
      "Dedicated account manager",
      "Phone & priority email support",
      "Quarterly strategy calls",
    ],
    highlighted: true,
  },
  {
    name: "Institutional",
    price: "Custom",
    period: "",
    description: "Tailored solutions for large portfolios",
    features: [
      "Everything in Enterprise",
      "Daily custom reports by any criteria",
      "Bespoke geographic region tracking",
      "Custom covenant monitoring alerts",
      "White-label reporting options",
      "Direct data feeds & custom APIs",
      "Dedicated research analyst support",
      "On-demand custom research requests",
      "Integration with internal risk systems",
      "SLA guarantees",
    ],
    highlighted: false,
  },
];

export const Pricing = () => {
  return (
    <section className="py-24 px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Transparent Pricing
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Institutional-grade alternative data for equity and credit analysis at a fraction of traditional research costs.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative overflow-hidden p-8 transition-all duration-300 ${
                plan.highlighted
                  ? "border-primary bg-gradient-to-br from-card to-secondary shadow-premium"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  BEST VALUE
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                <h3 className="mb-2 text-2xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline">
                  {plan.price === "Custom" ? (
                    <span className="text-4xl font-bold">{plan.price}</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="ml-2 text-muted-foreground">/{plan.period}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="mb-8 space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                className="w-full"
                variant={plan.highlighted ? "premium" : "outline"}
                size="lg"
                asChild
              >
                {plan.price === "Custom" ? (
                  <a href="mailto:enterprise@altdata.com">Contact Sales</a>
                ) : (
                  <Link to="/auth?mode=signup">Get Started</Link>
                )}
              </Button>
            </Card>
          ))}
        </div>

        {/* Enterprise Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Need custom data or enterprise solutions?{" "}
            <a href="mailto:enterprise@altdata.com" className="text-primary hover:underline">
              Contact our team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};
