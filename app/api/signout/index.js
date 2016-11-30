'use strict';

exports.init = function (req, res) {

    var workflow = req.app.utility.workflow(req, res);

    //validate message format
    workflow.on('validate_signout', function () {

        if (!req.body.token) {
            return sendResponse(workflow, 1, 0, {}, [{"code": 0, "message": "token is required"}]);
        }

        if (!req.body.hash) {
            return sendResponse(workflow, 1, 0, {}, [{"code": 1, "message": "hash is required"}]);
        }

        workflow.emit('verifier_signout');
    });

    //verify token
    workflow.on('verifier_signout', function () {

        req.app.reqmod('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + req.body.token, function (error, response, body) {

            if (error) {
                req.app.logger.log('error', 'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + req.body.token + " : " + error.message);
                return sendResponse(workflow, 1, 0, {}, [{"code": 3, "message": "verification failure : " + error}]);
            }
            try {
                var bodyJson = JSON.parse(body);
                if (response.statusCode == 200 && ("email" in bodyJson)) {
                    req.email = bodyJson.email;
                    workflow.emit('signout');
                } else {
                    req.app.logger.log('error', "verification failure (format)");
                    return sendResponse(workflow, 1, 0, {}, [{"code": 3, "message": "verification failure (format)"}]);
                }
            } catch (e) {
                req.app.logger.log('error', "request format error");
                return sendResponse(workflow, 1, 0, {}, [{"code": 7, "message": "request format error : " + e}]);
            }
        });

    });

    //check for duplicates in database
    workflow.on('signout', function () {

        req.app.db.models.Device.findOneAndRemove({email: req.email}, function (err) {
            if (err) {
                req.app.logger.log('error', "database error : " + err.message);
                return sendResponse(workflow, 1, 1, {}, [{"code": 2, "message": "database error : " + err}]);
            }
            return sendResponse(workflow, 0, 1, {}, []);
        });

    });

    workflow.emit('validate_signout');
}

function sendResponse(workflow, status, eventCode, data, errors) {
    workflow.outcome = {
        "status": status,
        "eventCode": eventCode,
        "data": data,
        "error": errors
    };
    return workflow.emit('api_response');
}