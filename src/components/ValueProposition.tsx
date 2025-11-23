import { Card } from "@/components/ui/card";
import { Shield, Zap, TrendingUp, Database } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
const features = [{
  icon: Database,
  title: "OSINT & Web Scraping",
  description: "Proprietary data collection methods tracking ERP, CRM, and technology transformation signals across thousands of corporate entities."
}, {
  icon: TrendingUp,
  title: "Early Warning Signals",
  description: "Surface indicators of potential ERP, CRM, PLM, and infrastructure changes that may impact equity performance, credit ratings, and covenant compliance."
}, {
  icon: Zap,
  title: "Real-Time Updates",
  description: "Continuous monitoring and instant alerts when new transformation signals emerge, with equity and credit perspectives."
}, {
  icon: Shield,
  title: "Institutional Grade",
  description: "Enterprise-level data accuracy and compliance standards trusted by leading equity and fixed income portfolio managers."
}];
const erpDisasters = [{
  company: "Zimmer Biomet",
  ticker: "NYSE: ZBH",
  year: "2024",
  description: "SAP S/4HANA implementation with Deloitte caused massive operational disruption",
  equityImpact: "Guidance Reduction",
  creditImpact: "Operational Chaos",
  outcome: "$172M+ in damages including $94M in fees (36% over budget), $15M in failed fixes, $72M in internal costs. Couldn't ship products, issue invoices, or generate sales reports for months. System launched July 4, 2024 with severe defects still present. 51 change orders, offshore team issues."
}, {
  company: "Lamb Weston Holdings",
  ticker: "NYSE: LW",
  year: "2024",
  description: "ERP infrastructure problems revealed during earnings",
  equityImpact: "-35%",
  creditImpact: "Rating Watch Negative",
  outcome: "Stock plummeted; our indicators suggested transformation risk months earlier."
}, {
  company: "LeasePlan",
  ticker: "Private (Euronext delisted)",
  year: "2016-2019",
  description: "SAP consolidation project abandoned after 3 years",
  equityImpact: "N/A",
  creditImpact: "Credit Impairment",
  outcome: "$119M loss; attempted to consolidate 35 systems onto single platform, project scope mismanagement led to abandonment."
}, {
  company: "Haribo",
  ticker: "Private",
  year: "2018",
  description: "SAP implementation caused supply chain collapse across 16 factories",
  equityImpact: "N/A",
  creditImpact: "Revenue Decline",
  outcome: "25% sales drop, empty store shelves; couldn't track inventory or raw materials, critical for bond holders monitoring private company operations."
}, {
  company: "Morrisons",
  ticker: "LSE: MRW",
  year: "2020",
  description: "Payroll system failure caused widespread employee payment issues",
  equityImpact: "Reputational Damage",
  creditImpact: "Legal Liabilities",
  outcome: "Thousands of employees received incorrect pay; insufficient testing and data migration issues led to employee dissatisfaction and legal costs."
}, {
  company: "Lidl",
  ticker: "Private",
  year: "2018",
  description: "SAP project abandoned after 7 years",
  equityImpact: "N/A",
  creditImpact: "Covenant Risk",
  outcome: "$576M write-off; prolonged implementation signals observable years before abandonment."
}, {
  company: "Revlon",
  ticker: "NYSE: REV (Delisted)",
  year: "2018",
  description: "SAP S/4HANA implementation with scope creep and integration issues",
  equityImpact: "-85%",
  creditImpact: "Default",
  outcome: "Major supply chain disruptions, missed sales, stock plummeted; ERP failure exacerbated liquidity crisis leading to Chapter 11 in 2022."
}, {
  company: "Target Canada",
  ticker: "NYSE: TGT",
  year: "2013-2015",
  description: "ERP system couldn't handle inventory during Canadian expansion",
  equityImpact: "-10%",
  creditImpact: "Cash Flow Strain",
  outcome: "$2.5B loss, complete exit from Canada; supply chain software failures led to empty shelves and brand damage."
}, {
  company: "Shane Co.",
  ticker: "Private (Bankrupt)",
  year: "2009",
  description: "ERP/inventory system failure during economic downturn",
  equityImpact: "N/A",
  creditImpact: "Default - Chapter 11",
  outcome: "Bankruptcy filing; inventory management system couldn't handle demand fluctuations, critical for bond holders monitoring private company credit risk."
}, {
  company: "National Grid",
  ticker: "LON: NG",
  year: "2012",
  description: "SAP implementation with insufficient training and integration issues",
  equityImpact: "Operational Loss",
  creditImpact: "Cash Drain",
  outcome: "$1B in operational inefficiencies and lost productivity; poor project management and inadequate employee training caused prolonged disruption."
}, {
  company: "MillerCoors",
  ticker: "NYSE: TAP",
  year: "2015",
  description: "SAP consolidation project went live with 50+ known defects",
  equityImpact: "Litigation",
  creditImpact: "Operational Chaos",
  outcome: "Project scrapped within a month, thousands of additional defects discovered, $1M+ lawsuit against implementation partner HCL."
}, {
  company: "HP / Autonomy",
  ticker: "NYSE: HPQ",
  year: "2011",
  description: "Multi-billion acquisition marred by accounting fraud and integration failure",
  equityImpact: "-50%+ over 2 years",
  creditImpact: "Rating Downgrade",
  outcome: "$8.8B writedown on $11B acquisition; integration of enterprise software systems failed spectacularly."
}, {
  company: "Hewlett-Packard",
  ticker: "NYSE: HPQ",
  year: "2004",
  description: "North American order processing centralization failure",
  equityImpact: "$160M Revenue Loss",
  creditImpact: "Customer Attrition",
  outcome: "$160M in lost revenue; severe order fulfillment disruptions despite being HP's 35th similar implementation, overconfidence led to inadequate planning."
}, {
  company: "Waste Management",
  ticker: "NYSE: WM",
  year: "2005",
  description: "Oracle ERP failure with misrepresented capabilities and customization challenges",
  equityImpact: "Litigation Costs",
  creditImpact: "Operational Disruption",
  outcome: "$500M lawsuit against Oracle; extensive customization increased complexity, project management failures led to complete breakdown."
}, {
  company: "Nike",
  ticker: "NYSE: NKE",
  year: "2000",
  description: "Supply chain software failure during peak season",
  equityImpact: "-20%",
  creditImpact: "Liquidity Concerns",
  outcome: "$100M+ inventory losses and missed orders; early indicators could have informed portfolio risk assessments."
}, {
  company: "Hershey",
  ticker: "NYSE: HSY",
  year: "1999",
  description: "SAP implementation disaster during Halloween season",
  equityImpact: "-19% profit drop",
  creditImpact: "Cash Flow Disruption",
  outcome: "$100M+ in unfulfilled orders and distribution failures; aggressive timeline and inadequate testing during peak season."
}, {
  company: "U.S. Navy",
  ticker: "U.S. Government",
  year: "1998-Present",
  description: "Multi-decade ERP project with continuous scope reductions",
  equityImpact: "N/A",
  creditImpact: "Taxpayer Burden",
  outcome: "Over $1B spent across 4 project iterations with no material improvements; supply chain components removed, massive systems integrator involvement failed."
}, {
  company: "FoxMeyer",
  ticker: "Bankrupt",
  year: "1996",
  description: "ERP failure bankrupted $5B pharmaceutical distributor",
  equityImpact: "Total Loss",
  creditImpact: "Default",
  outcome: "Complete corporate failure; transformation monitoring indicators critical for credit analysis."
}];
const crmDisasters = [{
  company: "Vodafone UK",
  ticker: "NASDAQ: VOD",
  year: "2016",
  description: "Billing system migration disaster causing mass customer complaints",
  equityImpact: "Customer Churn",
  creditImpact: "Regulatory Fines",
  outcome: "Over 10,000 customer complaints; billing errors, service disruptions, and regulatory scrutiny led to brand damage and compensation costs."
}, {
  company: "Avon",
  ticker: "NYSE: AVP (Delisted)",
  year: "2013",
  description: "SAP CRM implementation chaos disrupted sales operations",
  equityImpact: "-50%",
  creditImpact: "Revenue Collapse",
  outcome: "Canadian operations severely disrupted; sales reps couldn't place orders, massive customer attrition, stock plummeted from $20 to $2 over following years."
}, {
  company: "Blackberry",
  ticker: "NASDAQ: BBRY (Delisted)",
  year: "2011",
  description: "CRM communication failure during service outage",
  equityImpact: "Brand Erosion",
  creditImpact: "Market Share Loss",
  outcome: "Failed to use CRM for personalized customer communication during critical outage; broke brand promise leading to irreversible decline."
}, {
  company: "Cigna",
  ticker: "NYSE: CI",
  year: "2002",
  description: "CRM implementation chaos with poor IT infrastructure",
  equityImpact: "$398M Net Loss",
  creditImpact: "Customer Attrition",
  outcome: "$398M loss, lost 6% of customer base; mass migration caused system chaos, members couldn't access coverage info."
}];
const infrastructureFailures = [{
  company: "Walmart / Jet.com",
  ticker: "NYSE: WMT",
  year: "2016-2020",
  description: "E-commerce platform integration failure after $3.3B acquisition",
  equityImpact: "Strategic Setback",
  creditImpact: "Acquisition Loss",
  outcome: "Jet.com shut down after integration complexity and cultural misalignment; $3.3B acquisition yielded no synergies.",
  tag: "Integration"
}, {
  company: "TSB Bank",
  ticker: "Private (Sabadell)",
  year: "2018",
  description: "Core banking system migration disaster",
  equityImpact: "Parent Co. -15%",
  creditImpact: "Regulatory Scrutiny",
  outcome: "1.9M customers locked out; £330M+ costs, CEO resignation, PRA fines.",
  tag: "Infrastructure"
}, {
  company: "Healthcare.gov",
  ticker: "U.S. Government",
  year: "2013",
  description: "ACA healthcare exchange launch disaster",
  equityImpact: "Political Crisis",
  creditImpact: "N/A",
  outcome: "$1.7B spent, system crash on launch day; took months to stabilize, national credibility hit.",
  tag: "Government"
}, {
  company: "Knight Capital",
  ticker: "NYSE: KCG (Acquired)",
  year: "2012",
  description: "Trading algorithm deployment error",
  equityImpact: "Total Loss",
  creditImpact: "Emergency Bailout",
  outcome: "$440M loss in 45 minutes; company nearly bankrupt, acquired at distressed valuation.",
  tag: "Core Systems"
}, {
  company: "California Court System (CCMS)",
  ticker: "State Government",
  year: "2002-2012",
  description: "Unified court management system terminated after a decade",
  equityImpact: "N/A",
  creditImpact: "Taxpayer Loss",
  outcome: "$500M spent over 10 years with no functional system; underestimated costs, inadequate stakeholder engagement, technical challenges.",
  tag: "Government"
}, {
  company: "UK NHS IT Programme",
  ticker: "UK Government",
  year: "2002-2011",
  description: "Centralized electronic health record system for England",
  equityImpact: "N/A",
  creditImpact: "Fiscal Crisis",
  outcome: "£10B spent on £12.7B project before abandonment; overly ambitious scope, poor vendor management, user resistance.",
  tag: "Government"
}, {
  company: "FBI Virtual Case File",
  ticker: "U.S. Government",
  year: "2005",
  description: "Case management system abandoned after $170M spent",
  equityImpact: "N/A",
  creditImpact: "Taxpayer Loss",
  outcome: "Complete project failure; 4 years of development resulted in unusable system.",
  tag: "Government"
}, {
  company: "Denver Airport",
  ticker: "Municipal",
  year: "1995",
  description: "Automated baggage handling system failure",
  equityImpact: "N/A",
  creditImpact: "Bond Issues",
  outcome: "16-month delay, $560M over budget; automated system abandoned, manual backup used.",
  tag: "Infrastructure"
}];
export const ValueProposition = () => {
  return <section className="py-24 px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Why Track Enterprise Technology Transformations?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Enterprise technology transformations represent inflection points that can dramatically impact equity valuations and credit quality—but the market often reacts only after disruption becomes visible.
          </p>
        </div>

        {/* Statistics & Context */}
        <div className="mb-16 grid gap-6 md:grid-cols-3">
          <Card className="border-destructive/20 bg-card p-6 text-center">
            <div className="mb-2 text-4xl font-bold text-destructive">70%</div>
            <div className="mb-2 text-sm font-semibold">Implementation Failure Rate</div>
            <p className="text-xs text-muted-foreground">ERP, CRM, and PLM implementations that fail, exceed budget by 50%+, or cause major operational disruption</p>
          </Card>
          <Card className="border-primary/20 bg-card p-6 text-center">
            <div className="mb-2 text-4xl font-bold text-primary">12-24</div>
            <div className="mb-2 text-sm font-semibold">Month Risk Window</div>
            <p className="text-xs text-muted-foreground">Average duration from transformation start to equity/credit impact—our signals surface indicators during this hidden period</p>
          </Card>
          <Card className="border-accent/20 bg-card p-6 text-center">
            <div className="mb-2 text-4xl font-bold text-accent">2-Way</div>
            <div className="mb-2 text-sm font-semibold">Opportunity Signal</div>
            <p className="text-xs text-muted-foreground">Successful implementations can drive operational efficiency and boost equity performance—our data identifies both risks AND opportunities</p>
          </Card>
        </div>

        {/* Pragmatist Perspective */}
        <div className="mb-16">
          <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 p-8">
            <h3 className="mb-4 text-xl font-bold">A Pragmatist's Perspective on Transformation Intelligence</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">The Reality:</span> Enterprise transformations aren't inherently negative. When executed well, SAP S/4HANA migrations, Workday implementations, and Salesforce rollouts can signal operational maturity, drive efficiency gains, and positively impact equity valuations.
              </p>
              <p>
                <span className="font-semibold text-foreground">The Risk:</span> However, 70%+ of these initiatives fail or cause significant disruption. The challenge is that warning signs—aggressive hiring for transformation roles, consulting partner engagements, infrastructure changes—appear months before market impact.
              </p>
              <p>
                <span className="font-semibold text-foreground">The Opportunity:</span> Our platform surfaces early indicators during the 12-24 month "hidden period" between transformation launch and market impact. Whether you're shorting companies showing red flags or identifying successful implementations as buy signals, actionable alternative data beats lagging earnings reports.
              </p>
              <p className="text-xs italic">
                <span className="font-semibold text-foreground">Note:</span> We cross-reference our in-progress classifications against official completion announcements (e.g., SAP news, vendor press releases) to reduce false positives and ensure data accuracy.
              </p>
            </div>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => <Card key={index} className="group relative overflow-hidden border-border bg-card p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-premium">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
              
              {/* Hover Accent */}
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full" />
            </Card>)}
        </div>

        {/* ERP Disasters Section */}
        <div className="mt-16">
          <div className="mb-8 text-center">
            <h3 className="mb-2 text-2xl font-bold">Historical ERP Disasters</h3>
            <p className="text-muted-foreground">
              Real-world examples where early ERP transformation signals could have informed portfolio risk assessments
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-semibold">For private entities:</span> Our platform automatically matches non-public companies to relevant bonds, credit instruments, and supplier/customer equity exposure
            </p>
          </div>
          
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {erpDisasters.map((study, index) => (
                <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="group border-border bg-card p-6 transition-all duration-300 hover:border-destructive/50 hover:shadow-premium h-full">
                    <div className="mb-3 inline-block rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                      {study.year}
                    </div>
                    <h4 className="mb-1 text-lg font-bold">{study.company}</h4>
                    <p className="mb-3 text-xs text-muted-foreground">{study.ticker}</p>
                    <p className="mb-4 text-sm text-muted-foreground">{study.description}</p>
                    
                    {/* Impact Metrics */}
                    <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg bg-secondary/50 p-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Equity Impact</div>
                        <div className="font-semibold text-destructive">{study.equityImpact}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Credit Impact</div>
                        <div className="text-sm font-semibold">{study.creditImpact}</div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">{study.outcome}</p>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>

        {/* CRM Disasters Section */}
        <div className="mt-16">
          <div className="mb-8 text-center">
            <h3 className="mb-2 text-2xl font-bold">CRM Implementation Disasters</h3>
            <p className="text-muted-foreground">
              Customer relationship management failures that destroyed brand value and customer trust
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-semibold">60% CRM failure rate:</span> Early indicators of CRM transformation issues may help assess risks of customer churn, revenue collapse, and brand erosion
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-semibold">For private companies:</span> Our platform maps CRM failures to bond exposure, credit instruments, and equity supply chain impact
            </p>
          </div>
          
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {crmDisasters.map((study, index) => (
                <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="group border-border bg-card p-6 transition-all duration-300 hover:border-amber-500/50 hover:shadow-premium h-full">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="inline-block rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        {study.year}
                      </div>
                      <div className="rounded-full bg-accent/50 px-2 py-1 text-xs font-medium">
                        CRM
                      </div>
                    </div>
                    <h4 className="mb-1 text-lg font-bold">{study.company}</h4>
                    <p className="mb-3 text-xs text-muted-foreground">{study.ticker}</p>
                    <p className="mb-4 text-sm text-muted-foreground">{study.description}</p>
                    
                    {/* Impact Metrics */}
                    <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg bg-secondary/50 p-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Equity Impact</div>
                        <div className="font-semibold text-amber-600 dark:text-amber-400">{study.equityImpact}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Credit Impact</div>
                        <div className="text-sm font-semibold">{study.creditImpact}</div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">{study.outcome}</p>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>

        {/* Technology & Infrastructure Failures Section */}
        <div className="mt-16">
          <div className="mb-8 text-center">
            <h3 className="mb-2 text-2xl font-bold">Technology & Infrastructure Failures</h3>
            <p className="text-muted-foreground">
              Beyond ERP: Broader IT transformation risks that demonstrate the critical need for early detection
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-semibold">Government & municipal entities:</span> Platform maps to sovereign bonds, municipal bonds, and related financial instruments so you can capitalize on these events
            </p>
          </div>
          
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {infrastructureFailures.map((study, index) => (
                <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="group border-border bg-card p-6 transition-all duration-300 hover:border-amber-500/50 hover:shadow-premium h-full">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="inline-block rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        {study.year}
                      </div>
                      <div className="rounded-full bg-accent/50 px-2 py-1 text-xs font-medium">
                        {study.tag}
                      </div>
                    </div>
                    <h4 className="mb-1 text-lg font-bold">{study.company}</h4>
                    <p className="mb-3 text-xs text-muted-foreground">{study.ticker}</p>
                    <p className="mb-4 text-sm text-muted-foreground">{study.description}</p>
                    
                    {/* Impact Metrics */}
                    <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg bg-secondary/50 p-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Equity Impact</div>
                        <div className="font-semibold text-amber-600 dark:text-amber-400">{study.equityImpact}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Credit Impact</div>
                        <div className="text-sm font-semibold">{study.creditImpact}</div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">{study.outcome}</p>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      </div>
    </section>;
};