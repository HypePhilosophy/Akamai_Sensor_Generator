module.exports = (req, res, next) => {
    const currentUrl = req.originalUrl;

    // # block all shellshock script attack
    if (currentUrl.indexOf('/shell') > -1) {
        return res.status(403).end();
    }

    return next();
}