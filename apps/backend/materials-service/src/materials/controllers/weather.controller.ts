import { Controller, Get, Query, Logger } from '@nestjs/common';
import { WeatherService } from '../services/weather.service';

@Controller('weather')
export class WeatherController {
  private readonly logger = new Logger(WeatherController.name);

  constructor(private readonly weatherService: WeatherService) {}

  /**
   * 🌤️ Récupérer les données météo par coordonnées GPS
   */
  @Get()
  async getWeatherByCoordinates(
    @Query('lat') lat: string,
    @Query('lng') lng: string
  ) {
    this.logger.log(`🌍 Getting weather for coordinates: ${lat}, ${lng}`);
    
    try {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return {
          success: false,
          message: 'Coordonnées GPS invalides',
          weather: null
        };
      }

      const weather = await this.weatherService.getWeatherByCoordinates(latitude, longitude);
      
      return {
        success: true,
        message: 'Météo récupérée avec succès',
        weather
      };
    } catch (error) {
      this.logger.error(`❌ Error getting weather: ${error.message}`);
      return {
        success: false,
        message: 'Erreur lors de la récupération de la météo',
        weather: null
      };
    }
  }

  /**
   * 🏙️ Récupérer les données météo par nom de ville
   */
  @Get('city')
  async getWeatherByCity(@Query('city') city: string) {
    this.logger.log(`🏙️ Getting weather for city: ${city}`);
    
    try {
      if (!city) {
        return {
          success: false,
          message: 'Nom de ville requis',
          weather: null
        };
      }

      const weather = await this.weatherService.getWeatherByCity(city);
      
      return {
        success: true,
        message: 'Météo récupérée avec succès',
        weather
      };
    } catch (error) {
      this.logger.error(`❌ Error getting weather for city: ${error.message}`);
      return {
        success: false,
        message: 'Erreur lors de la récupération de la météo',
        weather: null
      };
    }
  }
}