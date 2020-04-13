// # TODO
const config = require('../../config');
const ErrorHandler = require('../error');

module.exports = async (req, res, next) => {
    const { authorization } = req.headers;

    if (authorization) {
        const key = authorization.substring(7);
        // # no api key presented in header
        if (!key || key !== config.adminSecret) {
            return next(new ErrorHandler(403, 'Invalid credential, please check your secret key!'));
        }

        return next();
    }

    // # simply return if no authorization
    return next(new ErrorHandler(403, 'Unauthorized access!'));
}