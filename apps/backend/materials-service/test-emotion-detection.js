// Simple test script for emotion detection
const testMessages = [
  'Bonjour, comment allez-vous ?', // Normal
  'C\'est vraiment nul ce service !', // Frustration
  'Je suis très déçu de cette livraison', // Frustration
  'Putain, c\'est de la merde !', // Colère
  'Tu es vraiment con !', // Colère
  'Ça me saoule vraiment 😤', // Frustration avec emoji
  'Je suis furieux 😠🤬', // Colère avec emoji
  'ARRÊTEZ DE FAIRE N\'IMPORTE QUOI !!!', // Colère (majuscules + ponctuation)
];

// Test local detection functions
const ANGER_WORDS = [
  'angry', 'anger', 'furious', 'rage', 'mad', 'outraged', 'pissed',
  'shit', 'fuck', 'damn', 'hell', 'crap', 'ass', 'bastard', 'bitch',
  'idiot', 'stupid', 'moron', 'hate', 'kill', 'destroy', 'die',
  'merde', 'putain', 'con', 'connard', 'connasse', 'idiot', 'imbécile',
  'nul', 'naze', 'crétin', 'abruti', 'salaud', 'enfoiré', 'salope',
  'chier', 'foutre', 'bordel', 'crever', 'tuer'
];

const FRUSTRATION_WORDS = [
  'bad', 'terrible', 'horrible', 'awful', 'worst', 'useless', 'pathetic',
  'ridiculous', 'unacceptable', 'disgusting', 'disappointed', 'frustrated',
  'annoyed', 'fed up', 'sick of', 'tired of', 'enough', 'stop',
  'mauvais', 'nul', 'horrible', 'inacceptable', 'décevant', 'frustrant',
  'agaçant', 'énervant', 'catastrophique', 'lamentable', 'pitoyable',
  'marre', 'assez', 'stop', 'arrête', 'arrêtez'
];

function detectNegativeWords(content) {
  const lowerMessage = content.toLowerCase();
  const words = lowerMessage.split(/\s+/);

  // Recherche exacte uniquement
  const angerMatches = ANGER_WORDS.filter(word => {
    return words.some(w => {
      const cleanWord = w.replace(/[^a-zàâäéèêëïîôöùûüÿç]/g, '');
      return cleanWord === word;
    }) || lowerMessage.includes(` ${word} `) || lowerMessage.startsWith(`${word} `) || lowerMessage.endsWith(` ${word}`);
  });

  const frustrationMatches = FRUSTRATION_WORDS.filter(word => {
    return words.some(w => {
      const cleanWord = w.replace(/[^a-zàâäéèêëïîôöùûüÿç]/g, '');
      return cleanWord === word;
    }) || lowerMessage.includes(` ${word} `) || lowerMessage.startsWith(`${word} `) || lowerMessage.endsWith(` ${word}`);
  });

  if (angerMatches.length > 0) {
    return {
      detected: true,
      emotion: 'angry',
      matchedWords: angerMatches,
      confidence: Math.min(95, 70 + (angerMatches.length * 20))
    };
  }

  if (frustrationMatches.length > 0) {
    return {
      detected: true,
      emotion: 'frustrated',
      matchedWords: frustrationMatches,
      confidence: Math.min(90, 60 + (frustrationMatches.length * 15))
    };
  }

  return { detected: false, emotion: null, matchedWords: [], confidence: 0 };
}

function detectEmojiEmotion(content) {
  const angerEmojis = ['😠', '🤬', '👿', '😤', '😡', '💢', '🗯️', '🔴', '🤯', '👺', '😾'];
  const frustrationEmojis = ['😩', '😫', '😒', '🙄', '😑', '🤦'];

  let angerCount = 0;
  let frustrationCount = 0;

  for (const emoji of angerEmojis) {
    const matches = (content.match(new RegExp(emoji, 'g')) || []).length;
    angerCount += matches;
  }

  for (const emoji of frustrationEmojis) {
    const matches = (content.match(new RegExp(emoji, 'g')) || []).length;
    frustrationCount += matches;
  }

  if (angerCount > 0) {
    return { emotion: 'angry', confidence: Math.min(98, 85 + (angerCount * 5)) };
  }

  if (frustrationCount > 0) {
    return { emotion: 'frustrated', confidence: Math.min(95, 80 + (frustrationCount * 5)) };
  }

  return null;
}

console.log('🧪 Test de détection d\'émotions:');
console.log('=====================================');

testMessages.forEach((message, index) => {
  console.log(`\n${index + 1}. "${message}"`);
  
  const wordDetection = detectNegativeWords(message);
  const emojiDetection = detectEmojiEmotion(message);
  
  if (wordDetection.detected) {
    console.log(`   📝 Mots: ${wordDetection.emotion} (${wordDetection.confidence}%) - ${wordDetection.matchedWords.join(', ')}`);
  }
  
  if (emojiDetection) {
    console.log(`   😀 Emoji: ${emojiDetection.emotion} (${emojiDetection.confidence}%)`);
  }
  
  if (!wordDetection.detected && !emojiDetection) {
    console.log(`   ✅ Normal - Aucun problème détecté`);
  }
});

console.log('\n🎯 Test terminé!');