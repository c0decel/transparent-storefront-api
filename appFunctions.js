const express = require('express');

function checkBroom(req, res, next) {
    if (!req.user.hasBroom) {
        return res.status(403).send('Mods ONLY.');
    }
    next();
}

function checkAuth(req, res, next) {
    if (req.params.Username !== req.user.Username) {
        return res.status(403).send('You are not authorized to perform this action.');
    }
    next();
}


module.exports = checkBroom;
module.exports = checkAuth;