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

// Friendly home greeting route to clear the "Cannot GET /" message
app.get('/', (req, res) => {
  res.send("🚀 Manivae Skincare Brain Server is Running Live!");
});

const SUPABASE_URL = "https://aolrjwfcsppyxbctrdvk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbHJqd2Zjc3BweXhiY3RyZHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MzcwMjUsImV4cCI6MjA5NTAxMzAyNX0.NSFI1UI5JIsqm2nssuXeOxzRrmTBsdEw1Gk6kqghzCY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.post('/api/recommendations', async (req, res) => {
  try {
    const { data: inventory, error: dbError } = await supabase
      .from('product_taxonomy')
      .select('*');

    if (dbError) {
      return res.status(500).json({ error: "Supabase error: " + dbError.message });
    }

    const processedProducts = inventory.map(item => {
      return { ...item, runningScore: 95 };
    });

    return res.json({
      meta: { clashShieldActive: false, stockAutopilotTriggered: false },
      products: processedProducts
    });

  } catch (err) {
    return res.status(500).json({ error: "Runtime crash: " + err.message });
  }
});

app.options('*', cors());

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Active.`));