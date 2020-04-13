const mongoose = require('mongoose');

// # IMPORT CONFIG
const config = require('../config');

module.exports = () => {
    mongoose.connect(config.mongoUri, {
        useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    mongoose.connection.on("connected", () => {
        console.log("Successfully connected to database!");
    });

    mongoose.connection.on("error", err => {
        console.log(`Failed to connecto mongodb: ${err}`);
    });

    // When the connection is disconnected
    mongoose.connection.on("disconnected", () => {
        console.log("Mongoose default connection disconnected");
    });

    // If the Node process ends, close the Mongoose connection
    process.on("SIGINT", () => {
        mongoose.connection.close(() => {
            console.log(
                "Mongoose default connection disconnected through app termination"
            );
            throw new Error("Connection terminated through APP.");
        });
    });
};
