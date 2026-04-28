import axios from 'axios';
import weatherService, { WeatherData, WeatherImpact } from './weatherService';

export interface StockPrediction {
  materialId: string;
  materialName: string;
  currentStock: number;
  predictedOutOfStockDate: string;
  daysUntilOutOfStock: number;
  recommendedOrderQuantity: number;
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  weatherImpact: WeatherImpact;
  factors: {
    consumptionRate: number;
    seasonalTrend: string;
    projectActivity: number;
    weatherMultiplier: number;
  };
  recommendations: string[];
}

export interface PredictionParams {
  materialId: string;
  materialName: string;
  currentStock: number;
  category: string;
  siteCoordinates?: { lat: number; lng: number };
  siteAddress?: string;
  projectType?: string;
  activityLevel?: number;
}

class AIPredictionService {
  private cache = new Map<string, { data: StockPrediction; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * 🤖 Générer une prédiction AI complète pour un matériau
   */
  async generateStockPrediction(params: PredictionParams): Promise<StockPrediction> {
    const cacheKey = `${params.materialId}-${params.currentStock}`;
    
    // Vérifier le cache pour éviter trop de reloads
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('📋 Using cached prediction for:', params.materialName);
      return cached.data;
    }

    try {
      console.log('🤖 Generating AI prediction for:', params.materialName);

      // 1. Récupérer les données météo
      const weather = await this.getWeatherForMaterial(params);
      
      // 2. Analyser l'impact météo
      const weatherImpact = weatherService.analyzeWeatherImpact(weather, params.category);
      
      // 3. Calculer les facteurs de consommation
      const factors = this.calculateConsumptionFactors(params, weatherImpact);
      
      // 4. Générer la prédiction
      const prediction = this.calculatePrediction(params, factors, weatherImpact);
      
      // 5. Mettre en cache
      this.cache.set(cacheKey, { data: prediction, timestamp: Date.now() });
      
      console.log('✅ AI prediction generated:', prediction.riskLevel);
      return prediction;

    } catch (error) {
      console.error('❌ Error generating AI prediction:', error);
      return this.generateFallbackPrediction(params);
    }
  }

  /**
   * 🌤️ Récupérer les données météo pour le matériau
   */
  private async getWeatherForMaterial(params: PredictionParams): Promise<WeatherData> {
    const site = {
      coordinates: params.siteCoordinates,
      adresse: params.siteAddress,
      nom: 'Site'
    };
    
    return await weatherService.getWeatherForSite(site);
  }

  /**
   * 📊 Calculer les facteurs de consommation
   */
  private calculateConsumptionFactors(params: PredictionParams, weatherImpact: WeatherImpact) {
    // Taux de consommation de base (unités par jour)
    let baseConsumptionRate = this.getBaseConsumptionRate(params.category);
    
    // Facteur d'activité du projet
    const activityMultiplier = (params.activityLevel || 0.7);
    
    // Facteur saisonnier
    const seasonalTrend = this.getSeasonalTrend();
    const seasonalMultiplier = this.getSeasonalMultiplier(seasonalTrend);
    
    // Facteur météo
    const weatherMultiplier = weatherImpact.consumptionMultiplier;
    
    // Calcul final
    const finalConsumptionRate = baseConsumptionRate * activityMultiplier * seasonalMultiplier * weatherMultiplier;

    return {
      consumptionRate: Math.round(finalConsumptionRate * 100) / 100,
      seasonalTrend,
      projectActivity: activityMultiplier,
      weatherMultiplier
    };
  }

  /**
   * 🎯 Calculer la prédiction finale
   */
  private calculatePrediction(
    params: PredictionParams, 
    factors: any, 
    weatherImpact: WeatherImpact
  ): StockPrediction {
    const { currentStock } = params;
    const { consumptionRate } = factors;

    // Calculs de prédiction
    const daysUntilOutOfStock = consumptionRate > 0 ? Math.ceil(currentStock / consumptionRate) : 999;
    const predictedOutOfStockDate = new Date(Date.now() + daysUntilOutOfStock * 24 * 60 * 60 * 1000);
    
    // Niveau de risque
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (daysUntilOutOfStock <= 3) riskLevel = 'HIGH';
    else if (daysUntilOutOfStock <= 7) riskLevel = 'MEDIUM';
    
    // Quantité recommandée
    const recommendedOrderQuantity = Math.ceil(consumptionRate * 14); // 2 semaines
    
    // Confiance (basée sur la qualité des données)
    const confidence = this.calculateConfidence(params, factors);
    
    // Recommandations
    const recommendations = this.generateRecommendations(riskLevel, weatherImpact, factors);

    return {
      materialId: params.materialId,
      materialName: params.materialName,
      currentStock,
      predictedOutOfStockDate: predictedOutOfStockDate.toISOString(),
      daysUntilOutOfStock,
      recommendedOrderQuantity,
      confidence,
      riskLevel,
      weatherImpact,
      factors,
      recommendations
    };
  }

