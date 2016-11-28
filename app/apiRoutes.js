'use strict';

exports = module.exports = function(router, app) {

    // update connection state for given deviceId
    router.post('/signin', require('./api/signin/index').init);
    router.post('/signout', require('./api/signout/index').init);

    router.post('/oauth/tokensignin', require('./api/oauth/index').tokensignin);

    if ("jwt" in router.app.config && "secret" in router.app.config.jwt && "private_key" in router.app.config.jwt) {
        router.post('/oauth/ext/authstatus', require('./api/external/index').authenticated);
        router.post('/oauth/ext/device', require('./api/external/index').accesstoken);
        router.get('/oauth/ext/id_token',require('./api/external/index').id_token);
        router.get('/oauth/ext/device_check',require('./api/external/index').client_check);
    } else {
        console.log("jwt not specified in configuration");
    }
};
