const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    ipAddress: String,
    userAgent: String,
    logRequestString: String,
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('request', requestSchema);