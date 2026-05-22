const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
        unique: true
    },
    riskScore: {
        type: Number,
        default: 0,
        required: true
    },
    features: {
        accountAge: {type: Number},
        followerCount: {type: Number},
        hasAddress: {type: Boolean},
        hasPhoneNumber: {type: Boolean},
        hasEmail: {type: Boolean},
        hasProfilePicture: {type: Boolean},
        hasDescription: {type: Boolean},
        isVerified: {type: Boolean},
        hasReviews: {type: Boolean},
        averageRating: {type: Number},
        totalReviews: {type: Number},
        negativeReviews: {type: Number},
        copiedPhotos: {type: Boolean},
        totalPosts: {type: Number},
        isMultiPlatform: {type: Boolean},
        hasCommentOff: {type: Boolean}
    },
    flagged: {
        type: Boolean,
        default: false
    },
    appealStatus: {
        type: String,
        enum: ['none','pending', 'approved', 'rejected'],
        default: 'none'
    }
}, {timestamps: true});

const Seller = mongoose.model('Seller', sellerSchema);

module.exports = Seller;