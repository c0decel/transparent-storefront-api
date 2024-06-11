const express = require('express');

function checkBroom(req, res, next) {
    if (!req.user.hasBroom) {
        return res.status(403).send('Mods ONLY.');
    }
    next();
}
/** 
function formatDate(date) {
    return date.toLocaleString('en-us', {
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric', 
    });
}

function formatTime(date) {
    return date.toLocaleString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false
    });
}
*/
module.exports = checkBroom;
