import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import { ConfigService } from '@nestjs/config';

export interface WeatherData {
  temperature: number; // ex: 23
  feelsLike: number; // ex: 21
  description: string; // ex: "ciel dégagé"
  icon: string; // ex: "01d"
  iconUrl: string; // URL complète OpenWeatherMap
  humidity: number; // ex: 65
  windSpeed: number; // ex: 15 (km/h)
  cityName: string; // ex: "Tunis"
  condition: string; // 'sunny'|'cloudy'|'rainy'|'stormy'|'snowy'|'windy'
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  // Cache météo: { key: "lat,lng", value: { data, expiresAt } }
  private readonly weatherCache = new Map<
    string,
    { data: WeatherData; expiresAt: number }
  >();

  private readonly OPENWEATHER_API_KEY: string | undefined;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor(
    @InjectModel('MaterialOrder') private orderModel: Model<any>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.OPENWEATHER_API_KEY = this.configService.get<string>(
      'OPENWEATHER_API_KEY',
    );
    if (!this.OPENWEATHER_API_KEY) {
      this.logger.warn(
        '⚠️ OPENWEATHER_API_KEY not configured. Weather feature will be disabled.',
      );
    } else {
      this.logger.log('✅ Weather Service initialized');
    }
  }

  async getWeatherForOrder(orderId: string): Promise<WeatherData | null> {
    if (!this.OPENWEATHER_API_KEY) {
      return null;
    }

    try {
      // 1. Récupérer la commande depuis MongoDB pour obtenir les coordonnées
      const order = await this.orderModel.findById(orderId).lean().exec();

      if (
        !order?.destinationCoordinates?.lat ||
        !order?.destinationCoordinates?.lng
      ) {
        this.logger.warn(`⚠️ No coordinates found for order ${orderId}`);
        return null;
      }

      const { lat, lng } = order.destinationCoordinates;

      // 2. Vérifier le cache (TTL: 30 minutes)
      const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
      const cached = this.weatherCache.get(cacheKey);

      if (cached && Date.now() < cached.expiresAt) {
        this.logger.log(`✅ Weather cache hit for ${cacheKey}`);
        return cached.data;
      }

      // 3. Appeler OpenWeatherMap
      const url =
        `https://api.openweathermap.org/data/2.5/weather` +
        `?lat=${lat}&lon=${lng}&appid=${this.OPENWEATHER_API_KEY}` +
        `&units=metric&lang=fr`;

      const response = await firstValueFrom(
        this.httpService.get(url).pipe(
          timeout(5000),
          catchError((error) => {
            this.logger.error(`❌ Weather API error: ${error.message}`);
            return of(null);
          }),
        ),
      );

      if (!response?.data) {
        return null;
      }

      const weatherData: WeatherData = {
        temperature: Math.round(response.data.main.temp),
        feelsLike: Math.round(response.data.main.feels_like),
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon,
        iconUrl: `https://openweathermap.org/img/wn/${response.data.weather[0].icon}@2x.png`,
        humidity: response.data.main.humidity,
        windSpeed: Math.round(response.data.wind.speed * 3.6), // m/s → km/h
        cityName: response.data.name,
        condition: this.mapWeatherCondition(response.data.weather[0].id),
      };

      // 4. Mettre en cache 30 minutes
      this.weatherCache.set(cacheKey, {
        data: weatherData,
        expiresAt: Date.now() + this.CACHE_TTL,
      });

      this.logger.log(
        `✅ Weather fetched for ${weatherData.cityName}: ${weatherData.temperature}°C`,
      );
      return weatherData;
    } catch (error) {
      this.logger.error(
        `❌ Weather fetch failed for order ${orderId}:`,
        error.message,
      );
      return null;
    }
  }

  private mapWeatherCondition(weatherId: number): string {
    if (weatherId >= 200 && weatherId < 300) return 'stormy';
    if (weatherId >= 300 && weatherId < 600) return 'rainy';
    if (weatherId >= 600 && weatherId < 700) return 'snowy';
    if (weatherId >= 700 && weatherId < 800) return 'windy';
    if (weatherId === 800) return 'sunny';
    if (weatherId > 800) return 'cloudy';
    return 'cloudy';
  }

  /**
   * Nettoyer le cache (appelé périodiquement si nécessaire)
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.weatherCache.entries()) {
      if (now >= value.expiresAt) {
        this.weatherCache.delete(key);
      }
    }
  }
}
