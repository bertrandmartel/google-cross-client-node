'use strict';

function sendError(code, message, res) {

    res.status(code).send({
        "errors": [{
            "message": message
        }]
    });
}

exports.authenticated = function (req, res) {

    if ("deviceId" in req.body && req.body.deviceId != "") {

        var query = req.app.db.models.Device.find({}).select('is_device_login is_webservice_login -_id');

        query.where('_id', req.body.deviceId).exec(function (err, value) {

            if (err) {
                sendError(500, "check database failure", res);
            } else {
                if (value.length > 0) {
                    res.status(200).send({
                        "is_device_login": value[0].is_device_login,
                        "is_webservice_login": value[0].is_webservice_login
                    });
                } else {
                    sendError(500, "device not found", res);
                }
            }
        });

    } else {
        sendError(500, "deviceId field is missing", res);
    }
}

exports.client_check = function (req, res) {

    var authorization = req.headers['authorization'].split(/[ ]+/);

    if (authorization[2].trim() != "") {

        req.app.reqmod('https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + authorization[2].trim(), function (error, response, body) {

            if (error) {
                req.app.logger('error', error);
                sendError(500, "verification request error", res);
            } else {
                try {
                    if (response.statusCode == 200) {

                        var query = req.app.db.models.Device.find({}).select('_id');

                        query.where('email', JSON.parse(response.body).email).exec(function (err, value) {

                            if (err) {
                                sendError(500, "check database failure", res);
                            } else {
                                if (value.length > 0) {
                                    res.status(200).send({
                                        "deviceId": value[0]._id
                                    });
                                } else {
                                    req.app.logger('error', "verification failed");
                                    sendError(500, "access token not found", res);
                                }
                            }
                        });

                    } else {
                        sendError(500, "bad token", res);
                    }
                } catch (e) {
                    sendError(500, "request format error", res);
                }
            }
        });

    } else {
        sendError(500, "accessToken field is missing", res);
    }
}


exports.accesstoken = function (req, res) {

    if ("accessToken" in req.body && req.body.accessToken != "") {

        var query = req.app.db.models.Device.find({}).select('_id');

        query.where('access_token', req.body.accessToken).exec(function (err, value) {

            if (err) {
                sendError(500, "check database failure", res);
            } else {
                if (value.length > 0) {
                    res.status(200).send({
                        "deviceId": value[0]._id
                    });
                } else {
                    sendError(500, "access token not found", res);
                }
            }
        });

    } else {
        sendError(500, "accessToken field is missing", res);
    }
}

exports.id_token = function (req, res) {

    if ("deviceId" in req.body && req.body.deviceId != "" && "id_token" in req.body && req.body.id_token != "") {

        req.app.reqmod('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + req.body.id_token, function (error, response, body) {

            if (error) {
                sendError(500, "verification request error", res);
            } else {
                try {
                    if (response.statusCode == 200) {

                        var query = req.app.db.models.Device.find({}).select('_id');

                        query.where('_id', req.body.deviceId).exec(function (err, value) {

                            if (err) {
                                sendError(500, "check database failure", res);
                            } else {
                                if (value.length > 0 && body.email == value[0].email) {
                                    res.status(200).send({});
                                } else {
                                    sendError(500, "access token not found", res);
                                }
                            }
                        });

                    } else {
                        sendError(500, "bad token", res);
                    }
                } catch (e) {
                    sendError(500, "request format error", res);
                }
            }
        });

    } else {
        sendError(500, "accessToken field is missing", res);
    }
}
