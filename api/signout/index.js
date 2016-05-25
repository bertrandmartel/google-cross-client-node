'use strict';

exports.init = function (req, res) {

    var workflow = req.app.utility.workflow(req, res);

    //validate message format
    workflow.on('validate_signout', function () {

        if (!req.body.token) {

            workflow.outcome = {};
            workflow.outcome.response = {
                "status": 2,
                "eventCode": 3,
                "message": "token is required"
            };
            return workflow.emit('api_response');
        }

        if (!req.body.hash) {
            workflow.outcome = {};
            workflow.outcome.response = {
                "status": 2,
                "eventCode": 4,
                "message": "hash is required"
            };
            return workflow.emit('api_response');
        }

        workflow.emit('verifier_signout');
    });

    //verify token
    workflow.on('verifier_signout', function () {

        console.log("find token : " + req.body.token + " et " + req.app.config.gcm.clientId);

        req.app.reqmod('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + req.body.token, function (error, response, body) {

            if (error) {
                console.log(error);
                workflow.outcome = {};
                workflow.outcome.response = {
                    "status": 2,
                    "eventCode": 7,
                    "message": "verification request error"
                };
                return workflow.emit('api_response');
            }
            try {
                var bodyJson = JSON.parse(body);
                if (response.statusCode == 200 && ("email" in bodyJson)) {
                    req.email = bodyJson.email;
                    workflow.emit('signout');
                } else {
                    workflow.outcome = {};
                    workflow.outcome.response = {
                        "status": 2,
                        "eventCode": 6,
                        "message": "verification failure"
                    };
                    return workflow.emit('api_response');
                }
            }
            catch (e) {

                workflow.outcome = {};
                workflow.outcome.response = {
                    "status": 2,
                    "eventCode": 7,
                    "message": "verification request error"
                };
                return workflow.emit('api_response');
            }
        });

    });

    //check for duplicates in database
    workflow.on('signout', function () {

        req.app.db.models.Device.findOneAndRemove({email: req.email}, function (err) {
            if (err) {
                workflow.outcome = {};
                workflow.outcome.response = {
                    "status": 2,
                    "eventCode": 5,
                    "message": err
                };

                return workflow.emit('api_response');
            }
            workflow.outcome = {};
            workflow.outcome.response = {
                "status": 1,
                "eventCode": 8,
                "message": "signout success"
            };
            return workflow.emit('api_response');
        });

    });

    workflow.emit('validate_signout');
}