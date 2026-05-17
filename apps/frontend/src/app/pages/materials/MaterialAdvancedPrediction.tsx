import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Brain, Calendar, Package, AlertTriangle, Loader2, CloudSun, MapPin, AlertCircle } from 'lucide-react';
import materialService from '../../../services/materialService';
import { toast } from 'sonner';
import axios from 'axios';

interface MaterialAdvancedPredictionProps {
  materialId: string;
  materialName: string;
  onClose?: () => void;
}

const weatherOptions = [
  { value: 'sunny', label: 'Sunny' },
  { value: 'rainy', label: 'Rainy' },
  { value: 'cloudy', label: 'Cloudy' },
  { value: 'stormy', label: 'Stormy' },
  { value: 'snowy', label: 'Snowy' },
  { value: 'windy', label: 'Windy' },
];

const projectTypeOptions = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'renovation', label: 'Renovation' },
];

const dayOfWeekOptions = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function MaterialAdvancedPrediction({
  materialId,
  materialName,
  onClose,
}: MaterialAdvancedPredictionProps) {
  const [features, setFeatures] = useState({
    hourOfDay: new Date().getHours(),
    dayOfWeek: new Date().getDay(),
    siteActivityLevel: 0.7,
    weather: 'sunny',
    projectType: 'commercial',
  });
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [materialSite, setMaterialSite] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Load material information and automatically fetch weather
  useEffect(() => {
    loadMaterialAndWeather();
  }, [materialId]);

  const loadMaterialAndWeather = async () => {
    setLoadingWeather(true);
    setWeatherError(null);
    
    try {
      console.log('🔍 Step 1: Retrieving material', materialId);
      // 1. Retrieve material information
      const material = await materialService.getMaterialById(materialId);
      console.log('✅ Material retrieved:', material);
      
      // 2. Check if material is assigned to a site
      if (!material.siteId) {
        console.warn('⚠️ Material not assigned to a site');
        setWeatherError('This material is not yet assigned to a site');
        setLoadingWeather(false);
        return;
      }

      console.log('🔍 Step 2: Retrieving site', material.siteId);
      // 3. Retrieve site information from the materials endpoint
      const { data: siteData } = await axios.get(`/api/materials/sites/${material.siteId}`);
      console.log('✅ Site data:', siteData);
      
      if (!siteData) {
        console.error('❌ Site not found');
        setWeatherError('Unable to retrieve site information');
        setLoadingWeather(false);
        return;
      }

      setMaterialSite(siteData);

      // 4. Check if the site has GPS coordinates
      // Note: The backend uses "coordinates.lat" and "coordinates.lng"
      console.log('🔍 Step 3: Checking GPS coordinates');
      console.log('Coordinates found:', siteData.coordinates);
      
      if (!siteData.coordinates?.lat || !siteData.coordinates?.lng) {
        console.warn('⚠️ Missing GPS coordinates:', siteData.coordinates);
        setWeatherError('The assigned site does not have configured GPS coordinates');
        setLoadingWeather(false);
        return;
      }

      console.log('🔍 Step 4: Retrieving weather');
      console.log('Coordinates used:', {
        lat: siteData.coordinates.lat,
        lng: siteData.coordinates.lng
      });
      
      // 5. Automatically fetch weather via site coordinates
      const weatherUrl = `/api/weather?lat=${siteData.coordinates.lat}&lng=${siteData.coordinates.lng}`;
      console.log('🌍 Fetching weather from:', weatherUrl);
      
      const weatherResponse = await fetch(weatherUrl);
      
      if (!weatherResponse.ok) {
        console.error(`❌ Weather HTTP error: ${weatherResponse.status}`);
        throw new Error(`HTTP error! status: ${weatherResponse.status}`);
      }
      
      const weatherData = await weatherResponse.json();
      console.log('✅ Weather API response:', weatherData);

      if (weatherData.success && weatherData.weather) {
        setWeatherData(weatherData.weather);
        // Automatically update the weather field in features
        setFeatures(prev => ({
          ...prev,
          weather: weatherData.weather.condition
        }));
        toast.success(`Weather retrieved: ${weatherData.weather.description} (${weatherData.weather.temperature}°C)`);
        console.log('✅ Weather loaded and applied:', weatherData.weather);
      } else {
        console.error('❌ Invalid weather response:', weatherData);
        setWeatherError('Unable to retrieve weather for this site');
      }
    } catch (error: any) {
      console.error('❌ Error loading weather:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setWeatherError(error.response?.data?.message || error.message || 'Error while retrieving weather');
    } finally {
      setLoadingWeather(false);
    }
  };

  const handlePredict = async () => {
    setLoading(true);
    try {
      const result = await materialService.predictStockAdvanced(materialId, features);
      setPrediction(result);
      toast.success('Advanced prediction generated!');
    } catch (error: any) {
      console.error('Error predicting:', error);
      toast.error(error.response?.data?.message || 'Error during advanced prediction');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-100 border-red-300';
      case 'warning':
        return 'bg-yellow-100 border-yellow-300';
      default:
        return 'bg-green-100 border-green-300';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      default:
        return 'text-green-700';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-purple-50">
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <Brain className="h-5 w-5" />
          Advanced Prediction (AI)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Automatic weather display */}
        {loadingWeather ? (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-blue-700">Retrieving site weather...</span>
          </div>
        ) : weatherError ? (
          <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
              <AlertCircle className="h-5 w-5" />
              Weather unavailable
            </div>
            <p className="text-red-600 text-sm">{weatherError}</p>
          </div>
        ) : weatherData && materialSite ? (
          <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CloudSun className="h-5 w-5 text-green-700" />
                <span className="font-semibold text-green-700">Automatic Weather</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={loadMaterialAndWeather}
                disabled={loadingWeather}
              >
                <Loader2 className={`h-4 w-4 ${loadingWeather ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">
                  <strong>Site:</strong> {materialSite.nom || materialSite.name || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CloudSun className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">
                  <strong>Weather:</strong> {weatherData.description}
                </span>
              </div>
              <div className="text-gray-700">
                <strong>Temperature:</strong> {weatherData.temperature}°C (feels like {weatherData.feelsLike}°C)
              </div>
              <div className="text-gray-700">
                <strong>Condition:</strong> {weatherData.condition === 'sunny' ? 'Sunny' : 
                  weatherData.condition === 'rainy' ? 'Rainy' : 
                  weatherData.condition === 'cloudy' ? 'Cloudy' : 
                  weatherData.condition === 'stormy' ? 'Stormy' : 
                  weatherData.condition === 'snowy' ? 'Snowy' : 'Windy'}
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2 italic">
              ✅ Weather was automatically retrieved based on site location
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Hour (0-23)</Label>
            <Input
              type="number"
              min={0}
              max={23}
              value={features.hourOfDay}
              onChange={(e) => setFeatures({ ...features, hourOfDay: parseInt(e.target.value, 10) || 0 })}
            />
          </div>
          <div>
            <Label>Day of week</Label>
            <select
              className="w-full p-2 border rounded-md"
              value={features.dayOfWeek}
              onChange={(e) => setFeatures({ ...features, dayOfWeek: parseInt(e.target.value, 10) })}
            >
              {dayOfWeekOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Site activity (0-1)</Label>
            <Input
              type="number"
              step="0.1"
              min={0}
              max={1}
              value={features.siteActivityLevel}
              onChange={(e) => setFeatures({ ...features, siteActivityLevel: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>Weather {weatherData ? '(Auto-detected)' : ''}</Label>
            <select
              className="w-full p-2 border rounded-md bg-gray-100"
              value={features.weather}
              disabled={true}
              title={weatherData ? 'Weather automatically retrieved from site' : 'Waiting for weather'}
            >
              {weatherOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {weatherData && (
              <p className="text-xs text-gray-500 mt-1">
                🔒 Locked field (automatic weather)
              </p>
            )}
          </div>
          <div className="col-span-2">
            <Label>Project type</Label>
            <select
              className="w-full p-2 border rounded-md"
              value={features.projectType}
              onChange={(e) => setFeatures({ ...features, projectType: e.target.value })}
            >
              {projectTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          onClick={handlePredict}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Predicting...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Generate advanced prediction
            </>
          )}
        </Button>

        {prediction && (
          <div className={`mt-4 p-4 rounded-lg border-2 space-y-3 ${getStatusColor(prediction.status)}`}>
            <h3 className="font-bold text-lg">📊 Result for {materialName}</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-white/80 rounded">
                <Calendar className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <div className="text-sm text-gray-600">Rupture date</div>
                <div className="font-bold text-sm">
                  {new Date(prediction.estimatedRuptureDate).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                  })}
                </div>
              </div>
              <div className="p-3 bg-white/80 rounded">
                <Package className="h-5 w-5 mx-auto mb-1 text-green-600" />
                <div className="text-sm text-gray-600">Order quantity</div>
                <div className="font-bold text-sm">{prediction.recommendedOrderQuantity} units</div>
              </div>
              <div className={`p-3 bg-white/80 rounded ${getStatusTextColor(prediction.status)}`}>
                <AlertTriangle className="h-5 w-5 mx-auto mb-1" />
                <div className="text-sm text-gray-600">Status</div>
                <div className="font-bold text-sm uppercase">
                  {prediction.status === 'critical'
                    ? 'CRITICAL'
                    : prediction.status === 'warning'
                    ? 'HIGH'
                    : 'LOW'}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-700 text-center">
              {prediction.message}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}