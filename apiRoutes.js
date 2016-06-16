'use strict';

exports = module.exports = function (router) {

    // update connection state for given deviceId
    router.post('/signin', require('./api/signin/index').init);
    router.post('/signout', require('./api/signout/index').init);
    router.post('/oauth/tokensignin', require('./api/oauth/index').tokensignin);

    if ("jwt" in router.app.config && "secret" in router.app.config.jwt) {
        router.post('/oauth/authstatus', require('./api/external/index').authenticated);
        router.post('/oauth/device', require('./api/external/index').accesstoken);
    } else {
        console.log("jwt not specified in configuration");
    }
};
