'use strict';

exports.init = function (req, res) {

    var workflow = req.app.utility.workflow(req, res);

    //validate message format
    workflow.on('validate', function () {

        if (!req.body.token) {
            return sendResponse(workflow, 1, 0, {}, [{"code": 0, "message": "token is required"}]);
        }

        if (!req.body.error) {
            return sendResponse(workflow, 1, 0, {}, [{"code": 0, "message": "error report is required"}]);
        }

        workflow.emit('verifier');
    });

    //verify token
    workflow.on('verifier', function () {

        req.app.reqmod('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + req.body.token, function (error, response, body) {

            if (error) {
                req.app.logger.log('error', 'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + req.body.token + " : " + error.message);
                return sendResponse(workflow, 1, 0, {}, [{"code": 3, "message": "verification failure : " + error}]);
            }
            try {
                var bodyJson = JSON.parse(body);
                if (response.statusCode == 200 && ("email" in bodyJson)) {
                    req.email = bodyJson.email;
                    workflow.emit('checkDate');
                } else {
                    return sendResponse(workflow, 1, 0, {}, [{"code": 3, "message": "verification failure (format)"}]);
                }
            } catch (e) {
                return sendResponse(workflow, 1, 0, {}, [{"code": 7, "message": "request format error : " + e}]);
            }
        });
    });

    workflow.on('checkDate', function () {

        var currentTime = new Date();
        var lastHour = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getUTCDate(), currentTime.getHours());
        var nextHour = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getUTCDate(), currentTime.getHours() + 1);

        req.app.db.models.ErrorReport.find({
            email: req.email,
            time: {$gt: lastHour, $lt: nextHour}
        }).limit(10).exec(function (err, report) {
            if (err) {
                req.app.logger.log('error', "create report error : " + err.message);
                return sendResponse(workflow, 1, 0, {}, [{"code": 2, "message": "database error : " + err}]);
            }
            if (report.length >= 10) {
                req.app.logger.log('error', "max report error for user");
                return sendResponse(workflow, 1, 0, {}, [{"code": 3, "message": "verification failure (format)"}]);
            }
            workflow.emit('storeReport');
        });
    });

    workflow.on('storeReport', function () {

        req.app.logger.log('verbose', 'storing error report');

        var fieldsToSet = {
            email: req.email,
            errorCode: req.body.error.errorCode,
            errorMessage: req.body.error.errorMessage,
            time: Date.now()
        };

        req.app.db.models.ErrorReport.create(fieldsToSet, function (err, report) {

            if (err) {
                req.app.logger.log('error', "create report error : " + err.message);
                return sendResponse(workflow, 1, 0, {}, [{"code": 2, "message": "database error : " + err}]);
            }
            return sendResponse(workflow, 0, 0, {}, []);
        });

    });

    workflow.emit('validate');
}

function sendResponse(workflow, status, eventCode, data, errors) {
    workflow.outcome = {
        "status": status,
        "eventCode": eventCode,
        "data": data,
        "error": errors
    };

    if (status == 0) {
        return workflow.emit('api_response_success');
    }
    else {
        return workflow.emit('api_response_error');
    }
}