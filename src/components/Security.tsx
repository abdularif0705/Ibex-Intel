import { Shield, Lock, Database, CheckCircle2, Cloud } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Security = () => {
  const securityMeasures = [
    {
      title: "Data Encryption",
      items: [
        "AES-256 encryption at rest",
        "TLS 1.3 encryption in transit",
        "Encrypted database connections",
        "Secure password hashing",
      ],
      icon: Lock,
    },
    {
      title: "Cloud Infrastructure",
      items: [
        "Hosted on enterprise cloud infrastructure",
        "Automated security patches",
        "Regular data backups",
        "Geographic redundancy",
      ],
      icon: Cloud,
    },
    {
      title: "Access Control",
      items: [
        "Email/password authentication",
        "Google OAuth integration",
        "Row-level security policies",
        "Secure session management",
      ],
      icon: Shield,
    },
    {
      title: "Data Protection",
      items: [
        "User-scoped data access",
        "Automated backups",
        "Point-in-time recovery",
        "Data isolation per user",
      ],
      icon: Database,
    },
  ];

  const securityPractices = [
    "Regular security audits and updates",
    "Secure development practices",
    "Input validation and sanitization",
    "Protected API endpoints with authentication",
    "Rate limiting on sensitive operations",
    "Comprehensive error handling",
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-background via-secondary/5 to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <Badge className="mb-4" variant="outline">
            <Shield className="w-3 h-3 mr-1" />
            Security & Privacy
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Your Data Security Matters
          </h2>
          <p className="text-lg text-muted-foreground">
            We implement industry-standard security practices to protect your information
            and maintain the privacy of your data.
          </p>
        </div>

        {/* Security Measures */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {securityMeasures.map((measure) => (
            <Card key={measure.title} className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <measure.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-3">{measure.title}</h3>
                    <ul className="space-y-2">
                      {measure.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Security Practices */}
        <Card className="bg-secondary/20 border-2">
          <CardContent className="p-8">
            <h3 className="text-2xl font-semibold mb-6 text-center">Security Best Practices</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {securityPractices.map((practice) => (
                <div key={practice} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{practice}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trust Statement */}
        <div className="text-center mt-12 max-w-2xl mx-auto">
          <p className="text-muted-foreground">
            We're committed to maintaining the security and privacy of your data through
            continuous improvement of our security practices and staying current with industry standards.
          </p>
        </div>
      </div>
    </section>
  );
};
