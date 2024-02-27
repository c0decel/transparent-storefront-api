const express = require('express');

function checkBroom(req, res, next) {
    if (!req.user.hasBroom) {
        return res.status(403).send('Mods ONLY.');
    }
    next();
}

module.exports = checkBroom;
