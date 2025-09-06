import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const PortfolioGenerator = () => {
  console.log('🎯 PortfolioGenerator component rendering - SIMPLE VERSION');
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="bg-green-100 p-4 text-green-800 rounded">
        SUCCESS: PortfolioGenerator is now working!
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/")} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Options
        </Button>
        <h1 className="text-3xl font-bold">Portfolio Generator</h1>
      </div>

      <div className="p-4 border rounded">
        <p>This is a simplified version to test navigation. The full functionality will be restored once navigation is confirmed working.</p>
      </div>
    </div>
  );
};

export default PortfolioGenerator;