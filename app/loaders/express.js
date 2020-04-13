const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const Detection = require('../utils/Detection');
const Timeout = require('../utils/Timeout');

// # import config
const config = require('../config');

// # import api routes
const api = require('../api');

// # import logger
const Logger = require('../utils/Logger');

// # import request model
const RequestModel = require('../models/Request');

module.exports = app => {
    app.enable("trust proxy");
    // # init middlewares
    app.use(cors());
    app.use(morgan("dev"));
    app.use(helmet());

    // # end user if they try using scriptshell attack
    app.use(Timeout);

    // # whitelists ip only allow access
    app.use(Detection);

    // # catch and log each request
    app.use(async (req, res, next) => {
        try {
            if (req) {
                const userAgent = req.headers['user-agent'];
                const ipAddress = req.connection.remoteAddress;
                const logRequestString = new Logger(req, res).log("info");

                const requestLog = new RequestModel({
                    ipAddress,
                    userAgent,
                    logRequestString
                });

                // # save to request collection
                await requestLog.save();
            }

            // # return next middleware
            return next();
        } catch (e) {
            if (e) return next(e);
        }
    });

    // # use our api rotes
    app.use(config.api.prefix, api);

    // # error handling routes
    app.use((req, res, next) => {
        const err = new Error("Not Found");
        err.status = 404;
        res.status(err.status).json({
            status: err.status,
            request_url: req.originalUrl,
            message: err.message,
        });
    });

    // # catching global error
    app.use((err, req, res, next) => {
        if (err) {
            const status = err.status || 500;
            return res.status(status).json({
                status: err.status,
                request_url: req.originalUrl,
                message: err.message,
            });
        }
    });
};
