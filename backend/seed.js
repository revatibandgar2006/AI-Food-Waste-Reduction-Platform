/**
 * foodBridge-AI: Comprehensive Database Seeder Script
 * 
 * Populates realistic enterprise demonstration data across:
 * - platform_users (DONOR, VOLUNTEER, RECEIVER, ADMIN)
 * - donor_profiles, volunteer_profiles, receiver_profiles
 * - food_donations (with AI Freshness analysis metrics)
 * - volunteer_pickups & food_deliveries (with OTP verification records)
 * - platform_notifications
 */

const bcrypt = require('bcryptjs');
const db = require('./config/db');
const { predictFoodFreshness } = require('./services/aiFreshnessService');
const { calculateMetricsFromKg } = require('./services/impactAnalyticsService');

async function seedDatabase({ allowReset = true } = {}) {
  console.log('[Seeder] Starting foodBridge-AI test data initialization...');

  try {
    // Reset only when explicitly requested; normal seeding preserves user data.
    if (allowReset && process.env.SEED_RESET === 'true') {
      await db.query('TRUNCATE TABLE platform_notifications, food_deliveries, volunteer_pickups, food_donations, receiver_profiles, volunteer_profiles, donor_profiles, platform_users RESTART IDENTITY CASCADE');
      console.log('[Seeder] Existing records cleared by SEED_RESET=true.');
    }

    const defaultPassword = 'password123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    // 2. Insert Platform Users
    const usersData = [
      {
        name: 'Hotel Taj Management',
        email: 'donor@foodbridge.org',
        phone: '9876543210',
        address: '12 Bund Garden Road, Camp',
        city: 'Pune',
        role: 'DONOR',
      },
      {
        name: 'Green Leaf Caterers',
        email: 'kitchen@greenleaf.com',
        phone: '9822012345',
        address: 'FC Road, Deccan Gymkhana',
        city: 'Pune',
        role: 'DONOR',
      },
      {
        name: 'Rahul Sharma',
        email: 'volunteer@foodbridge.org',
        phone: '9890112233',
        address: 'Kothrud, Near Metro Station',
        city: 'Pune',
        role: 'VOLUNTEER',
      },
      {
        name: 'Sneha Patil',
        email: 'sneha@foodbridge.org',
        phone: '9765432109',
        address: 'Viman Nagar, Pune',
        city: 'Pune',
        role: 'VOLUNTEER',
      },
      {
        name: 'Hope Shelter Foundation',
        email: 'receiver@foodbridge.org', // Also alias for ngo
        phone: '9823456789',
        address: 'Station Road, Pune Camp',
        city: 'Pune',
        role: 'RECEIVER',
      },
      {
        name: 'Seva Annapurna Orphanage',
        email: 'ngo@foodbridge.org',
        phone: '9812345670',
        address: 'Near Sarasbaug, Swargate',
        city: 'Pune',
        role: 'RECEIVER',
      },
      {
        name: 'System Admin',
        email: 'admin@foodbridge.org',
        phone: '9999999999',
        address: 'HQ Cyber City',
        city: 'Pune',
        role: 'ADMIN',
      },
    ];

    const userMap = {};

    for (const u of usersData) {
      const res = await db.query(
        `INSERT INTO platform_users (name, email, password_hash, phone, address, city, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email) DO NOTHING
         RETURNING id, name, email, role`,
        [u.name, u.email, passwordHash, u.phone, u.address, u.city, u.role]
      );
      const user = res.rows[0] || (await db.query(
        'SELECT id, name, email, role FROM platform_users WHERE email = $1',
        [u.email]
      )).rows[0];
      userMap[u.email] = user;
    }
    console.log(`[Seeder] Seeded ${Object.keys(userMap).length} platform users.`);

    // 3. Seed Donor Profiles
    await db.query(
      `INSERT INTO donor_profiles (user_id, organization_name, donor_type, fssai_license, operating_hours, contact_person, total_donations_count, total_kg_donated)
      VALUES 
      ($1, 'Taj Luxury Dining & Banquets', 'HOTEL', 'FSSAI-MH-2023-88910', '09:00 - 23:00', 'Mr. Amit Joshi', 14, 280.00),
      ($2, 'Green Leaf Caterers Pune', 'CATERER', 'FSSAI-MH-2024-44219', '10:00 - 22:00', 'Mrs. Rekha Rao', 8, 145.00)
      ON CONFLICT (user_id) DO NOTHING`,
      [userMap['donor@foodbridge.org'].id, userMap['kitchen@greenleaf.com'].id]
    );

    // 4. Seed Volunteer Profiles
    await db.query(
      `INSERT INTO volunteer_profiles (user_id, vehicle_type, vehicle_number, is_available, deliveries_completed, badge_level, volunteer_hours, rating)
       VALUES 
       ($1, 'MOTORCYCLE', 'MH-12-AB-1234', true, 18, 'GOLD', 36.5, 4.95),
      ($2, 'CAR', 'MH-12-CD-5678', true, 7, 'SILVER', 14.0, 4.88)
      ON CONFLICT (user_id) DO NOTHING`,
      [userMap['volunteer@foodbridge.org'].id, userMap['sneha@foodbridge.org'].id]
    );

    // 5. Seed Receiver Profiles
    await db.query(
      `INSERT INTO receiver_profiles (user_id, organization_name, receiver_type, capacity_people, dietary_preferences, operating_license, total_meals_received, total_kg_received)
       VALUES 
       ($1, 'Hope Shelter Foundation', 'SHELTER', 80, 'ALL', 'NGO-REG-MH-5521', 420, 168.00),
      ($2, 'Seva Annapurna Orphanage Home', 'ORPHANAGE', 45, 'VEG', 'NGO-REG-MH-1192', 260, 104.00)
      ON CONFLICT (user_id) DO NOTHING`,
      [userMap['receiver@foodbridge.org'].id, userMap['ngo@foodbridge.org'].id]
    );

    // 6. Seed Food Donations with AI Freshness computation
    const now = new Date();
    const donor1Id = userMap['donor@foodbridge.org'].id;
    const donor2Id = userMap['kitchen@greenleaf.com'].id;

    const sampleDonations = [
      {
        donorId: donor1Id,
        name: 'Hyderabadi Vegetable Biryani & Raita',
        type: 'Cooked Food',
        quantity: '20 kg',
        quantityKg: 20.0,
        servings: 50,
        storageType: 'Hot Held',
        cookedAt: new Date(now.getTime() - 1.5 * 3600 * 1000), // Cooked 1.5 hours ago
        expiry: new Date(now.getTime() + 4 * 3600 * 1000),
        location: 'Hotel Taj, Bund Garden Road, Pune Camp',
        desc: 'Freshly prepared executive banquet surplus. Warm and hygienic in sealed insulated thermal containers.',
        status: 'AVAILABLE',
      },
      {
        donorId: donor2Id,
        name: 'Whole Wheat Chapatis & Dal Makhani',
        type: 'Cooked Food',
        quantity: '15 kg',
        quantityKg: 15.0,
        servings: 38,
        storageType: 'Room Temperature',
        cookedAt: new Date(now.getTime() - 2.5 * 3600 * 1000),
        expiry: new Date(now.getTime() + 2 * 3600 * 1000),
        location: 'Green Leaf Caterers, FC Road',
        desc: 'Pure vegetarian meal. Packed in aluminum foil trays ready for quick delivery.',
        status: 'AVAILABLE',
      },
      {
        donorId: donor1Id,
        name: 'Freshly Baked Artisanal Bread & Pav',
        type: 'Bread',
        quantity: '12 kg (40 packets)',
        quantityKg: 12.0,
        servings: 30,
        storageType: 'Room Temperature',
        cookedAt: new Date(now.getTime() - 4 * 3600 * 1000),
        expiry: new Date(now.getTime() + 24 * 3600 * 1000),
        location: 'Hotel Taj Bakery Section',
        desc: 'Fresh morning batch of bread loaves, buns and dinner rolls. Dry & sealed.',
        status: 'AVAILABLE',
      },
      {
        donorId: donor2Id,
        name: 'Fresh Farm Apples & Seasonal Oranges',
        type: 'Fruits',
        quantity: '10 kg',
        quantityKg: 10.0,
        servings: 25,
        storageType: 'Room Temperature',
        cookedAt: new Date(now.getTime() - 12 * 3600 * 1000),
        expiry: new Date(now.getTime() + 48 * 3600 * 1000),
        location: 'Green Leaf Kitchen Store, Deccan',
        desc: 'Crisp nutritious whole fruit surplus from morning corporate breakfast setup.',
        status: 'AVAILABLE',
      },
      {
        donorId: donor1Id,
        name: 'Paneer Butter Masala & Jeera Rice',
        type: 'Cooked Food',
        quantity: '25 kg',
        quantityKg: 25.0,
        servings: 60,
        storageType: 'Hot Held',
        cookedAt: new Date(now.getTime() - 5 * 3600 * 1000),
        expiry: new Date(now.getTime() + 1 * 3600 * 1000),
        location: 'Hotel Taj, Pune Camp',
        desc: 'Completed rescue delivered to Hope Shelter Foundation.',
        status: 'DELIVERED',
      },
      {
        donorId: donor2Id,
        name: 'Steamed Rice & Sambar',
        type: 'Rice',
        quantity: '18 kg',
        quantityKg: 18.0,
        servings: 45,
        storageType: 'Room Temperature',
        cookedAt: new Date(now.getTime() - 1.0 * 3600 * 1000),
        expiry: new Date(now.getTime() + 3.0 * 3600 * 1000),
        location: 'Green Leaf Caterers, Deccan',
        desc: 'Active rescue currently in transit with volunteer Rahul Sharma.',
        status: 'PICKED_UP',
      },
    ];

    const insertedDonations = [];

    for (const d of sampleDonations) {
      const existing = await db.query(
        'SELECT * FROM food_donations WHERE donor_id = $1 AND food_name = $2 ORDER BY id LIMIT 1',
        [d.donorId, d.name]
      );
      if (existing.rows.length > 0) {
        insertedDonations.push(existing.rows[0]);
        continue;
      }

      const ai = predictFoodFreshness({
        foodType: d.type,
        cookedAt: d.cookedAt,
        storageType: d.storageType,
        quantityKg: d.quantityKg,
      });

      const res = await db.query(
        `INSERT INTO food_donations (
          donor_id, food_name, food_type, quantity_display, quantity_kg, servings_estimate,
          storage_type, cooked_at, expiry_time, pickup_location, description,
          status, freshness_score, spoilage_risk, shelf_life_hours, ai_recommendation, urgency_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *`,
        [
          d.donorId,
          d.name,
          d.type,
          d.quantity,
          d.quantityKg,
          d.servings,
          d.storageType,
          d.cookedAt,
          d.expiry,
          d.location,
          d.desc,
          d.status,
          ai.freshnessScore,
          ai.spoilageRisk,
          ai.shelfLifeHours,
          ai.aiRecommendation,
          ai.urgencyLevel,
        ]
      );
      insertedDonations.push(res.rows[0]);
    }
    console.log(`[Seeder] Seeded ${insertedDonations.length} food donations with AI predictions.`);

    // 7. Seed Deliveries and Pickups
    const volunteer1Id = userMap['volunteer@foodbridge.org'].id;
    const receiver1Id = userMap['receiver@foodbridge.org'].id;
    const receiver2Id = userMap['ngo@foodbridge.org'].id;

    // Delivery 1: Historical DELIVERED donation (Paneer Butter Masala)
    const delivDonation = insertedDonations.find((x) => x.status === 'DELIVERED');
    if (delivDonation) {
      const impact = calculateMetricsFromKg(delivDonation.quantity_kg);
      const existingDelivery = await db.query('SELECT id FROM food_deliveries WHERE donation_id = $1 LIMIT 1', [delivDonation.id]);
      if (existingDelivery.rows.length === 0) {
        await db.query(
          `INSERT INTO volunteer_pickups (donation_id, volunteer_id, pickup_status, actual_pickup_time)
           VALUES ($1, $2, 'PICKED_UP', NOW() - INTERVAL '3 hours')`,
          [delivDonation.id, volunteer1Id]
        );

        await db.query(
          `INSERT INTO food_deliveries (
            donation_id, volunteer_id, receiver_id, delivery_address,
            otp_code, otp_expires_at, otp_verified, status, delivered_at,
            co2_saved_kg, water_saved_liters, receiver_feedback, receiver_rating
          ) VALUES (
            $1, $2, $3, 'Hope Shelter, Station Road, Pune',
            '384912', NOW() - INTERVAL '2 hours', true, 'DELIVERED', NOW() - INTERVAL '2 hours',
            $4, $5, 'Excellent quality food, served 60 children hot meals!', 5
          )`,
          [delivDonation.id, volunteer1Id, receiver1Id, impact.co2OffsetKg, impact.waterSavedLiters]
        );
      }
    }

    // Delivery 2: In-Transit delivery (Steamed Rice & Sambar) with active unverified OTP '749102'
    const transitDonation = insertedDonations.find((x) => x.status === 'PICKED_UP');
    if (transitDonation) {
      const existingDelivery = await db.query('SELECT id FROM food_deliveries WHERE donation_id = $1 LIMIT 1', [transitDonation.id]);
      if (existingDelivery.rows.length === 0) {
        await db.query(
          `INSERT INTO volunteer_pickups (donation_id, volunteer_id, pickup_status, actual_pickup_time)
           VALUES ($1, $2, 'PICKED_UP', NOW() - INTERVAL '20 minutes')`,
          [transitDonation.id, volunteer1Id]
        );

        await db.query(
          `INSERT INTO food_deliveries (
            donation_id, volunteer_id, receiver_id, delivery_address,
            otp_code, otp_expires_at, otp_verified, status
          ) VALUES (
            $1, $2, $3, 'Seva Annapurna Orphanage, Swargate, Pune',
            '749102', NOW() + INTERVAL '45 minutes', false, 'IN_TRANSIT'
          )`,
          [transitDonation.id, volunteer1Id, receiver2Id]
        );
      }
    }

    // 8. Seed Platform Notifications
    const notificationsList = [
      {
        userId: volunteer1Id,
        title: '🚨 High Priority Pickup Available',
        message: 'Whole Wheat Chapatis & Dal Makhani is available at FC Road. Urgency: CRITICAL.',
        type: 'DISPATCH',
      },
      {
        userId: receiver2Id,
        title: '🔐 Inbound Food Delivery OTP',
        message: 'Volunteer Rahul Sharma is arriving with Steamed Rice & Sambar. Your verification OTP is: 749102.',
        type: 'OTP',
      },
      {
        userId: donor1Id,
        title: '💚 Impact Milestone Achieved',
        message: 'Your past donation of Paneer Butter Masala rescued 25 kg of food and saved 62.5 kg CO₂!',
        type: 'ESG',
      },
    ];

    for (const n of notificationsList) {
      const existing = await db.query(
        'SELECT id FROM platform_notifications WHERE user_id = $1 AND title = $2 LIMIT 1',
        [n.userId, n.title]
      );
      if (existing.rows.length > 0) continue;
      await db.query(
        `INSERT INTO platform_notifications (user_id, title, message, type)
         VALUES ($1, $2, $3, $4)`,
        [n.userId, n.title, n.message, n.type]
      );
    }
    console.log(`[Seeder] Seeded initial notifications.`);

    console.log('===========================================================');
    console.log('✅ foodBridge-AI Database Seeded Successfully!');
    console.log('Demo Credentials for All Roles:');
    console.log('  🍱 Donor:     donor@foodbridge.org       / password123');
    console.log('  🚚 Volunteer: volunteer@foodbridge.org   / password123');
    console.log('  🏠 Receiver:  receiver@foodbridge.org    / password123');
    console.log('  🏠 NGO:       ngo@foodbridge.org         / password123');
    console.log('  🛡️ Admin:     admin@foodbridge.org       / password123');
    console.log('===========================================================');
  } catch (err) {
    console.error('[Seeder Error]:', err);
    throw err;
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedDatabase;
