const express = require('./express');
const mongo = require('./mongo');

module.exports = async app => {
    await express(app);
    await mongo();
};
