const config = require('../../config');
const ErrorHandler = require('../error');
const GenService = require('../../services/GenService');
const KeyModel = require('../../models/Key');

module.exports = async (req, res, next) => {
    const { token, clientid } = req.query;
    const { authorization } = req.headers;
    const key = authorization.substring(7);

    // # no api key presented in header
    if (!key || !await KeyModel.findOne({ secret: key })) {
        return next(new ErrorHandler(403, 'Invalid credential'));
    }

    const keyData = await KeyModel.findOne({ secret: key });

    if (keyData.key == token && keyData.client == clientid) {
        return next();
    }

    return next(new ErrorHandler(403, 'Invalid credential'));
}