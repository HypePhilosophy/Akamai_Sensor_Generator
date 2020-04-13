const { Router } = require('express');
const AdminService = require('../../services/AdminService');
const checkAuthKey = require('../middlewares/checkAuthKey');

const route = Router();

module.exports = app => {
    app.use("/admin", route);

    // # generate api keys
    route.get('/generate', checkAuthKey, async (req, res, next) => {
        const apiKey = await AdminService.generateApiKey();

        if (apiKey) {
            return res.status(200).json({
                statusCode: 200,
                errors: [],
                data: {
                    status: 'success',
                    res: apiKey
                }
            });
        }
    });
};
