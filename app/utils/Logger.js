const qs = require('querystring');

class Logger {
    constructor(req, res) {
        this.req = req;
        this.res = res;
        this.requestImprint = "";

        if (req) {
            const userAgent = req.headers['user-agent'];
            const ipAddress = req.connection.remoteAddress;
            const queries = qs.parse(req.originalUrl.replace(/^.*\?/, ''));
            const imprint = [userAgent, ipAddress];

            for (const k in queries) {
                imprint.push(queries[k]);
            }

            this.requestImprint = imprint.filter(x => !!x).join(", ");
        }
    }


    log(level, ...args) {
        return `[${new Date().toISOString()}] [${level}] [${this.requestImprint}] ${this.req.method} ${this.req.originalUrl} ${this.res.statusCode}`
    }
}

module.exports = Logger;