  /**
   * 📈 Obtenir le taux de consommation de base par catégorie
   */
  private getBaseConsumptionRate(category: string): number {
    const rates: { [key: string]: number } = {
      'béton': 5.0,
      'ciment': 3.0,
      'fer': 2.5,
      'acier': 2.0,
      'bois': 4.0,
      'sable': 6.0,
      'gravier': 5.5,
      'brique': 3.5,
      'carrelage': 1.5,
      'peinture': 1.0,
      'électricité': 2.0,
      'plomberie': 1.5,
      'isolation': 2.5,
      'toiture': 2.0
    };
    
    return rates[category.toLowerCase()] || 2.0;
  }

  /**
   * 🗓️ Obtenir la tendance saisonnière
   */
  private getSeasonalTrend(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 5) return 'Printemps - Activité élevée';
    if (month >= 6 && month <= 8) return 'Été - Activité maximale';
    if (month >= 9 && month <= 11) return 'Automne - Activité modérée';
    return 'Hiver - Activité réduite';
  }

  /**
   * 📊 Obtenir le multiplicateur saisonnier
   */
  private getSeasonalMultiplier(trend: string): number {
    if (trend.includes('maximale')) return 1.3;
    if (trend.includes('élevée')) return 1.1;
    if (trend.includes('modérée')) return 0.9;
    return 0.7; // Hiver
  }

  /**
   * 🎯 Calculer la confiance de la prédiction
   */
  private calculateConfidence(params: PredictionParams, factors: any): number {
    let confidence = 70; // Base
    
    // Bonus si on a des coordonnées GPS
    if (params.siteCoordinates) confidence += 10;
    
    // Bonus si on a le type de projet
    if (params.projectType) confidence += 5;
    
    // Bonus si on a le niveau d'activité
    if (params.activityLevel) confidence += 10;
    
    // Malus si stock très bas (moins fiable)
    if (params.currentStock < 10) confidence -= 15;
    
    return Math.min(95, Math.max(50, confidence));
  }

  /**
   * 💡 Générer des recommandations
   */
  private generateRecommendations(
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH', 
    weatherImpact: WeatherImpact, 
    factors: any
  ): string[] {
    const recommendations: string[] = [];
    
    // Recommandations basées sur le risque
    if (riskLevel === 'HIGH') {
      recommendations.push('🚨 Commander immédiatement - Rupture imminente');
      recommendations.push('📞 Contacter le fournisseur en urgence');
    } else if (riskLevel === 'MEDIUM') {
      recommendations.push('⚠️ Planifier une commande dans les 2-3 jours');
      recommendations.push('📋 Vérifier les délais de livraison');
    } else {
      recommendations.push('✅ Stock suffisant pour le moment');
      recommendations.push('📅 Surveiller l\'évolution');
    }
    
    // Recommandations météo
    if (weatherImpact.impactLevel !== 'LOW') {
      recommendations.push(`🌤️ ${weatherImpact.message}`);
      recommendations.push(...weatherImpact.recommendations);
    }
    
    // Recommandations saisonnières
    if (factors.seasonalTrend.includes('maximale')) {
      recommendations.push('🏗️ Période de forte activité - Anticiper les besoins');
    } else if (factors.seasonalTrend.includes('réduite')) {
      recommendations.push('❄️ Période calme - Optimiser les stocks');
    }
    
    return recommendations;
  }

  /**
   * 🔄 Prédiction de secours en cas d'erreur
   */
  private generateFallbackPrediction(params: PredictionParams): StockPrediction {
    const daysUntilOutOfStock = Math.ceil(params.currentStock / 2); // Estimation simple
    
    return {
      materialId: params.materialId,
      materialName: params.materialName,
      currentStock: params.currentStock,
      predictedOutOfStockDate: new Date(Date.now() + daysUntilOutOfStock * 24 * 60 * 60 * 1000).toISOString(),
      daysUntilOutOfStock,
      recommendedOrderQuantity: Math.ceil(params.currentStock * 0.5),
      confidence: 60,
      riskLevel: daysUntilOutOfStock <= 7 ? 'HIGH' : 'MEDIUM',
      weatherImpact: {
        impactLevel: 'LOW',
        message: 'Données météo non disponibles',
        recommendations: [],
        consumptionMultiplier: 1.0
      },
      factors: {
        consumptionRate: 2.0,
        seasonalTrend: 'Estimation',
        projectActivity: 0.7,
        weatherMultiplier: 1.0
      },
      recommendations: ['📊 Prédiction basique - Données limitées']
    };
  }

  /**
   * 🗑️ Nettoyer le cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export default new AIPredictionService();