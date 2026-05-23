const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Global CORS configurations for absolute cross-domain permission
app.use(cors({
  origin: '*',
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'apikey']
}));
app.use(express.json());

// Root test route handler
app.get('/', (req, res) => {
  res.send("🚀 Manivae Skincare Brain Server is Running Live!");
});

// Direct pipeline linking your Vercel panel values straight to Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || "https://aolrjwfcsppyxbctrdvk.supabase.co",
  process.env.SUPABASE_KEY
);

app.post('/api/recommendations', async (req, res) => {
  try {
    const { data: inventory, error: dbError } = await supabase
      .from('product_taxonomy')
      .select('*');

    if (dbError) {
      return res.status(500).json({ error: "Supabase connection error: " + dbError.message });
    }

    const processedProducts = inventory.map(item => {
      return { ...item, runningScore: 95 };
    });

    return res.json({
      meta: { clashShieldActive: false, stockAutopilotTriggered: false },
      products: processedProducts
    });

  } catch (err) {
    return res.status(500).json({ error: "Runtime processing error: " + err.message });
  }
});

app.options('*', cors());

// Export the app architecture framework to Vercel's serverless engine directly
module.exports = app;