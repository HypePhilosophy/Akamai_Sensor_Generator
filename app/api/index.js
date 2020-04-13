const { Router } = require('express');
const GenRoute = require('./routes/GenRoute');
const AdminRoute = require('./routes/AdminRoute');
const TestRoute = require('./routes/TestRoute');

const app = Router();
GenRoute(app);
AdminRoute(app);
TestRoute(app);

module.exports = app;
