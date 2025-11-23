import { Database, Shield, Zap } from "lucide-react";
import { ROICalculator } from "@/components/ROICalculator";

const footerLinks = {
  product: [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "Case Studies", href: "#case-studies" },
    { name: "Coverage Map", href: "#coverage" },
  ],
  resources: [
    { name: "Blog & Insights", href: "/blog" },
    { name: "Whitepaper", href: "#whitepaper" },
    { name: "Methodology", href: "#methodology" },
    { name: "API Documentation", href: "/docs" },
    { name: "Integrations", href: "#integrations" },
    { name: "Custom Data Sets", href: "#custom-datasets" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Contact Sales", href: "mailto:enterprise@altdata.com" },
    { name: "Careers", href: "/careers" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
};

const integrations = [
  "Bloomberg Terminal",
  "FactSet",
  "Capital IQ",
  "Custom APIs",
];

export const Footer = () => {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto max-w-6xl px-6 py-12">
        {/* Main Footer Content */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">AltData Intelligence</span>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Institutional-grade transformation intelligence for equity and credit portfolio managers.
            </p>
            <div className="flex gap-4 text-sm">
              <div>
                <div className="font-semibold">12,000+</div>
                <div className="text-xs text-muted-foreground">Entities Tracked</div>
              </div>
              <div>
                <div className="font-semibold">240+</div>
                <div className="text-xs text-muted-foreground">2024 Alerts</div>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Product</h3>
            <ul className="space-y-2 text-sm">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
              <li>
                <ROICalculator />
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Resources</h3>
            <ul className="space-y-2 text-sm">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Company</h3>
            <ul className="space-y-2 text-sm">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Integrations Section */}
        <div className="mt-12 border-t pt-8">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Zap className="h-4 w-4 text-primary" />
            Platform Integrations
          </div>
          <div className="flex flex-wrap gap-3">
            {integrations.map((integration) => (
              <div
                key={integration}
                className="rounded-full border border-border bg-secondary px-3 py-1 text-xs"
              >
                {integration}
              </div>
            ))}
          </div>
        </div>

        {/* Data Sources */}
        <div className="mt-8 border-t pt-8">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4 text-primary" />
            Data Sources & Coverage
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">Proprietary OSINT:</span> Job postings, vendor filings, 
            procurement records, conference transcripts, regulatory disclosures, web scraping | 
            <span className="font-semibold ml-2">Transformation Types:</span> ERP (SAP, Oracle, Microsoft), CRM (Salesforce, Dynamics, HubSpot), PLM, Core Banking, Infrastructure | 
            <span className="font-semibold ml-2">Geographic Coverage:</span> North America, Europe, Asia-Pacific | 
            <span className="font-semibold ml-2">Asset Classes:</span> Public equities, corporate bonds, 
            sovereign debt, municipal bonds, private credit
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© 2024 AltData Intelligence. All rights reserved.</p>
          <p className="mt-2 text-xs">
            Not investment advice. For institutional use only. Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    </footer>
  );
};
