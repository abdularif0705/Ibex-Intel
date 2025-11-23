import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ValueProposition } from "@/components/ValueProposition";
import { DataPreview } from "@/components/DataPreview";
import { ROICalculator } from "@/components/ROICalculator";
import { CostComparison } from "@/components/CostComparison";
import { TrackRecord } from "@/components/TrackRecord";
import { Security } from "@/components/Security";
import { Pricing } from "@/components/Pricing";
import { LeadMagnet } from "@/components/LeadMagnet";
import { Footer } from "@/components/Footer";
import ibexLogo from "@/assets/ibex-logo.png";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <ValueProposition />
      <DataPreview />
      <ROICalculator />
      <CostComparison />
      <TrackRecord />
      
      {/* Centered Ibex Logo Divider */}
      <div className="py-16 flex justify-center items-center">
        <img 
          src={ibexLogo} 
          alt="Ibex Intel" 
          className="h-64 w-64 invert opacity-20 hover:opacity-40 transition-opacity duration-300" 
        />
      </div>
      
      <Security />
      <Pricing />
      <LeadMagnet />
      <Footer />
    </div>
  );
};

export default Index;
