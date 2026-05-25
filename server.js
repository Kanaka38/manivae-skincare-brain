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

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

app.post('/api/recommendations', async (req, res) => {
  try {
    // Fallback assignment to catch missing keys safely
    const skin_type = req.body.skin_type || "";
    const concern = req.body.concern || "";
    const sensitivity = req.body.sensitivity || "";
    const climate = req.body.climate || "";
    const price_tier = req.body.price_tier || "";

    const { data: inventory, error: dbError } = await supabase
      .from('product_taxonomy')
      .select('*');

    if (dbError) {
      return res.status(500).json({ error: "Database error: " + dbError.message });
    }

    const processedProducts = inventory.map(product => {
      let score = 50; // Use a healthy baseline starting score

      // Safe Skin Type Check
      if (skin_type && product.target_skin_types) {
        const pSkin = String(product.target_skin_types).toLowerCase();
        if (pSkin.includes(skin_type.toLowerCase()) || pSkin.includes('all')) {
          score += 15;
        }
      }

      // Safe Concern Check
      if (concern && product.target_concerns) {
        if (String(product.target_concerns).toLowerCase().includes(concern.toLowerCase())) {
          score += 15;
        }
      }

      // Safe Sensitivity Check
      if (sensitivity && String(sensitivity).toLowerCase().includes('highly sensitive')) {
        const isSafe = product.is_sensitive_safe;
        if (isSafe === true || String(isSafe).toLowerCase() === 'true') {
          score += 10;
        } else {
          score -= 10;
        }
      } else {
        score += 10;
      }

      // Safe Climate Check
      if (climate && product.optimized_climates) {
        const pClimate = String(product.optimized_climates).toLowerCase();
        if (pClimate.includes(climate.toLowerCase()) || pClimate.includes('all')) {
          score += 5;
        }
      } else {
        score += 5;
      }

      // Safe Pricing Tier Check
      if (price_tier && product.price_tier) {
        if (String(product.price_tier).toLowerCase().includes(price_tier.toLowerCase())) {
          score += 5;
        }
      } else {
        score += 5;
      }

      if (score > 100) score = 100;
      if (score < 0) score = 0;

      return { ...product, runningScore: score };
    })
    .filter(product => product.runningScore >= 60)
    .sort((a, b) => b.runningScore - a.runningScore);

    return res.json({
      meta: { stockAutopilotTriggered: false, clashShieldActive: false },
      products: processedProducts
    });

  } catch (err) {
    return res.status(500).json({ error: "Processing runtime break: " + err.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

module.exports = app;