import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRecommendations, useGenerateRecommendations, useRecommendationsSummary } from '../../hooks/useResourceApi';
import { RecommendationsList } from '../../components/RecommendationsList';
import { RefreshCw, ArrowLeft } from 'lucide-react';

interface RecommendationsPageProps {
  siteId: string;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({ siteId }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: recommendations, isLoading, refetch } = useRecommendations(siteId);
  const { data: summary } = useRecommendationsSummary(siteId);
  const generateRecs = useGenerateRecommendations(siteId);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateRecs.mutateAsync();
      refetch();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Button 
        variant="ghost" 
        onClick={() => navigate(`/resource-optimization/${siteId}`)} 
        className="mb-4 gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">💡 Recommendations</h1>
          <p className="text-gray-600 mt-1">
            Smart suggestions to optimize resources
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Generating...' : 'Generate'}
        </Button>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600">Potential Savings</p>
              <p className="text-2xl font-bold">{summary.totalPotentialSavings}€</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold">{summary.approvedSavings}€</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600">Realized</p>
              <p className="text-2xl font-bold">{summary.realizedSavings}€</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600">CO2 Reduction</p>
              <p className="text-2xl font-bold">{summary.totalCO2Reduction} kg</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setFilter(undefined)}>All</TabsTrigger>
          <TabsTrigger value="energy" onClick={() => setFilter('energy')}>Energy</TabsTrigger>
          <TabsTrigger value="equipment" onClick={() => setFilter('equipment')}>Equipment</TabsTrigger>
          <TabsTrigger value="workforce" onClick={() => setFilter('workforce')}>Workforce</TabsTrigger>
          <TabsTrigger value="scheduling" onClick={() => setFilter('scheduling')}>Planning</TabsTrigger>
          <TabsTrigger value="environmental" onClick={() => setFilter('environmental')}>Environment</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Recommendations ({recommendations?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <RecommendationsList 
                recommendations={recommendations || []} 
                loading={isLoading}
                onApprove={() => {}}
                onReject={() => {}}
                onImplement={() => {}}
                filter={filter}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RecommendationsPage;
