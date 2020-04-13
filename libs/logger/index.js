const Logger = function () { };

Logger.prototype.green = function success(message) {
    console.log("\x1b[32m", `[${new Date().toISOString()}] ${message}`);
};

Logger.prototype.red = function error(message) {
    console.log("\x1b[31m", `[${new Date().toISOString()}] ${message}`);
};

Logger.prototype.blue = function info(message) {
    console.log("\x1b[34m", `[${new Date().toISOString()}] ${message}`);
};

Logger.prototype.yellow = function warn(message) {
    console.log("\x1b[33m", `[${new Date().toISOString()}] ${message}`);
};

Logger.prototype.white = function normal(message) {
    console.log("\x1b[37m", `[${new Date().toISOString()}] ${message}`);
}

module.exports = new Logger();