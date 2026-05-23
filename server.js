const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'apikey', 'x-client-info']
}));
app.use(express.json());

const SUPABASE_URL = "https://aolrjwfcsppyxbctrdvk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbHJqd2Zjc3BweXhiY3RyZHZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQzNzAyNSwiZXhwIjoyMDk1MDEzMDI1fQ.OtrjdAAeY_pkPlseeygrJNx1yJVle_Er32I5GSlOnYw";

// Define strict global connection parameter headers explicitly
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  global: {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  }
});

app.post('/api/recommendations', async (req, res) => {
  try {
    const { data: inventory, error: dbError } = await supabase
      .from('product_taxonomy')
      .select('*');

    if (dbError) {
      return res.status(500).json({ error: "Database Link Refusal: " + dbError.message });
    }

    const processedProducts = inventory.map(item => {
      return {
        ...item,
        runningScore: 95
      };
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
app.listen(PORT, () => console.log(`Gateway Online.`));
