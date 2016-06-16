'use strict';

exports = module.exports = function (app, mongoose) {
    var deviceSchema = new mongoose.Schema({
        _id: {type: String},
        email: {type: String, default: ''},
        hash: {type: String, default: ''},
        access_token: {type: String, default: ''},
        refresh_token: {type: String, default: ''},
        is_webservice_login: {type: Boolean, default: false},
        is_device_login: {type: Boolean, default: false},
        webservice_login_date: {type: Date, default: ''},
        device_login_date: {type: Date, default: ''},
        last_refresh_date: {type: Date, default: ''}
    });
    deviceSchema.plugin(require('./plugins/pagedFind'));
    deviceSchema.index({email: 1});
    deviceSchema.index({hash: 1});
    deviceSchema.set('autoIndex', (app.get('env') === 'development'));
    app.db.model('Device', deviceSchema);
};
