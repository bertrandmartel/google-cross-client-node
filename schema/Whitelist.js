'use strict';

exports = module.exports = function(app, mongoose) {

  var deviceSchema = new mongoose.Schema({
    hash: { type: String, default: '' }
  });
  deviceSchema.plugin(require('./plugins/pagedFind'));
  deviceSchema.index({ hash: 1 });
  deviceSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('Whitelist', deviceSchema);
};
