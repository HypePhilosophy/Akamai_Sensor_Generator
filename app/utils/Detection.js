const fs = require('fs');
const path = require('path');
const Logger = require('./Logger');

module.exports = (req, res, next) => {
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const logRequestString = new Logger(req, res).log("info");
    let invalidIp = true;

    // # import whitelist ips only
    fs.readFile(path.join(process.cwd(), 'whitelists.txt'), "utf8", (err, data) => {

        if (!err) {
            // # format ips
            const formatIps = data.replace(/\r/g, '').trim().split("\n");

            for (let i = 0; i < formatIps.length; i++) {
                if (formatIps[i] == ipAddress) {
                    invalidIp = false;
                    return next();
                }
            }

            if (invalidIp) {
                // # end response from user
                return res.status(403).end();
            }
        }

        return next(err);
    });
}