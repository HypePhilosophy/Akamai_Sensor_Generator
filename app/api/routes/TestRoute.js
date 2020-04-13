const { Router } = require('express');

const route = Router();

module.exports = app => {
    app.use("/test", route);

    // # test route
    route.get("/", (req, res, next) => {
        return res.status(200).json({
            status: 200,
            error: null,
            data: {
                msg: "Success!",
                ip: req.connection.remoteAddress
            }
        });
    });
};
