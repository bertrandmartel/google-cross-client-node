'use strict';

function sendError(res, message) {

    res.status(401).send({
        "errors": [{
            "message": message
        }]
    });
}

module.exports = function(req, res, next) {

    var authorization = req.headers['authorization'];

    if (('authorization' in req.headers) && (typeof authorization !== 'undefined' && authorization !== null)) {

        var items = authorization.split(/[ ]+/);

        if (items.length > 1 && items[0].trim() == "Bearer") {

            req.app.reqmod('https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + items[1].trim(), function(error, response, body) {

                if (error) {
                    sendError(res, "verification request error");
                } else {
                    try {
                        if (response.statusCode == 200) {

                            var query = req.app.db.models.Device.find({}).select('access_token -_id');

                            query.where('access_token', items[1].trim()).exec(function(err, someValue) {
                                if (err) {
                                    sendError(res, "check database failure");
                                } else {
                                    if (someValue.length > 0) {
                                        next();
                                    } else {
                                        sendError(res, "not authorized");
                                    }
                                }
                            });
                        } else {
                            sendError(res, "bad token");
                        }
                    } catch (e) {
                        sendError(res, "request format error");
                    }
                }
            });
        } else {
            sendError(res, "bad authorization protocol");
        }
    } else {
        sendError(res, "not authorized");
    }

};
