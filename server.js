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

// Clean, variable-driven connection configuration
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Active.`));