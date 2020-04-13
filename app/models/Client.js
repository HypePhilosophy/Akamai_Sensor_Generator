const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    clientID: String,
    key: { type: mongoose.Schema.Types.ObjectId, ref: "key" },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('client', clientSchema);