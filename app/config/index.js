require('dotenv').config();

module.exports = {
    mongoUri: process.env.MONGO_URI,
    mongoDatabase: process.env.MONGO_INITDB_DATABASE,
    adminSecret: process.env.ADMIN_SECRET,
    api: {
        'prefix': '/api'
    }
}