import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const PortfolioGenerator = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/")} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Options
        </Button>
        <h1 className="text-3xl font-bold">Automatic Portfolio Generator</h1>
      </div>
      
      <div className="mt-8 text-center">
        <p>Step 1: Basic component with navigation - ✅ Working</p>
        <p>Next: Add data loading...</p>
      </div>
    </div>
  );
};

export default PortfolioGenerator;