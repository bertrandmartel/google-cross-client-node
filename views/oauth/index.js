'use strict';

exports.init = function (req, res) {
    res.render('oauth/index', {
        authentication_uri: req.app.config.authentication_thirdpart.webservice_uri
    });
};
