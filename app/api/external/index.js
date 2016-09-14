'use strict';

function sendError(code, message, res) {

    res.status(code).send({
        "errors": [
            {
                "message": message
            }
        ]
    });
}

exports.authenticated = function (req, res) {

    if ("deviceId" in req.body && req.body.deviceId != "") {

        var query = req.app.db.models.Device.find({}).select('is_device_login is_webservice_login -_id');

        query.where('_id', req.body.deviceId).exec(function (err, value) {

            if (err) {
                sendError(500, "check database failure", res);
            }
            else {
                console.log(value);
                if (value.length > 0) {
                    console.log("success");
                    res.status(200).send({
                        "is_device_login": value[0].is_device_login,
                        "is_webservice_login": value[0].is_webservice_login
                    });
                }
                else {
                    sendError(500, "device not found", res);
                }
            }
        });

    }
    else {
        sendError(500, "deviceId field is missing", res);
    }
}


exports.accesstoken = function (req, res) {

    if ("accessToken" in req.body && req.body.accessToken != "") {

        var query = req.app.db.models.Device.find({}).select('_id');

        query.where('access_token', req.body.accessToken).exec(function (err, value) {

            if (err) {
                sendError(500, "check database failure", res);
            }
            else {
                console.log(value);
                if (value.length > 0) {
                    console.log("success");
                    res.status(200).send({
                        "deviceId": value[0]._id
                    });
                }
                else {
                    sendError(500, "access token not found", res);
                }
            }
        });

    }
    else {
        sendError(500, "accessToken field is missing", res);
    }
}
