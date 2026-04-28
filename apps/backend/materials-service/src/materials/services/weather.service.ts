import { Injectable, Logger } from '@nestjs/common';

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  description: string;
  icon: string;
  iconUrl: string;
  humidity: number;
  windSpeed: number;
  cityName: string;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'windy';
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly API_KEY = 'demo_key'; // En production, utiliser une vraie clé API
  private readonly BASE_URL = 'https://api.openweathermap.org/data/2.5';

  /**
   * 🌤️ Récupérer les données météo par coordonnées GPS
   */
  async getWeatherByCoordinates(
    lat: number,
    lng: number,
  ): Promise<WeatherData> {
    try {
      this.logger.log(`🌍 Fetching weather for coordinates: ${lat}, ${lng}`);

      // En mode démo, simuler les données météo
      if (this.API_KEY === 'demo_key') {
        return this.simulateWeatherData(lat, lng);
      }

      // Code pour API réelle (à activer avec une vraie clé API)
      /*
      const response = await fetch(`${this.BASE_URL}/weather?lat=${lat}&lon=${lng}&appid=${this.API_KEY}&units=metric&lang=fr`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.parseWeatherResponse(data);
      */

      return this.simulateWeatherData(lat, lng);
    } catch (error) {
      this.logger.error(`❌ Error fetching weather: ${error.message}`);
      return this.simulateWeatherData(lat, lng);
    }
  }

  /**
   * 🏙️ Récupérer les données météo par nom de ville
   */
  async getWeatherByCity(cityName: string): Promise<WeatherData> {
    try {
      this.logger.log(`🏙️ Fetching weather for city: ${cityName}`);

      if (this.API_KEY === 'demo_key') {
        return this.simulateWeatherData(0, 0, cityName);
      }

      // Code pour API réelle
      /*
      const response = await fetch(`${this.BASE_URL}/weather?q=${cityName}&appid=${this.API_KEY}&units=metric&lang=fr`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.parseWeatherResponse(data);
      */

      return this.simulateWeatherData(0, 0, cityName);
    } catch (error) {
      this.logger.error(`❌ Error fetching weather for city: ${error.message}`);
      return this.simulateWeatherData(0, 0, cityName);
    }
  }

  /**
   * 🎲 Simuler les données météo (pour la démo)
   */
  private simulateWeatherData(
    lat: number,
    lng: number,
    cityName?: string,
  ): WeatherData {
    const conditions = [
      {
        condition: 'sunny' as const,
        description: 'Ensoleillé',
        icon: '01d',
        temp: 25,
        humidity: 45,
        wind: 8,
      },
      {
        condition: 'cloudy' as const,
        description: 'Nuageux',
        icon: '03d',
        temp: 20,
        humidity: 65,
        wind: 12,
      },
      {
        condition: 'rainy' as const,
        description: 'Pluvieux',
        icon: '10d',
        temp: 16,
        humidity: 85,
        wind: 15,
      },
      {
        condition: 'windy' as const,
        description: 'Venteux',
        icon: '50d',
        temp: 18,
        humidity: 60,
        wind: 25,
      },
    ];

    // Sélectionner une condition aléatoire mais cohérente
    const seed = Math.abs(Math.sin(lat + lng)) * 1000;
    const conditionIndex = Math.floor(seed % conditions.length);
    const selectedCondition = conditions[conditionIndex];

    // Ajouter de la variabilité
    const tempVariation = (Math.random() - 0.5) * 10;
    const humidityVariation = (Math.random() - 0.5) * 20;
    const windVariation = (Math.random() - 0.5) * 10;

    const temperature = Math.round(selectedCondition.temp + tempVariation);
    const humidity = Math.max(
      20,
      Math.min(100, Math.round(selectedCondition.humidity + humidityVariation)),
    );
    const windSpeed = Math.max(
      0,
      Math.round(selectedCondition.wind + windVariation),
    );

    // Déterminer le nom de la ville
    let finalCityName = cityName;
    if (!finalCityName) {
      const cities = [
        'Paris',
        'Lyon',
        'Marseille',
        'Toulouse',
        'Nice',
        'Nantes',
        'Strasbourg',
        'Montpellier',
      ];
      finalCityName =
        cities[Math.floor(Math.abs(Math.sin(lat * lng)) * cities.length)];
    }

    return {
      temperature,
      feelsLike: temperature + Math.round((Math.random() - 0.5) * 4),
      description: selectedCondition.description,
      icon: selectedCondition.icon,
      iconUrl: `https://openweathermap.org/img/wn/${selectedCondition.icon}@2x.png`,
      humidity,
      windSpeed,
      cityName: finalCityName,
      condition: selectedCondition.condition,
    };
  }

  /**
   * 📊 Parser la réponse de l'API météo (pour usage futur avec vraie API)
   */
  private parseWeatherResponse(data: any): WeatherData {
    const condition = this.mapWeatherCondition(data.weather[0].main);

    return {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      iconUrl: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // m/s vers km/h
      cityName: data.name,
      condition,
    };
  }

  /**
   * 🗺️ Mapper les conditions météo de l'API vers nos conditions
   */
  private mapWeatherCondition(
    apiCondition: string,
  ): 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'windy' {
    const condition = apiCondition.toLowerCase();

    if (condition.includes('clear')) return 'sunny';
    if (condition.includes('cloud')) return 'cloudy';
    if (condition.includes('rain') || condition.includes('drizzle'))
      return 'rainy';
    if (condition.includes('snow')) return 'snowy';
    if (condition.includes('thunder')) return 'stormy';
    if (condition.includes('wind')) return 'windy';

    return 'cloudy'; // Par défaut
  }
}
