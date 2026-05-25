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
    // 1. Ingest the 5 explicit user profile choices from Shopify
    const { skin_type, concern, sensitivity, climate, price_tier } = req.body;

    // 2. Fetch inventory rows from Supabase
    const { data: inventory, error: dbError } = await supabase
      .from('product_taxonomy')
      .select('*');

    if (dbError) {
      return res.status(500).json({ error: "Database error: " + dbError.message });
    }

    // 3. Run the complete deterministic calculation matrix
    const processedProducts = inventory.map(product => {
      let score = 0;
      let totalWeight = 0;

      // Rule 1: Skin Type Compatibility (Weight: 30 points)
      totalWeight += 30;
      if (product.target_skin_types && skin_type) {
        if (product.target_skin_types.toLowerCase().includes(skin_type.toLowerCase())) {
          score += 30;
        } else if (product.target_skin_types.toLowerCase().includes('all')) {
          score += 20; // Partial match for all-skin-type products
        }
      }

      // Rule 2: Primary Skin Concern Alignment (Weight: 30 points)
      totalWeight += 30;
      if (product.target_concerns && concern) {
        if (product.target_concerns.toLowerCase().includes(concern.toLowerCase())) {
          score += 30;
        }
      }

      // Rule 3: Barrier Sensitivity Threshold Guardrails (Weight: 15 points)
      totalWeight += 15;
      if (sensitivity && sensitivity.toLowerCase().includes('highly sensitive')) {
        // If user is sensitive, product must be explicitly safe for sensitive skin
        if (product.is_sensitive_safe && (product.is_sensitive_safe === true || product.is_sensitive_safe === 'true')) {
          score += 15;
        } else {
          score -= 10; // Penalty for harsh products on sensitive skin
        }
      } else {
        score += 15; // Resilient standard skin gets base points safely
      }

      // Rule 4: Local Regional Climate Optimization (Weight: 15 points)
      totalWeight += 15;
      if (product.optimized_climates && climate) {
        if (product.optimized_climates.toLowerCase().includes(climate.toLowerCase()) || product.optimized_climates.toLowerCase().includes('all')) {
          score += 15;
        }
      } else {
        score += 15;
      }

      // Rule 5: Pricing Tier Filtering Preference (Weight: 10 points)
      totalWeight += 10;
      if (product.price_tier && price_tier) {
        if (product.price_tier.toLowerCase().includes(price_tier.toLowerCase())) {
          score += 10;
        }
      } else {
        score += 10;
      }

      // Normalize score out of 100%
      let finalPercentage = Math.round((score / totalWeight) * 100);
      if (finalPercentage < 0) finalPercentage = 0;
      if (finalPercentage > 100) finalPercentage = 100;

      return {
        ...product,
        runningScore: finalPercentage
      };
    })
    // Filter out weak matches (< 70%) to maintain a highly premium personalization feel
    .filter(product => product.runningScore >= 70)
    // Sort highest matching routines right to the top
    .sort((a, b) => b.runningScore - a.runningScore);

    return res.json({
      meta: {
        engineStatus: "optimized",
        totalRecommended: processedProducts.length
      },
      products: processedProducts
    });

  } catch (err) {
    return res.status(500).json({ error: "Runtime processing error: " + err.message });
  }
});

app.options('*', cors());

module.exports = app;