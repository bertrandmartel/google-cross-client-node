'use strict';

exports = module.exports = function(router) {

   // update connection state for given deviceId 
  router.post('/signin', require('./api/signin/index').init);
  router.post('/signout', require('./api/signout/index').init);

};
