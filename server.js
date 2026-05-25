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
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbHJqd2Zjc3BweXhiY3RyZHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MzcwMjUsImV4cCI6MjA5NTAxMzAyNX0.NSFI1UI5JIsqm2nssuXeOxzRrmTBsdEw1Gk6kqghzCY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.post('/api/recommendations', async (req, res) => {
  try {
    // 1. Grab user profile answers from Shopify request body
    const { skin_type, primary_concern } = req.body;

    // 2. Fetch inventory rows from Supabase
    const { data: inventory, error: dbError } = await supabase
      .from('product_taxonomy')
      .select('*');

    if (dbError) {
      return res.status(500).json({ error: "Database error: " + dbError.message });
    }

    // 3. Simple, fast deterministic scoring engine
    const processedProducts = inventory.map(product => {
      let score = 50; // Base score

      // Check skin type compatibility (assuming comma-separated string in DB, e.g., "Oily, Combination")
      if (product.target_skin_types && skin_type) {
        if (product.target_skin_types.toLowerCase().includes(skin_type.toLowerCase())) {
          score += 25;
        }
      }

      // Check primary concern compatibility
      if (product.target_concerns && primary_concern) {
        if (product.target_concerns.toLowerCase().includes(primary_concern.toLowerCase())) {
          score += 25;
        }
      }

      return {
        ...product,
        runningScore: score
      };
    })
    // Filter out low matches to keep recommendations premium
    .filter(product => product.runningScore >= 75)
    // Sort highest match percentage first
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