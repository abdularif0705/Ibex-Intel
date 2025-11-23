import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FileText, Download, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const LeadMagnet = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // In production, this would send to your backend/CRM
    setSubmitted(true);
    toast({
      title: "Success!",
      description: "Check your inbox for the whitepaper download link",
    });
  };

  return (
    <section className="bg-gradient-to-br from-primary/5 to-accent/5 py-24 px-6">
      <div className="container mx-auto max-w-4xl">
        <Card className="border-primary/20 bg-card/95 backdrop-blur p-8 shadow-premium">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-8 w-8 text-primary" />
            </div>

            <h2 className="mb-4 text-3xl font-bold">
              Free Whitepaper: The Hidden Cost of Technology Transformation Risk
            </h2>
            
            <p className="mb-8 max-w-2xl text-lg text-muted-foreground">
              Download our comprehensive analysis of 50+ transformation failures, estimated portfolio impact, 
              and early signal methodologies used by leading institutional investors
            </p>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="w-full max-w-md">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="Enter your work email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12"
                      required
                    />
                  </div>
                  <Button type="submit" size="lg" className="gap-2">
                    <Download className="h-4 w-4" />
                    Download Now
                  </Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  No spam. Unsubscribe anytime. By submitting, you agree to receive occasional updates.
                </p>
              </form>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-6 py-3 text-primary">
                  <Mail className="h-5 w-5" />
                  <span className="font-semibold">Check your email for the download link!</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Want to get started right away?{" "}
                  <a href="/auth?mode=signup" className="font-semibold text-primary hover:underline">
                    Start your free trial
                  </a>
                </p>
              </div>
            )}

            <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
              <div>
                <div className="font-semibold">50+ Case Studies</div>
                <div className="text-sm text-muted-foreground">From 1995 to 2024</div>
              </div>
              <div>
                <div className="font-semibold">$100B+ in Losses</div>
                <div className="text-sm text-muted-foreground">Documented impact</div>
              </div>
              <div>
                <div className="font-semibold">Signal Methodology</div>
                <div className="text-sm text-muted-foreground">Our OSINT approach</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};
