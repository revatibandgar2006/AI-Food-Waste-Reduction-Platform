/**
 * foodBridge-AI: Intelligent Food Freshness & Shelf-life Prediction Service
 * 
 * Powered by microbiological spoilage kinetic models (Arrhenius temperature coefficients &
 * dynamic decay curves) adhering to FSSAI & WHO Codex Alimentarius guidelines.
 */

// Food type baseline characteristics
const FOOD_KINETICS = {
  'Cooked Food': {
    baselineHours: 5.0,
    perishabilityScore: 9,
    sporeRisk: 'Moderate (Staphylococcus, Clostridium)',
    optimalStorage: 'Hot hold >60°C or chill <4°C immediately',
  },
  'Rice': {
    baselineHours: 4.0,
    perishabilityScore: 10,
    sporeRisk: 'High (Bacillus cereus heat-stable enterotoxin risk)',
    optimalStorage: 'Consume or refrigerate within 2 hours of boiling',
  },
  'Dairy': {
    baselineHours: 4.5,
    perishabilityScore: 9,
    sporeRisk: 'High (Listeria, Lactic acidification)',
    optimalStorage: 'Strict cold-chain refrigeration below 4°C',
  },
  'Vegetables': {
    baselineHours: 60.0,
    perishabilityScore: 3,
    sporeRisk: 'Low (Aerobic fungal/wilting rate)',
    optimalStorage: 'Ventilated cool dry ambient or 8-10°C crisper',
  },
  'Fruits': {
    baselineHours: 72.0,
    perishabilityScore: 3,
    sporeRisk: 'Low (Ethylene ripening & enzymatic browning)',
    optimalStorage: 'Cool shaded area away from direct sunlight',
  },
  'Bread': {
    baselineHours: 48.0,
    perishabilityScore: 4,
    sporeRisk: 'Low (Retrogradation staling & mold spores)',
    optimalStorage: 'Airtight dry container at ambient 20-25°C',
  },
  'Packaged Food': {
    baselineHours: 168.0,
    perishabilityScore: 1,
    sporeRisk: 'Negligible if seal is intact',
    optimalStorage: 'Manufacturer sealed conditions away from moisture',
  },
  'Other': {
    baselineHours: 12.0,
    perishabilityScore: 6,
    sporeRisk: 'Standard mixed microbial risk',
    optimalStorage: 'Hygienic sealed container at safe temperature',
  },
};

const STORAGE_MODIFIERS = {
  'Frozen': { rateMultiplier: 0.05, label: 'Deep Freeze (-18°C)' },
  'Refrigerated': { rateMultiplier: 0.22, label: 'Cold Storage (2-5°C)' },
  'Hot Held': { rateMultiplier: 0.35, label: 'Hot Held (>60°C)' },
  'Room Temperature': { rateMultiplier: 1.0, label: 'Ambient Temperature (25-32°C)' },
};

/**
 * Predict freshness score, remaining shelf life, and dispatch urgency.
 *
 * @param {Object} params
 * @param {string} params.foodType
 * @param {string|Date} params.cookedAt
 * @param {string} [params.storageType='Room Temperature']
 * @param {number} [params.quantityKg=1]
 * @param {number} [params.ambientTempC=28]
 * @returns {Object} AI Prediction metrics & safety recommendations
 */
function predictFoodFreshness({
  foodType = 'Cooked Food',
  cookedAt = new Date(),
  storageType = 'Room Temperature',
  quantityKg = 1,
  ambientTempC = 28,
}) {
  const kinetics = FOOD_KINETICS[foodType] || FOOD_KINETICS['Cooked Food'];
  const storage = STORAGE_MODIFIERS[storageType] || STORAGE_MODIFIERS['Room Temperature'];

  const prepTime = new Date(cookedAt).getTime();
  const now = Date.now();
  const elapsedMs = Math.max(0, now - prepTime);
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  // Arrhenius Q10 approximation: reaction rates accelerate ~1.8x for each 10°C elevation above 20°C
  const tempExcess = Math.max(0, ambientTempC - 20);
  const tempAcceleration = Math.pow(1.8, tempExcess / 10);

  // Effective decay constant
  const effectiveDecayFactor = storage.rateMultiplier * (storageType === 'Room Temperature' ? tempAcceleration : 1.0);
  const nominalShelfLifeHours = kinetics.baselineHours / effectiveDecayFactor;

  // Remaining shelf-life in hours
  const remainingHours = Math.max(0, nominalShelfLifeHours - elapsedHours);

  // Exponential microbial stability curve: S(t) = 100 * exp(-lambda * (elapsed / nominal))
  const decayRatio = elapsedHours / Math.max(1, nominalShelfLifeHours);
  let freshnessScore = Math.max(0, Math.min(100, 100 * Math.exp(-1.4 * decayRatio)));
  freshnessScore = Math.round(freshnessScore * 10) / 10;

  // Determine Spoilage Risk & Dispatch Urgency
  let spoilageRisk = 'LOW';
  let urgencyLevel = 'NORMAL';
  let aiRecommendation = '';

  if (freshnessScore >= 80) {
    spoilageRisk = 'LOW';
    urgencyLevel = 'NORMAL';
    aiRecommendation = `Optimal freshness (${freshnessScore}%). Safe for standard dispatch. Recommended distribution within next ${Math.round(remainingHours)} hours to local shelters.`;
  } else if (freshnessScore >= 55) {
    spoilageRisk = 'MEDIUM';
    urgencyLevel = 'HIGH';
    aiRecommendation = `Moderate decay phase (${freshnessScore}%). Priority pickup recommended within ${Math.max(1, Math.round(remainingHours))} hours. Allocate to immediate hot meal distribution hubs.`;
  } else if (freshnessScore >= 25) {
    spoilageRisk = 'HIGH';
    urgencyLevel = 'CRITICAL';
    aiRecommendation = `CRITICAL WINDOW (${freshnessScore}%): Rapid consumption needed within ${Math.max(0.5, Math.round(remainingHours * 10) / 10)} hours. Immediate volunteer alert dispatched for rapid neighborhood handoff.`;
  } else {
    spoilageRisk = 'CRITICAL';
    urgencyLevel = 'CRITICAL';
    aiRecommendation = `SAFETY WARNING: Freshness threshold depleted (${freshnessScore}%). Do not serve as fresh meals. Redirect to aerobic composting or biomass diversion.`;
  }

  // Calculate projected optimal expiry date
  const projectedExpiry = new Date(prepTime + nominalShelfLifeHours * 3600 * 1000);

  return {
    freshnessScore,
    shelfLifeHours: Math.round(remainingHours * 10) / 10,
    spoilageRisk,
    urgencyLevel,
    aiRecommendation,
    projectedExpiry: projectedExpiry.toISOString(),
    safetyGuideline: kinetics.optimalStorage,
    sporeRiskAdvisory: kinetics.sporeRisk,
    storageEnvironment: storage.label,
    elapsedHours: Math.round(elapsedHours * 10) / 10,
    perishabilityIndex: kinetics.perishabilityScore,
  };
}

module.exports = {
  predictFoodFreshness,
  FOOD_KINETICS,
  STORAGE_MODIFIERS,
};

