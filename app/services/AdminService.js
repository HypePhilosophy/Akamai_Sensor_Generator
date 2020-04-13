const crypto = require('crypto');
const uuid = require('uuid/v4');
const config = require('../config');

const KeyModel = require('../models/Key');
const ClientModel = require('../models/Client');

module.exports = {
    generateApiKey: async () => {
        // # create new key
        const newKey = await KeyModel.create({
            keyID: Math.random().toString(36).substring(2, 15),
            key: uuid()
        })

        // # return user api key
        return {
            key: newKey.key,
            secret: newKey.secret,
            clientID: newKey.client
        };
    }
}