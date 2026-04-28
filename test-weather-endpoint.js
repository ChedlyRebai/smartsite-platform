import axios from 'axios';

async function testWeatherEndpoint() {
  console.log('🧪 Test de l\'endpoint weather...\n');
  
  const lat = 36.8002068;
  const lng = 10.1857757;
  const url = `http://localhost:3002/api/materials/weather?lat=${lat}&lng=${lng}`;
  
  console.log(`📍 URL: ${url}\n`);
  
  try {
    const response = await axios.get(url);
    console.log('✅ Succès!');
    console.log('📊 Réponse:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Erreur:', error.response?.status, error.response?.statusText);
    console.error('📄 Message:', error.response?.data);
  }
}

testWeatherEndpoint();
