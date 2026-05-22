// MANIVAE CLOUD ENGINE ROUTER - NODE.JS & EXPRESS PRODUCTION CORE
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize connection safely to your live Supabase database instance
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Master Biochemical Safety Conflict Matrix Registry
const CORE_BIO_CONFLICT_REGISTRY = {
  "bha": ["vit_c", "retinol", "aha"],
  "aha": ["bha", "retinol", "vit_c"],
  "retinol": ["bha", "aha", "vit_c"],
  "vit_c": ["bha", "aha", "retinol"]
};

// LIVE CUSTOMER EVALUATION INTERCEPT HANDLER
app.post('/api/recommendations', async (req, res) => {
  try {
    const { skin, concern, sens, climate, priceTier } = req.body;

    // Fetch all active product records from your live Supabase spreadsheet grid
    const { data: inventory, error: invErr } = await supabase
      .from('product_taxonomy')
      .select('*');

    if (invErr) return res.status(500).json({ error: "Database lookup exception logged." });

    let validCandidatesList = [];
    let autopilotFailsafeTriggered = false;
    let activeClashDetected = false;

    // Process every single product row through your multi-dimensional vector formulas
    inventory.forEach(item => {
      // 1. Financial Bracket Matching Constraint Check
      if (item.price_tier !== priceTier) return;

      let score = 0;

      // 2. Base Skin Physiology Affinity Vector Accumulator
      if (item.target_skin === skin) score += 50;
      else if (item.target_skin === 'all') score += 25;
      else score -= 30;

      // 3. Multi-Concern Checklist Matrix Evaluation
      if (item.target_concerns && item.target_concerns.includes(concern)) {
        score += 50;
      }

      item.runningScore = score;

      if (score > 0) {
        if (item.stock_status === "out_of_stock") {
          autopilotFailsafeTriggered = true;
          return; // Drop out-of-stock items immediately to protect conversion rates
        }
        validCandidatesList.push(item);
      }
    });

    // Sort valid items cleanly by maximum weight values
    validCandidatesList.sort((a, b) => b.runningScore - a.runningScore);

    // 4. Run Active Biochemical Safety Logic Passes
    validCandidatesList.forEach(itemA => {
      validCandidatesList.forEach(itemB => {
        if (itemA.id !== itemB.id) {
          let clashes = CORE_BIO_CONFLICT_REGISTRY[itemA.active_ingredient];
          if (clashes && clashes.includes(itemB.active_ingredient)) activeClashDetected = true;
        }
      });
    });
    if (sens === 'high') activeClashDetected = true;

    // Return the completed calculation response right back to the shopper's storefront interface
    return res.json({
      meta: {
        clashShieldActive: activeClashDetected,
        stockAutopilotTriggered: autopilotFailsafeTriggered
      },
      products: validCandidatesList
    });

  } catch (err) {
    return res.status(500).json({ error: "Critical calculation runtime processing exception." });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Manivae engine executing smoothly on port ${PORT}`));