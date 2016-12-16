'use strict';

module.exports = function (req, res, next) {

    req.app.utility.analytics(req.app,
        'REQUEST',
        req.method + ' ' + req.url,
        '1',
        req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        req.headers['user-agent']);

    next();
};
