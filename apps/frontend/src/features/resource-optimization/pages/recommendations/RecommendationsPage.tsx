import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRecommendations, useGenerateRecommendations, useRecommendationsSummary } from '../../hooks/useResourceApi';
import { RecommendationsList } from '../../components/RecommendationsList';
import { RefreshCw } from 'lucide-react';

interface RecommendationsPageProps {
  siteId: string;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({ siteId }) => {
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
              <p className="text-sm text-gray-600">Économies Potentielles</p>
              <p className="text-2xl font-bold">{summary.totalPotentialSavings}€</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600">Approuvées</p>
              <p className="text-2xl font-bold">{summary.approvedSavings}€</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600">Réalisées</p>
              <p className="text-2xl font-bold">{summary.realizedSavings}€</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600">Réduction CO2</p>
              <p className="text-2xl font-bold">{summary.totalCO2Reduction} kg</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setFilter(undefined)}>Tous</TabsTrigger>
          <TabsTrigger value="energy" onClick={() => setFilter('energy')}>Énergie</TabsTrigger>
          <TabsTrigger value="equipment" onClick={() => setFilter('equipment')}>Équipements</TabsTrigger>
          <TabsTrigger value="workforce" onClick={() => setFilter('workforce')}>Travailleurs</TabsTrigger>
          <TabsTrigger value="scheduling" onClick={() => setFilter('scheduling')}>Planification</TabsTrigger>
          <TabsTrigger value="environmental" onClick={() => setFilter('environmental')}>Environnement</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Toutes les Recommandations ({recommendations?.length || 0})</CardTitle>
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
