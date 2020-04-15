const Logger = function () { };
Logger.prototype.green = function success(message) {
    console.log(`[${new Date().toISOString()}] \x1b[32m${message}\x1b[0m`);
};
Logger.prototype.purple = function success(message) {
    console.log(`[${new Date().toISOString()}] \x1b[35m${message}\x1b[0m`);
};
Logger.prototype.red = function error(message) {
    console.log(`[${new Date().toISOString()}] \x1b[31m${message}\x1b[0m`);
};
Logger.prototype.blue = function info(message) {
    console.log(`[${new Date().toISOString()}] \x1b[34m${message}\x1b[0m`);
};
Logger.prototype.yellow = function warn(message) {
    console.log(`[${new Date().toISOString()}] \x1b[33m${message}\x1b[0m`);
};
Logger.prototype.white = function normal(message) {
    console.log(`[${new Date().toISOString()}] \x1b[37m${message}\x1b[0m`);
}
module.exports = new Logger();