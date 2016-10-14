'use strict';

exports = module.exports = function(app, mongoose, baseUrl) {
  //embeddable docs first
  require('./schema/Note')(app, mongoose);
  require('./schema/StatusLog')(app, mongoose);
  require('./schema/Device')(app, mongoose);
  require('./schema/Whitelist')(app, mongoose);

  //then regular docs
  require('./schema/User')(app, mongoose, baseUrl);
  require('./schema/Admin')(app, mongoose);
  require('./schema/AdminGroup')(app, mongoose);
  require('./schema/Account')(app, mongoose);
  require('./schema/LoginAttempt')(app, mongoose);
};
