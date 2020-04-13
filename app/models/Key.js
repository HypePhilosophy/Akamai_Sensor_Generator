const mongoose = require('mongoose');
const crypto = require('crypto');

const ClientModel = require('./Client');

const keySchema = new mongoose.Schema({
    keyID: String,
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'client', default: null },
    key: {
        type: String,
        unique: true
    },
    secret: {
        type: String,
        unique: true
    },
    limit: {
        type: Number,
        default: 10000
    }
});

keySchema.pre('save', function (next) {
    const user = this;

    if (!user.secret && !user.client) {
        // # new client
        const client = new ClientModel({
            id: Math.random().toString(36).substring(2, 15),
            key: user._id
        });

        // # save
        client.save();

        return crypto.randomBytes(48, (err, buffer) => {
            let token = buffer.toString('hex');
            user.secret = token;
            user.client = client._id;
            return next();
        });
    }

    return next();
});

module.exports = mongoose.model('key', keySchema);