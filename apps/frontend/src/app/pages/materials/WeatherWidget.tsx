"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { toast } from "sonner";
import { 
  Cloud, CloudRain, CloudSnow, Sun, Wind, 
  Droplets, Thermometer, RefreshCw, Loader2,
  MapPin, Clock
} from "lucide-react";
import axios from "axios";

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

interface WeatherWidgetProps {
  orderId?: string;
  coordinates?: { lat: number; lng: number };
  className?: string;
}

export default function WeatherWidget({ orderId, coordinates, className = "" }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadWeather = async () => {
    if (!orderId && !coordinates) {
      setError("Aucune localisation disponible");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let weatherData: WeatherData | null = null;

      if (orderId) {
        // Charger la météo via l'ID de commande
        const { data } = await axios.get(`/api/chat/weather/${orderId}`);
        if (data.success && data.weather) {
          weatherData = data.weather;
        }
      } else if (coordinates) {
        // Charger la météo via les coordonnées GPS
        const { data } = await axios.get('/api/materials/weather', {
          params: {
            lat: coordinates.lat,
            lng: coordinates.lng
          }
        });
        if (data.success && data.weather) {
          weatherData = data.weather;
        }
      }

      if (weatherData) {
        setWeather(weatherData);
        setLastUpdate(new Date());
        setError(null);
      } else {
        setError("Données météo non disponibles");
      }
    } catch (err: any) {
      console.error('Error loading weather:', err);
      setError(err.response?.data?.message || "Erreur chargement météo");
      toast.error("Impossible de charger la météo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather();
    
    // Actualiser toutes les 30 minutes
    const interval = setInterval(() => {
      loadWeather();
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [orderId, coordinates]);

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny':
        return <Sun className="h-12 w-12 text-yellow-500" />;
      case 'cloudy':
        return <Cloud className="h-12 w-12 text-gray-500" />;
      case 'rainy':
        return <CloudRain className="h-12 w-12 text-blue-500" />;
      case 'stormy':
        return <CloudRain className="h-12 w-12 text-purple-500" />;
      case 'snowy':
        return <CloudSnow className="h-12 w-12 text-cyan-500" />;
      case 'windy':
        return <Wind className="h-12 w-12 text-teal-500" />;
      default:
        return <Cloud className="h-12 w-12 text-gray-400" />;
    }
  };

  const getConditionLabel = (condition: string) => {
    const labels: Record<string, string> = {
      sunny: 'Ensoleillé',
      cloudy: 'Nuageux',
      rainy: 'Pluvieux',
      stormy: 'Orageux',
      snowy: 'Neigeux',
      windy: 'Venteux'
    };
    return labels[condition] || condition;
  };

  const getConditionColor = (condition: string) => {
    const colors: Record<string, string> = {
      sunny: 'bg-yellow-100 text-yellow-700',
      cloudy: 'bg-gray-100 text-gray-700',
      rainy: 'bg-blue-100 text-blue-700',
      stormy: 'bg-purple-100 text-purple-700',
      snowy: 'bg-cyan-100 text-cyan-700',
      windy: 'bg-teal-100 text-teal-700'
    };
    return colors[condition] || 'bg-gray-100 text-gray-700';
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000 / 60);
    
    if (diff < 1) return 'À l\'instant';
    if (diff < 60) return `Il y a ${diff} min`;
    const hours = Math.floor(diff / 60);
    return `Il y a ${hours}h`;
  };

  if (loading && !weather) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Chargement météo...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !weather) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <Cloud className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadWeather} 
              className="mt-3"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="font-semibold text-gray-900">{weather.cityName}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={loadWeather} 
              disabled={loading}
              title="Actualiser"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Main Weather Display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getWeatherIcon(weather.condition)}
              <div>
                <div className="text-4xl font-bold text-gray-900">
                  {weather.temperature}°C
                </div>
                <div className="text-sm text-gray-500">
                  Ressenti {weather.feelsLike}°C
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <Badge className={getConditionColor(weather.condition)}>
                {getConditionLabel(weather.condition)}
              </Badge>
              <p className="text-sm text-gray-600 mt-2 capitalize">
                {weather.description}
              </p>
            </div>
          </div>

          {/* Weather Details */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Humidité</p>
                <p className="text-sm font-semibold">{weather.humidity}%</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-teal-500" />
              <div>
                <p className="text-xs text-gray-500">Vent</p>
                <p className="text-sm font-semibold">{weather.windSpeed} km/h</p>
              </div>
            </div>
          </div>

          {/* Last Update */}
          {lastUpdate && (
            <div className="flex items-center justify-center gap-1 text-xs text-gray-400 pt-2 border-t">
              <Clock className="h-3 w-3" />
              <span>Mis à jour {formatLastUpdate()}</span>
            </div>
          )}

          {/* Weather Icon from OpenWeatherMap */}
          {weather.iconUrl && (
            <div className="flex justify-center pt-2">
              <img 
                src={weather.iconUrl} 
                alt={weather.description} 
                className="h-16 w-16"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
