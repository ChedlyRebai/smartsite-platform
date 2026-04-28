/**
 * Test script for AI Message Analysis
 * Run with: node test-ai-analysis.js
 */

const testMessages = [
  {
    message: "Bonjour, pourriez-vous me confirmer l'heure de livraison ?",
    senderRole: "site",
    expected: "NORMAL"
  },
  {
    message: "Où est ma livraison?! C'est inacceptable!",
    senderRole: "site",
    expected: "WARNING"
  },
  {
    message: "Vous êtes incompétents! Je vais annuler la commande!",
    senderRole: "site",
    expected: "CONFLICT"
  },
  {
    message: "Merci pour la livraison rapide 👍",
    senderRole: "supplier",
    expected: "NORMAL"
  },
  {
    message: "C'est urgent, j'ai besoin de cette livraison aujourd'hui",
    senderRole: "site",
    expected: "NORMAL or WARNING"
  }
];

async function testAnalysis() {
  console.log('🧪 Testing AI Message Analysis\n');
  console.log('='.repeat(60));

  for (const test of testMessages) {
    console.log(`\n📝 Message: "${test.message}"`);
    console.log(`👤 Role: ${test.senderRole}`);
    console.log(`🎯 Expected: ${test.expected}`);

    try {
      const response = await fetch('http://localhost:3002/chat/analyze-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: test.message,
          senderRole: test.senderRole
        })
      });

      const result = await response.json();

      if (result.success) {
        const analysis = result.analysis;
        console.log(`\n✅ Analysis Result:`);
        console.log(`   Status: ${analysis.status}`);
        console.log(`   Sentiment: ${analysis.sentiment}`);
        console.log(`   Emotion: ${analysis.emotion}`);
        console.log(`   Toxicity: ${analysis.toxicity}`);
        console.log(`   Conflict Level: ${analysis.conflict_level}`);
        console.log(`   Escalation Risk: ${analysis.escalation_risk}`);
        console.log(`   Allow Send: ${analysis.allow_send}`);
        console.log(`   Show Suggestion: ${analysis.show_suggestion}`);
        console.log(`   Confidence: ${analysis.confidence}%`);
        
        if (analysis.improved_message !== test.message) {
          console.log(`\n💡 Improved Message:`);
          console.log(`   "${analysis.improved_message}"`);
        }
        
        console.log(`\n📱 UI Message: "${analysis.ui_message}"`);
        console.log(`📋 Explanation: ${analysis.explanation}`);
      } else {
        console.log(`\n❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.log(`\n❌ Request failed: ${error.message}`);
    }

    console.log('\n' + '-'.repeat(60));
  }

  console.log('\n✅ Testing complete!\n');
}

// Run tests
testAnalysis().catch(console.error);
