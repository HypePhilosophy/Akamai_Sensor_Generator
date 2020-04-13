const config = require('../config');
const genAbck = require('../../');
const KeyModel = require('../models/Key');

module.exports = {
    genCookie: async (apiKey, site, proxy) => {
        const isKey = await KeyModel.findOne({ key: apiKey });

        // # check for key limit
        if (isKey && isKey.limit == 0) {
            // # max limit reached
            return false;
        }

        isKey.limit -= 1;
        await isKey.save();
        return await genAbck(site, proxy);
    }
}