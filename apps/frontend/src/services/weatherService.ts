import axios from 'axios';

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  description: string;
  icon: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface WeatherImpact {
  impactLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  recommendations: string[];
  consumptionMultiplier: number; // 1.0 = normal, 1.2 = +20%, etc.
}

class WeatherService {
  private readonly API_KEY = 'demo_key'; // En production, utiliser une vraie clé API
  private readonly BASE_URL = 'https://api.openweathermap.org/data/2.5';

  /**
   * 🌤️ Récupérer les données météo par coordonnées GPS
   */
  async getWeatherByCoordinates(lat: number, lng: number): Promise<WeatherData> {
    try {
      // En mode démo, simuler les données météo
      if (this.API_KEY === 'demo_key') {
        return this.simulateWeatherData(lat, lng);
      }

      const response = await axios.get(`${this.BASE_URL}/weather`, {
        params: {
          lat,
          lon: lng,
          appid: this.API_KEY,
          units: 'metric',
          lang: 'fr'
        }
      });

      return this.parseWeatherResponse(response.data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return this.simulateWeatherData(lat, lng);
    }
  }

  /**
   * 🌍 Récupérer les données météo par nom de ville
   */
  async getWeatherByCity(cityName: string): Promise<WeatherData> {
    try {
      if (this.API_KEY === 'demo_key') {
        return this.simulateWeatherData(0, 0, cityName);
      }

      const response = await axios.get(`${this.BASE_URL}/weather`, {
        params: {
          q: cityName,
          appid: this.API_KEY,
          units: 'metric',
          lang: 'fr'
        }
      });

      return this.parseWeatherResponse(response.data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return this.simulateWeatherData(0, 0, cityName);
    }
  }

  /**
   * 📍 Récupérer les données météo pour un site (avec coordonnées ou adresse)
   */
  async getWeatherForSite(site: { coordinates?: { lat: number; lng: number }; adresse?: string; nom?: string }): Promise<WeatherData> {
    try {
      // Priorité aux coordonnées GPS si disponibles
      if (site.coordinates?.lat && site.coordinates?.lng) {
        return await this.getWeatherByCoordinates(site.coordinates.lat, site.coordinates.lng);
      }

      // Sinon, utiliser l'adresse ou le nom
      const location = site.adresse || site.nom || 'Paris';
      return await this.getWeatherByCity(location);
    } catch (error) {
      console.error('Error getting weather for site:', error);
      return this.simulateWeatherData(0, 0, site.nom || 'Site');
    }
  }

  /**
   * 🎯 Analyser l'impact météo sur la consommation de matériaux
   */
  analyzeWeatherImpact(weather: WeatherData, materialCategory: string): WeatherImpact {
    let impactLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let message = 'Conditions normales';
    let recommendations: string[] = [];
    let consumptionMultiplier = 1.0;

    // Analyse basée sur les conditions météo et le type de matériau
    if (weather.condition.includes('rain') || weather.condition.includes('pluie')) {
      if (materialCategory.includes('béton') || materialCategory.includes('ciment')) {
        impactLevel = 'HIGH';
        message = 'Pluie - Impact élevé sur les travaux de béton';
        recommendations = [
          'Protéger les matériaux de la pluie',
          'Prévoir des bâches étanches',
          'Reporter les coulages si possible'
        ];
        consumptionMultiplier = 0.7; // Réduction de consommation
      } else if (materialCategory.includes('bois') || materialCategory.includes('isolation')) {
        impactLevel = 'MEDIUM';
        message = 'Pluie - Protéger les matériaux sensibles';
        recommendations = ['Stockage en intérieur recommandé'];
        consumptionMultiplier = 0.9;
      }
    } else if (weather.windSpeed > 20) {
      impactLevel = 'MEDIUM';
      message = 'Vent fort - Attention aux matériaux légers';
      recommendations = ['Sécuriser les matériaux', 'Éviter les travaux en hauteur'];
      consumptionMultiplier = 0.8;
    } else if (weather.temperature > 30) {
      if (materialCategory.includes('béton') || materialCategory.includes('ciment')) {
        impactLevel = 'MEDIUM';
        message = 'Forte chaleur - Accélération de prise du béton';
        recommendations = ['Arroser régulièrement', 'Travailler tôt le matin'];
        consumptionMultiplier = 1.1;
      }
    } else if (weather.temperature < 5) {
      impactLevel = 'MEDIUM';
      message = 'Températures basses - Risque de gel';
      recommendations = ['Protéger du gel', 'Utiliser des additifs antigel'];
      consumptionMultiplier = 1.2;
    }

    return {
      impactLevel,
      message,
      recommendations,
      consumptionMultiplier
    };
  }

  /**
   * 🎲 Simuler les données météo (pour la démo)
   */
  private simulateWeatherData(lat: number, lng: number, location?: string): WeatherData {
    const conditions = [
      { condition: 'clear', description: 'Ensoleillé', icon: '☀️', temp: 22, humidity: 45, wind: 8 },
      { condition: 'clouds', description: 'Nuageux', icon: '☁️', temp: 18, humidity: 65, wind: 12 },
      { condition: 'rain', description: 'Pluvieux', icon: '🌧️', temp: 15, humidity: 85, wind: 15 },
      { condition: 'snow', description: 'Neigeux', icon: '❄️', temp: 2, humidity: 90, wind: 10 },
    ];

    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];

    return {
      temperature: randomCondition.temp + Math.floor(Math.random() * 10) - 5,
      humidity: randomCondition.humidity + Math.floor(Math.random() * 20) - 10,
      windSpeed: randomCondition.wind + Math.floor(Math.random() * 10) - 5,
      condition: randomCondition.condition,
      description: randomCondition.description,
      icon: randomCondition.icon,
      location: location || `Site (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
      coordinates: { lat, lng }
    };
  }

  /**
   * 📊 Parser la réponse de l'API météo
   */
  private parseWeatherResponse(data: any): WeatherData {
    return {
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // m/s vers km/h
      condition: data.weather[0].main.toLowerCase(),
      description: data.weather[0].description,
      icon: this.getWeatherIcon(data.weather[0].main),
      location: data.name,
      coordinates: {
        lat: data.coord.lat,
        lng: data.coord.lon
      }
    };
  }

  /**
   * 🎨 Obtenir l'icône météo
   */
  private getWeatherIcon(condition: string): string {
    const icons: { [key: string]: string } = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Snow': '❄️',
      'Thunderstorm': '⛈️',
      'Drizzle': '🌦️',
      'Mist': '🌫️',
      'Fog': '🌫️'
    };
    return icons[condition] || '🌤️';
  }
}

export default new WeatherService();