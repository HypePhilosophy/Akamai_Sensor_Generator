const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema({
    ipAddress: String,
    isBlackList: Boolean,
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('blacklist', blacklistSchema);