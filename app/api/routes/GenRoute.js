const { Router } = require('express');
const GenService = require('../../services/GenService');
const validateApiKey = require('../middlewares/checkApiKey');
const ErrorHandler = require('../error');

const route = Router();

module.exports = app => {
    app.use("/gen", route);

    // # gen cookies
    route.get('/', validateApiKey, async (req, res, next) => {
        const { token, site } = req.query;
        const { proxy } = req.headers;
        const data = await GenService.genCookie(token, site, proxy);

        // # if no data, means limit has been reached
        if (!data.hasOwnProperty('success') || !data.hasOwnProperty('abck')) {
            // # return user response
            return next(new ErrorHandler(403, 'Maximum limit reached on your api key. Contact admin to renew!'));
        }

        // # return user response
        return res.status(200).json({
            status: 200,
            error: null,
            data: {
                success: data.success,
                '_abck': data.abck
            }
        });
    });
};
