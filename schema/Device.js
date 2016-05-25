'use strict';

exports = module.exports = function(app, mongoose) {
  var deviceSchema = new mongoose.Schema({
    _id: { type: String },
    email: { type: String, default: '' },
    hash: { type: String, default: '' }
  });
  deviceSchema.plugin(require('./plugins/pagedFind'));
  deviceSchema.index({ email: 1 });
  deviceSchema.index({ hash: 1 });
  deviceSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('Device', deviceSchema);
};
