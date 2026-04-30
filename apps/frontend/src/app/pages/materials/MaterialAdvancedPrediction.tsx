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
  { value: 'sunny', label: 'Ensoleillé' },
  { value: 'rainy', label: 'Pluvieux' },
  { value: 'cloudy', label: 'Nuageux' },
  { value: 'stormy', label: 'Orageux' },
  { value: 'snowy', label: 'Neigeux' },
  { value: 'windy', label: 'Venteux' },
];

const projectTypeOptions = [
  { value: 'residential', label: 'Résidentiel' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'industrial', label: 'Industriel' },
  { value: 'renovation', label: 'Rénovation' },
];

const dayOfWeekOptions = [
  { value: 0, label: 'Dimanche' },
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
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

  // Charger les informations du matériau et récupérer la météo automatiquement
  useEffect(() => {
    loadMaterialAndWeather();
  }, [materialId]);

  const loadMaterialAndWeather = async () => {
    setLoadingWeather(true);
    setWeatherError(null);
    
    try {
      console.log('🔍 Step 1: Récupération du matériau', materialId);
      // 1. Récupérer les informations du matériau
      const material = await materialService.getMaterialById(materialId);
      console.log('✅ Matériau récupéré:', material);
      
      // 2. Vérifier si le matériau est assigné à un chantier
      if (!material.siteId) {
        console.warn('⚠️ Matériau non assigné à un chantier');
        setWeatherError('Ce matériau n\'est pas encore assigné à un chantier');
        setLoadingWeather(false);
        return;
      }

      console.log('🔍 Step 2: Récupération du chantier', material.siteId);
      // 3. Récupérer les informations du chantier depuis l'endpoint materials
      const { data: siteData } = await axios.get(`/api/materials/sites/${material.siteId}`);
      console.log('✅ Données du chantier:', siteData);
      
      if (!siteData) {
        console.error('❌ Chantier introuvable');
        setWeatherError('Impossible de récupérer les informations du chantier');
        setLoadingWeather(false);
        return;
      }

      setMaterialSite(siteData);

      // 4. Vérifier si le chantier a des coordonnées GPS
      // Note: Le backend utilise "coordinates.lat" et "coordinates.lng"
      console.log('🔍 Step 3: Vérification des coordonnées GPS');
      console.log('Coordonnées trouvées:', siteData.coordinates);
      
      if (!siteData.coordinates?.lat || !siteData.coordinates?.lng) {
        console.warn('⚠️ Coordonnées GPS manquantes:', siteData.coordinates);
        setWeatherError('Le chantier assigné n\'a pas de coordonnées GPS configurées');
        setLoadingWeather(false);
        return;
      }

      console.log('🔍 Step 4: Récupération de la météo');
      console.log('Coordonnées utilisées:', {
        lat: siteData.coordinates.lat,
        lng: siteData.coordinates.lng
      });
      
      // 5. Récupérer la météo automatiquement via les coordonnées du chantier
      // IMPORTANT: Utiliser fetch() avec URL complète comme dans MaterialDetails (qui fonctionne)
      const weatherUrl = `http://localhost:3002/api/materials/weather?lat=${siteData.coordinates.lat}&lng=${siteData.coordinates.lng}`;
      console.log('🌍 Fetching weather from:', weatherUrl);
      
      const weatherResponse = await fetch(weatherUrl);
      
      if (!weatherResponse.ok) {
        console.error(`❌ Erreur HTTP météo: ${weatherResponse.status}`);
        throw new Error(`HTTP error! status: ${weatherResponse.status}`);
      }
      
      const weatherData = await weatherResponse.json();
      console.log('✅ Réponse API météo:', weatherData);

      if (weatherData.success && weatherData.weather) {
        setWeatherData(weatherData.weather);
        // Mettre à jour automatiquement le champ météo dans les features
        setFeatures(prev => ({
          ...prev,
          weather: weatherData.weather.condition
        }));
        toast.success(`Météo récupérée: ${weatherData.weather.description} (${weatherData.weather.temperature}°C)`);
        console.log('✅ Météo chargée et appliquée:', weatherData.weather);
      } else {
        console.error('❌ Réponse météo invalide:', weatherData);
        setWeatherError('Impossible de récupérer la météo pour ce chantier');
      }
    } catch (error: any) {
      console.error('❌ Error loading weather:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setWeatherError(error.response?.data?.message || error.message || 'Erreur lors de la récupération de la météo');
    } finally {
      setLoadingWeather(false);
    }
  };

  const handlePredict = async () => {
    setLoading(true);
    try {
      const result = await materialService.predictStockAdvanced(materialId, features);
      setPrediction(result);
      toast.success('Prédiction avancée générée!');
    } catch (error: any) {
      console.error('Error predicting:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la prédiction avancée');
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
          Prédiction Avancée (IA)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Affichage de la météo automatique */}
        {loadingWeather ? (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-blue-700">Récupération de la météo du chantier...</span>
          </div>
        ) : weatherError ? (
          <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
              <AlertCircle className="h-5 w-5" />
              Météo non disponible
            </div>
            <p className="text-red-600 text-sm">{weatherError}</p>
          </div>
        ) : weatherData && materialSite ? (
          <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CloudSun className="h-5 w-5 text-green-700" />
                <span className="font-semibold text-green-700">Météo Automatique</span>
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
                  <strong>Chantier:</strong> {materialSite.nom || materialSite.name || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CloudSun className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">
                  <strong>Météo:</strong> {weatherData.description}
                </span>
              </div>
              <div className="text-gray-700">
                <strong>Température:</strong> {weatherData.temperature}°C (ressenti {weatherData.feelsLike}°C)
              </div>
              <div className="text-gray-700">
                <strong>Condition:</strong> {weatherData.condition === 'sunny' ? 'Ensoleillé' : 
                  weatherData.condition === 'rainy' ? 'Pluvieux' : 
                  weatherData.condition === 'cloudy' ? 'Nuageux' : 
                  weatherData.condition === 'stormy' ? 'Orageux' : 
                  weatherData.condition === 'snowy' ? 'Neigeux' : 'Venteux'}
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2 italic">
              ✅ La météo a été automatiquement récupérée selon la localisation du chantier
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Heure (0-23)</Label>
            <Input
              type="number"
              min={0}
              max={23}
              value={features.hourOfDay}
              onChange={(e) => setFeatures({ ...features, hourOfDay: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>Jour de la semaine</Label>
            <select
              className="w-full p-2 border rounded-md"
              value={features.dayOfWeek}
              onChange={(e) => setFeatures({ ...features, dayOfWeek: parseInt(e.target.value) })}
            >
              {dayOfWeekOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Activité chantier (0-1)</Label>
            <Input
              type="number"
              step="0.1"
              min={0}
              max={1}
              value={features.siteActivityLevel}
              onChange={(e) => setFeatures({ ...features, siteActivityLevel: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>Météo {weatherData ? '(Auto-détectée)' : ''}</Label>
            <select
              className="w-full p-2 border rounded-md bg-gray-100"
              value={features.weather}
              disabled={true}
              title={weatherData ? 'Météo automatiquement récupérée du chantier' : 'En attente de la météo'}
            >
              {weatherOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {weatherData && (
              <p className="text-xs text-gray-500 mt-1">
                🔒 Champ verrouillé (météo automatique)
              </p>
            )}
          </div>
          <div className="col-span-2">
            <Label>Type de projet</Label>
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
              Prédiction...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Générer la prédiction avancée
            </>
          )}
        </Button>

        {prediction && (
          <div className={`mt-4 p-4 rounded-lg border-2 space-y-3 ${getStatusColor(prediction.status)}`}>
            <h3 className="font-bold text-lg">📊 Résultat pour {materialName}</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-white/80 rounded">
                <Calendar className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <div className="text-sm text-gray-600">Date rupture</div>
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
                <div className="text-sm text-gray-600">Commander</div>
                <div className="font-bold text-sm">{prediction.recommendedOrderQuantity} unités</div>
              </div>
              <div className={`p-3 bg-white/80 rounded ${getStatusTextColor(prediction.status)}`}>
                <AlertTriangle className="h-5 w-5 mx-auto mb-1" />
                <div className="text-sm text-gray-600">Statut</div>
                <div className="font-bold text-sm uppercase">
                  {prediction.status === 'critical'
                    ? 'CRITIQUE'
                    : prediction.status === 'warning'
                    ? 'ÉLEVÉ'
                    : 'FAIBLE'}
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