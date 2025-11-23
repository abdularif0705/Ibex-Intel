import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, MessageSquare, FileDown } from "lucide-react";
import { Link } from "react-router-dom";
import mountainHeroBg from "@/assets/mountain-hero-bg.jpg";
import { generateDemoReport } from "@/utils/demo-report-generator";
import { toast } from "sonner";
export const Hero = () => {
  return <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0" style={{
      backgroundImage: `url(${mountainHeroBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background/90" />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 sm:px-6 text-center">
        <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight px-4 sm:px-0">
            Monitor Indicators of Enterprise
            <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Technology Transformations
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto max-w-2xl text-base sm:text-lg md:text-xl text-muted-foreground px-4 sm:px-0">Over 70% of enterprise technology transformations fail, go significantly over budget, or cause operational disruption—impacting equity valuations and credit ratings. Our proprietary indicators surface early signals of ERP, CRM, PLM, and infrastructure changes at publicly-traded companies and private entities, enabling you to identify both transformation risks and successful implementation opportunities before market impact.</p>

          {/* CTAs */}
          <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 sm:flex-row px-4 sm:px-0">
            <Button size="lg" variant="premium" asChild className="w-full sm:w-auto">
              <Link to="/auth?mode=signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full sm:w-auto"
              onClick={() => {
                try {
                  generateDemoReport();
                  toast.success("Demo report downloaded successfully!");
                } catch (error) {
                  console.error("Failed to generate demo report:", error);
                  toast.error("Failed to generate demo report. Please try again.");
                }
              }}
            >
              <FileDown className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Download Demo Report
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link to="/chatbot">
                <MessageSquare className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Try AI Assistant
              </Link>
            </Button>
          </div>

          {/* Trust Indicator */}
          <p className="text-xs sm:text-sm text-muted-foreground px-4 sm:px-0">
            Trusted by leading equity and credit portfolio managers at hedge funds and asset managers
          </p>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>;
};