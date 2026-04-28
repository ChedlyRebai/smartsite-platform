import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Cloud, Sun, CloudRain, Snowflake, Wind, Droplets, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface WeatherData {
  temperature: number;
  feelsLike: number;
  description: string;
  icon: string;
  iconUrl: string;
  humidity: number;
  windSpeed: number;
  cityName: string;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'windy';
}

interface MaterialWeatherWidgetProps {
  siteCoordinates?: { lat: number; lng: number };
  siteAddress?: string;
  siteName?: string;
  materialCategory?: string;
  onWeatherUpdate?: (weather: WeatherData) => void;
}

export default function MaterialWeatherWidget({ 
  siteCoordinates, 
  siteAddress, 
  siteName, 
  materialCategory = 'général',
  onWeatherUpdate 
}: MaterialWeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWeatherData();
  }, [siteCoordinates, siteAddress, siteName]);

  const loadWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);

      let weatherData: WeatherData | null = null;

      if (siteCoordinates?.lat && siteCoordinates?.lng) {
        // Utiliser les coordonnées GPS
        console.log('🌍 Loading weather by coordinates:', siteCoordinates);
        const response = await fetch(
          `/api/weather?lat=${siteCoordinates.lat}&lng=${siteCoordinates.lng}`
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log('📡 Weather API response:', data);
          if (data.success && data.weather) {
            weatherData = data.weather;
          }
        } else {
          console.error('❌ Weather API error:', response.status);
        }
      } else if (siteAddress || siteName) {
        // Utiliser l'adresse ou le nom du site
        const cityName = siteAddress || siteName || 'Paris';
        console.log('🏙️ Loading weather by city:', cityName);
        const response = await fetch(
          `/api/weather/city?city=${encodeURIComponent(cityName)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log('📡 Weather city API response:', data);
          if (data.success && data.weather) {
            weatherData = data.weather;
          }
        }
      }

      if (weatherData) {
        setWeather(weatherData);
        console.log('✅ Weather loaded:', weatherData);
        
        if (onWeatherUpdate) {
          onWeatherUpdate(weatherData);
        }
      } else {
        setError('Météo non disponible pour ce site');
        console.warn('⚠️ No weather data available');
      }

    } catch (err: any) {
      console.error('❌ Error loading weather:', err);
      setError('Impossible de charger les données météo');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny': return <Sun className="h-8 w-8 text-yellow-500" />;
      case 'cloudy': return <Cloud className="h-8 w-8 text-gray-500" />;
      case 'rainy': return <CloudRain className="h-8 w-8 text-blue-500" />;
      case 'snowy': return <Snowflake className="h-8 w-8 text-blue-300" />;
      default: return <Cloud className="h-8 w-8 text-gray-400" />;
    }
  };

  const getWeatherEmoji = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny': return '☀️';
      case 'cloudy': return '☁️';
      case 'rainy': return '🌧️';
      case 'snowy': return '❄️';
      case 'stormy': return '⛈️';
      case 'windy': return '💨';
      default: return '🌤️';
    }
  };

  const getImpactMessage = (condition: string, category: string) => {
    const cond = condition.toLowerCase();
    const cat = category.toLowerCase();
    
    if (cond === 'rainy' || cond === 'stormy') {
      if (cat.includes('béton') || cat.includes('ciment')) {
        return { level: 'HIGH', message: 'Pluie - Protéger les matériaux, reporter les coulages' };
      }
      return { level: 'MEDIUM', message: 'Pluie - Protéger les matériaux sensibles' };
    }
    
    if (cond === 'sunny') {
      return { level: 'LOW', message: 'Conditions optimales pour le chantier' };
    }
    
    return { level: 'LOW', message: 'Conditions normales' };
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            🌤️ Météo du Chantier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="ml-2 text-sm text-gray-500">Chargement météo...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            🌤️ Météo du Chantier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Cloud className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-red-500 mb-2">⚠️ {error}</p>
            <p className="text-xs text-gray-500 mb-3">
              {siteCoordinates ? 
                `Coordonnées: ${siteCoordinates.lat.toFixed(4)}, ${siteCoordinates.lng.toFixed(4)}` :
                'Aucune localisation disponible'
              }
            </p>
            <Button size="sm" variant="outline" onClick={loadWeatherData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const impact = getImpactMessage(weather.condition, materialCategory || 'général');

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getWeatherIcon(weather.condition)}
            <span>Météo - {weather.cityName}</span>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={loadWeatherData}
            title="Actualiser la météo"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Conditions actuelles */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{getWeatherEmoji(weather.condition)}</span>
              <div>
                <p className="text-3xl font-bold">{weather.temperature}°C</p>
                <p className="text-sm text-gray-600 capitalize">{weather.description}</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Ressenti:</span>
              <span className="font-medium">{weather.feelsLike}°C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Humidité:</span>
              <span className="font-medium">{weather.humidity}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Vent:</span>
              <span className="font-medium">{weather.windSpeed} km/h</span>
            </div>
          </div>
        </div>

        {/* Impact sur les matériaux */}
        {impact.level !== 'LOW' && (
          <div className={`p-3 rounded-lg border ${
            impact.level === 'HIGH' ? 'bg-red-50 border-red-200' :
            'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  impact.level === 'HIGH' ? 'border-red-500 text-red-700' :
                  'border-yellow-500 text-yellow-700'
                }`}
              >
                Impact {impact.level}
              </Badge>
              <span className="text-sm font-medium">Matériaux {materialCategory}</span>
            </div>
            <p className="text-sm text-gray-700">{impact.message}</p>
          </div>
        )}

        {/* Icône météo de l'API */}
        {weather.iconUrl && (
          <div className="flex justify-center">
            <img 
              src={weather.iconUrl} 
              alt={weather.description} 
              className="h-16 w-16"
              onError={(e) => {
                // Masquer l'image si elle ne charge pas
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}