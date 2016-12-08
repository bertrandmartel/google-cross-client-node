'use strict';

exports = module.exports = function (app, mongoose) {

    var errorSchema = new mongoose.Schema({
        email: {type: String, default: ''},
        errorCode: {type: String, default: ''},
        errorMessage: {type: String, default: ''},
        time: {type: Date, default: ''}
    });
    errorSchema.plugin(require('./plugins/pagedFind'));
    app.db.model('ErrorReport', errorSchema);
};
