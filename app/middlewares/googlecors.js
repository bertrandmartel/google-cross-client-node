'use strict';

function sendError(res, message) {

    res.status(401).send({
        "errors": [{
            "message": message
        }]
    });
}

module.exports = function (req, res, next) {

    var authorization = req.headers['authorization'];

    if (('authorization' in req.headers) && (typeof authorization !== 'undefined' && authorization !== null)) {

        var items = authorization.split(/[ ]+/);

        if (items.length > 1 && items[0].trim() == "Bearer") {

            req.app.reqmod('https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + items[1].trim(), function (error, response, body) {

                if (error) {
                    req.app.logger.log('error', 'https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + items[1].trim() + " : " + error.message);
                    sendError(res, "verification request error");
                } else {
                    try {
                        if (response.statusCode == 200) {

                            var query = req.app.db.models.Device.find({}).select('access_token -_id');

                            query.where('access_token', items[1].trim()).exec(function (err, someValue) {
                                if (err) {
                                    req.app.logger.log('error', "check database failure : " + err.message);
                                    sendError(res, "check database failure");
                                } else {
                                    if (someValue.length > 0) {
                                        next();
                                    } else {
                                        req.app.logger.log('error', "not authorized");
                                        sendError(res, "not authorized");
                                    }
                                }
                            });
                        } else {
                            req.app.logger.log('error', "bad token");
                            sendError(res, "bad token");
                        }
                    } catch (e) {
                        req.app.logger.log('error', "request format error");
                        sendError(res, "request format error");
                    }
                }
            });
        } else {
            req.app.logger.log('error', "bad authorization protocol");
            sendError(res, "bad authorization protocol");
        }
    } else {
        req.app.logger.log('error', "not authorized");
        sendError(res, "not authorized");
    }

};
