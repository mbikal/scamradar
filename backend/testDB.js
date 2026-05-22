require("dotenv").config({'path': '../.env'});
const mongoose = require("mongoose");
const Seller = require("./models/Seller");

async function testDatabase() {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // 2. Create a test seller
    const testSeller = new Seller({
      url: "https://facebook.com/test-seller-123",
      riskScore: 72,
      features: {
        accountAge: 45,
        followerCount: 1200,
        hasAddress: false,
        hasPhoneNumber: true,
        hasEmail: false,
        hasProfilePicture: true,
        hasDescription: false,
        isVerified: false,
        hasReviews: true,
        averageRating: 4.8,
        totalReviews: 3,
        negativeReviews: 0,
        copiedPhotos: true,
        totalPosts: 87,
        isMultiPlatform: false,
        hasCommentOff: true,
      },
      flagged: true,
      appealStatus: "none",
    });

    // 3. Save to MongoDB
    await testSeller.save();
    console.log("✅ Test seller saved to database");

    // 4. Read it back
    const found = await Seller.findOne({
      url: "https://facebook.com/test-seller-123",
    });
    console.log("✅ Seller read back from database:");
    console.log({
      url: found.url,
      riskScore: found.riskScore,
      flagged: found.flagged,
      copiedPhotos: found.features.copiedPhotos,
      createdAt: found.createdAt,
    });

    // 5. Clean up — delete the test entry
    await Seller.deleteOne({ url: "https://facebook.com/test-seller-123" });
    console.log("✅ Test seller deleted (cleanup done)");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

testDatabase();
