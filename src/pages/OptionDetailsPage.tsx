import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEnrichedOptionsData } from "@/hooks/useEnrichedOptionsData";
import { usePageTitle } from "@/hooks/usePageTitle";
import { OptionDetails } from "@/components/options/OptionDetails";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const OptionDetailsPage = () => {
  usePageTitle('Option Details');
  const { optionId } = useParams<{ optionId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Use enriched data directly - it already includes recalculated options
  const { data } = useEnrichedOptionsData();

  const handleBackClick = () => {
    navigate(-1);
  };

  // Find the option by ID (using OptionName as the unique identifier)
  const option = data.find(opt => encodeURIComponent(opt.OptionName) === optionId);

  if (!option) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={handleBackClick}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Overview
          </Button>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Option Not Found</h1>
          <p className="text-muted-foreground mt-2">The requested option could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Option Details</h1>
        <Button 
          variant="outline" 
          onClick={handleBackClick}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Overview
        </Button>
      </div>
      <OptionDetails option={option} />
    </div>
  );
};

export default OptionDetailsPage;