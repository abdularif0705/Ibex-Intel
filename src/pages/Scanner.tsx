import { ScrapingDashboard } from "@/components/ScrapingDashboard";
import { CompanySearchDashboard } from "@/components/CompanySearchDashboard";
import { GrokSearchDashboard } from "@/components/GrokSearchDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles } from "lucide-react";

const Scanner = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6">
        <Tabs defaultValue="intelligent" className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-6">
            <TabsTrigger value="intelligent">🎯 Smart Search</TabsTrigger>
            <TabsTrigger value="ai-search" className="gap-2">
              <Sparkles className="w-4 h-4" />
              AI Search
            </TabsTrigger>
            <TabsTrigger value="manual">🔧 Manual Scan</TabsTrigger>
          </TabsList>
          
          <TabsContent value="intelligent" className="mt-0">
            <CompanySearchDashboard />
          </TabsContent>

          <TabsContent value="ai-search" className="mt-0">
            <GrokSearchDashboard />
          </TabsContent>
          
          <TabsContent value="manual" className="mt-0">
            <ScrapingDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Scanner;
