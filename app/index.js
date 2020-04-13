const express = require('express');
const http = require('http');

const config = require('./config');
const PORT = process.env.PORT || 3000;

(async () => {
    // # create app
    const app = express();
    // # import loaders
    require("./loaders")(app);
    // # create httpserver
    const httpServer = http.createServer(app);

    // # listen to server port
    httpServer.listen(PORT, "0.0.0.0", e => {
        if (e) {
            console.log(e);
            process.exit(1);
        }

        console.log(`Server running on port ${PORT}`);
    });
})();
