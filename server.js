const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'apikey']
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.send("🚀 Manivae Skincare Brain Server is Running Live!");
});

const SUPABASE_URL = "https://aolrjwfcsppyxbctrdvk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbHJqd2Zjc3BweXhiY3RyZHZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQzNzAyNSwiZXhwIjoyMDk1MDEzMDI1fQ.OtrjdAAeY_pkPlseeygrJNx1yJVle_Er32I5GSlOnYw";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.post('/api/recommendations', async (req, res) => {
  try {
    const { skin_type, concern, sensitivity, climate, price_tier } = req.body;

    const { data: inventory, error: dbError } = await supabase
      .from('product_taxonomy')
      .select('*');

    if (dbError) {
      return res.status(500).json({ error: "Database error: " + dbError.message });
    }

    const processedProducts = inventory.map(product => {
      let score = 0;
      let totalWeight = 0;

      // Rule 1: Skin Type Compatibility (Weight: 30)
      totalWeight += 30;
      if (skin_type && product.target_skin_types) {
        const targetSkin = String(product.target_skin_types).toLowerCase();
        if (targetSkin.includes(skin_type.toLowerCase())) {
          score += 30;
        } else if (targetSkin.includes('all')) {
          score += 20;
        }
      }

      // Rule 2: Skin Concern Alignment (Weight: 30)
      totalWeight += 30;
      if (concern && product.target_concerns) {
        if (String(product.target_concerns).toLowerCase().includes(concern.toLowerCase())) {
          score += 30;
        }
      }

      // Rule 3: Barrier Sensitivity Threshold Guardrails (Weight: 15)
      totalWeight += 15;
      if (sensitivity && String(sensitivity).toLowerCase().includes('highly sensitive')) {
        if (product.is_sensitive_safe === true || String(product.is_sensitive_safe).toLowerCase() === 'true') {
          score += 15;
        } else {
          score -= 10;
        }
      } else {
        score += 15;
      }

      // Rule 4: Local Regional Climate Optimization (Weight: 15)
      totalWeight += 15;
      if (climate && product.optimized_climates) {
        const targetClimate = String(product.optimized_climates).toLowerCase();
        if (targetClimate.includes(climate.toLowerCase()) || targetClimate.includes('all')) {
          score += 15;
        }
      } else {
        score += 15;
      }

      // Rule 5: Pricing Tier Filtering Preference (Weight: 10)
      totalWeight += 10;
      if (price_tier && product.price_tier) {
        if (String(product.price_tier).toLowerCase().includes(price_tier.toLowerCase())) {
          score += 10;
        }
      } else {
        score += 10;
      }

      let finalPercentage = Math.round((score / totalWeight) * 100);
      if (finalPercentage < 0) finalPercentage = 0;
      if (finalPercentage > 100) finalPercentage = 100;

      return { ...product, runningScore: finalPercentage };
    })
    .filter(product => product.runningScore >= 70)
    .sort((a, b) => b.runningScore - a.runningScore);

    return res.json({
      meta: { engineStatus: "optimized", totalRecommended: processedProducts.length },
      products: processedProducts
    });

  } catch (err) {
    return res.status(500).json({ error: "Runtime processing error: " + err.message });
  }
});

app.options('*', cors());

module.exports = app;