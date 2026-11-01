/**
 * foodBridge-AI: Comprehensive End-to-End Test Suite
 * 
 * Tests and verifies:
 * 1. Health check endpoint & PostgreSQL foodbridge_db connection
 * 2. User Authentication (JWT issuance, Role validation)
 * 3. AI Food Freshness & Shelf-Life Prediction Service
 * 4. ESG Impact Analytics Engine
 * 5. Food Donation Creation with AI Spoilage Risk
 * 6. Volunteer Pickup Claim Workflow
 * 7. Secure 6-digit OTP Generation & Receiver Handoff Verification
 * 8. Real-time Notification Dispatch
 */

const { app, server } = require('./server');
const db = require('./config/db');
const { predictFoodFreshness } = require('./services/aiFreshnessService');
const { calculateMetricsFromKg } = require('./services/impactAnalyticsService');

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 Starting foodBridge-AI Enterprise Test Suite');
  console.log('================================================================');

  const PORT = 5001; // Temporary port for test runner if port 5000 is needed
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`[Test Server] Running on http://localhost:${PORT}`);

  const baseUrl = `http://localhost:${PORT}/api`;
  let passedCount = 0;
  let totalCount = 0;

  function assert(condition, message) {
    totalCount++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
    }
  }

  try {
    // TEST 1: Health Check
    console.log('\n--- 1. Testing Health Check & Database Connection ---');
    const healthRes = await fetch(`${baseUrl}/health`).then((r) => r.json());
    assert(healthRes.status === 'OK', 'Health check returns OK status');
    assert(healthRes.database.includes('foodbridge_db'), 'Connected to foodbridge_db PostgreSQL');

    // TEST 2: AI Freshness Prediction Engine Unit Tests
    console.log('\n--- 2. Testing AI Food Freshness & Shelf-Life Prediction ---');
    const freshCooked = predictFoodFreshness({
      foodType: 'Cooked Food',
      cookedAt: new Date(),
      storageType: 'Hot Held',
      quantityKg: 20,
    });
    assert(freshCooked.freshnessScore > 85, `Hot Held cooked food has high initial freshness (${freshCooked.freshnessScore}%)`);
    assert(freshCooked.spoilageRisk === 'LOW', 'Fresh cooked food has LOW spoilage risk');
    assert(freshCooked.shelfLifeHours > 0, `Remaining shelf life predicted: ${freshCooked.shelfLifeHours} hrs`);

    const agedRice = predictFoodFreshness({
      foodType: 'Rice',
      cookedAt: new Date(Date.now() - 4.5 * 3600 * 1000), // Cooked 4.5 hrs ago
      storageType: 'Room Temperature',
      quantityKg: 10,
    });
    assert(agedRice.spoilageRisk === 'CRITICAL' || agedRice.spoilageRisk === 'HIGH', `Aged room temp rice flagged with ${agedRice.spoilageRisk} risk`);
    assert(agedRice.urgencyLevel === 'CRITICAL', 'Aged rice assigned CRITICAL dispatch urgency');

    // TEST 3: ESG Impact Analytics Engine
    console.log('\n--- 3. Testing ESG Impact Analytics Calculation Engine ---');
    const esgSample = calculateMetricsFromKg(100);
    assert(esgSample.foodSavedKg === 100, 'Food saved matches 100 kg');
    assert(esgSample.mealsServed === 250, '100 kg converts to 250 nutritional meals');
    assert(esgSample.co2OffsetKg === 250, '100 kg food diversion offsets 250 kg CO₂ equivalent');
    assert(esgSample.waterSavedLiters === 100000, 'Conserves 100,000 Liters of agricultural virtual water');

    const platformEsg = await fetch(`${baseUrl}/analytics/platform`).then((r) => r.json());
    assert(platformEsg.success === true, 'Platform ESG analytics returned successfully');
    assert(platformEsg.data.totalDonations >= 0, `Total donations registered in platform: ${platformEsg.data.totalDonations}`);

    // TEST 4: Authentication & Roles
    console.log('\n--- 4. Testing Authentication & Role-Based Access Control ---');
    // Login as Donor
    const donorLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'donor@foodbridge.org', password: 'password123', role: 'donor' }),
    }).then((r) => r.json());
    assert(donorLoginRes.success === true && donorLoginRes.token, 'Donor login successful with JWT');
    const donorToken = donorLoginRes.token;

    // Login as Volunteer
    const volLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'volunteer@foodbridge.org', password: 'password123', role: 'volunteer' }),
    }).then((r) => r.json());
    assert(volLoginRes.success === true && volLoginRes.token, 'Volunteer login successful with JWT');
    const volunteerToken = volLoginRes.token;

    // Login as Receiver / NGO
    const recLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'receiver@foodbridge.org', password: 'password123', role: 'ngo' }),
    }).then((r) => r.json());
    assert(recLoginRes.success === true && recLoginRes.token, 'Receiver login successful with JWT');
    const receiverToken = recLoginRes.token;

    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@foodbridge.org', password: 'password123', role: 'admin' }),
    }).then((r) => r.json());
    assert(adminLoginRes.success === true && adminLoginRes.token, 'Admin login succeeds with seeded administrator credentials');
    const adminToken = adminLoginRes.token;

    // Verify RBAC protection: Volunteer cannot list a donation
    const forbiddenRes = await fetch(`${baseUrl}/donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${volunteerToken}`,
      },
      body: JSON.stringify({ name: 'Unauthorized Food', quantity: '5 kg', type: 'Cooked Food', expiry: new Date(), location: 'Pune' }),
    });
    assert(forbiddenRes.status === 403, 'RBAC prevents volunteer from posting food donations (HTTP 403)');

    const adminRegistrationRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Public Admin', email: `admin-${Date.now()}@example.org`, password: 'password123', role: 'ADMIN' }),
    });
    assert(adminRegistrationRes.status === 403, 'Public registration cannot create administrator accounts');

    const invalidRegistrationPayloads = [
      { name: 'Invalid Email', email: 'not-an-email', password: 'password123', role: 'DONOR', city: 'Pune' },
      { name: 'Invalid Phone', email: `phone-${Date.now()}@example.org`, password: 'password123', role: 'DONOR', phone: '98765abc10', city: 'Pune' },
      { name: 'Invalid City', email: `city-${Date.now()}@example.org`, password: 'password123', role: 'DONOR', phone: '9876543210', city: 'Pune4' },
    ];
    for (const payload of invalidRegistrationPayloads) {
      const invalidRegistrationRes = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const invalidField = payload.email === 'not-an-email' ? 'email' : payload.city === 'Pune4' ? 'city' : 'phone';
      assert(invalidRegistrationRes.status === 400, `Registration rejects invalid ${invalidField}`);
    }

    const publicInboxRes = await fetch(`${baseUrl}/contact`);
    assert(publicInboxRes.status === 401, 'Contact inbox requires authentication');

    const adminInboxRes = await fetch(`${baseUrl}/contact`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminInboxRes.status === 200, 'Admin can access the contact inbox');

    const publicSystemRes = await fetch(`${baseUrl}/analytics/system`);
    assert(publicSystemRes.status === 401, 'System telemetry requires administrator authentication');

    // TEST 5: Create Donation as Donor
    console.log('\n--- 5. Testing Food Donation Creation with AI Freshness ---');
    const donationRes = await fetch(`${baseUrl}/donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorToken}`,
      },
      body: JSON.stringify({
        name: 'Freshly Prepared Dal Khichdi',
        quantity: '15 kg',
        type: 'Cooked Food',
        expiry: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
        location: 'Camp Pune',
        description: 'Nutritious hot meal prepared under FSSAI certified standards.',
        storageType: 'Hot Held',
      }),
    }).then((r) => r.json());
    assert(donationRes.success === true, 'Donation created successfully');
    assert(donationRes.donation.freshness_score >= 80, `AI Freshness computed dynamically: ${donationRes.donation.freshness_score}%`);
    const newDonationId = donationRes.donation.id;

    const requestFoodRes = await fetch(`${baseUrl}/receivers/request-food/${newDonationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receiverToken}`,
      },
      body: JSON.stringify({ neededPeopleCount: 20, notes: 'Lunch service' }),
    }).then((r) => r.json());
    assert(requestFoodRes.success === true, 'Receiver request is persisted');

    const pendingRequestsRes = await fetch(`${baseUrl}/receivers/my-requests`, {
      headers: { Authorization: `Bearer ${receiverToken}` },
    }).then((r) => r.json());
    const pendingRequest = pendingRequestsRes.requests.find((request) => request.id === newDonationId);
    assert(pendingRequest?.status === 'REQUESTED', 'Pending food request appears immediately in receiver My Requests');

    // TEST 6: Volunteer Claims Pickup & OTP Generation Workflow
    console.log('\n--- 6. Testing Volunteer Pickup Claim & OTP Generation ---');
    const claimRes = await fetch(`${baseUrl}/volunteers/claim-pickup/${newDonationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${volunteerToken}`,
      },
      body: JSON.stringify({}),
    }).then((r) => r.json());
    assert(claimRes.success === true, 'Volunteer claimed pickup successfully');
    assert(claimRes.delivery && !claimRes.delivery.otp_code, 'Volunteer response does not disclose receiver handoff OTP');
    const deliveryId = claimRes.delivery.id;

    const assignedRequestsRes = await fetch(`${baseUrl}/receivers/my-requests`, {
      headers: { Authorization: `Bearer ${receiverToken}` },
    }).then((r) => r.json());
    const assignedRequest = assignedRequestsRes.requests.find((request) => request.id === newDonationId);
    assert(assignedRequest?.volunteer_name === 'Rahul Sharma', 'Accepted request shows the assigned volunteer');
    assert(assignedRequest?.accepted_at && assignedRequest?.estimated_delivery_at, 'Accepted request shows acceptance time and delivery ETA');

    const receiverOtpRes = await fetch(`${baseUrl}/receivers/delivery-otp/${deliveryId}`, {
      headers: { Authorization: `Bearer ${receiverToken}` },
    }).then((r) => r.json());
    const generatedOtp = receiverOtpRes.otpCode;
    assert(receiverOtpRes.success === true && /^\d{6}$/.test(generatedOtp), 'Receiver can retrieve the active six-digit handoff OTP');

    // TEST 7: OTP Verification Workflow
    console.log('\n--- 7. Testing Receiver Handoff OTP Verification ---');
    // Attempt invalid OTP
    const invalidOtpRes = await fetch(`${baseUrl}/volunteers/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${volunteerToken}`,
      },
      body: JSON.stringify({ deliveryId, otpCode: '000000' }),
    }).then((r) => r.json());
    assert(invalidOtpRes.success === false, 'Invalid OTP was rejected');

    // Verify correct OTP
    const validOtpRes = await fetch(`${baseUrl}/volunteers/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${volunteerToken}`,
      },
      body: JSON.stringify({ deliveryId, otpCode: generatedOtp, feedback: 'Hot and delicious!', rating: 5 }),
    }).then((r) => r.json());
    assert(validOtpRes.success === true, 'Valid OTP confirmed chain-of-custody handoff');
    assert(validOtpRes.data.status === 'DELIVERED', 'Delivery status transitioned to DELIVERED');
    assert(validOtpRes.data.impact.mealsServed > 0, `ESG impact recorded: ${validOtpRes.data.impact.mealsServed} meals, ${validOtpRes.data.impact.co2OffsetKg} kg CO₂`);

    // TEST 8: Notifications Check
    console.log('\n--- 8. Testing Platform Notifications ---');
    const notifRes = await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${donorToken}` },
    }).then((r) => r.json());
    assert(notifRes.success === true, 'Notifications retrieved successfully');
    assert(notifRes.notifications.length > 0, `Donor received notifications: ${notifRes.notifications.length}`);

    console.log('\n================================================================');
    console.log(`🏁 Test Suite Summary: ${passedCount}/${totalCount} tests passed!`);
    console.log('================================================================');
  } catch (err) {
    console.error('Test suite runtime error:', err);
  } finally {
    await server.close();
    process.exit(passedCount === totalCount ? 0 : 1);
  }
}

runTestSuite();

