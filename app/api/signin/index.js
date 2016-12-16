'use strict';

exports.init = function (req, res) {

    var workflow = req.app.utility.workflow(req, res);

    //validate message format
    workflow.on('validate', function () {

        if (!req.body.token) {
            return sendResponse(req, workflow, 1, 0, {}, [{"code": 0, "message": "token is required"}]);
        }

        if (!req.body.hash) {
            return sendResponse(req, workflow, 1, 0, {}, [{"code": 0, "message": "hash is required"}]);
        }

        workflow.emit('checkwhitelist');
    });

    workflow.on('checkwhitelist', function () {

        req.app.db.models.Whitelist.pagedFind({
            filters: {},
            keys: 'hash',
            limit: 5000000,
            page: 1,
            sort: '_id'
        }, function (err, results) {

            if (err) {
                return next(err);
            }

            var match = false;

            if ("data" in results) {

                for (var element in results.data) {

                    var hash = results.data[element].hash;

                    if (hash == "*") {
                        //match all
                        match = true;
                        break;
                    } else if (hash.startsWith("*") && (hash.substr(hash.length - 1) == "*")) {
                        //containing
                        if (req.body.hash.indexOf(hash.substr(1, hash.length - 2)) > -1) {
                            match = true;
                        }
                    } else if (hash.startsWith("*")) {
                        //beginning
                        if (req.body.hash.endsWith(hash.substr(1, hash.length - 1))) {
                            match = true;
                        }
                    } else if (hash.endsWith("*")) {
                        //ending
                        if (req.body.hash.startsWith(hash.substr(0, hash.length - 2))) {
                            match = true;
                        }
                    } else if (req.body.hash == hash) {
                        match = true;
                    }
                }
            }

            if (match) {
                workflow.emit('verifier');
            } else {
                return sendResponse(req, workflow, 1, 0, {}, [{"code": 5, "message": "device not authorized"}]);
            }
        });
    });

    //verify token
    workflow.on('verifier', function () {

        req.app.reqmod('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + req.body.token, function (error, response, body) {

            if (error) {
                req.app.logger.log('error', 'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + req.body.token + " : " + error.message);
                return sendResponse(req, workflow, 1, 0, {}, [{
                    "code": 3,
                    "message": "verification failure : " + error
                }]);
            }
            try {
                var bodyJson = JSON.parse(body);
                if (response.statusCode == 200 && ("email" in bodyJson)) {
                    req.email = bodyJson.email;
                    workflow.emit('duplicatedevicesCheck');
                } else {
                    return sendResponse(req, workflow, 1, 0, {}, [{
                        "code": 3,
                        "message": "verification failure (format)"
                    }]);
                }
            } catch (e) {
                return sendResponse(req, workflow, 1, 0, {}, [{"code": 7, "message": "request format error : " + e}]);
            }
        });
    });

    //check for duplicates in database
    workflow.on('duplicatedevicesCheck', function () {

        if (("override" in req.body) && req.body.override) {

            req.app.db.models.Device.findOneAndRemove({email: req.email}, function (err) {
                if (err) {
                    req.app.logger.log('error', "duplicatedevicesCheck : " + err.message);
                }
                return workflow.emit('sendEmail');
            });

        }
        else {

            var query = req.app.db.models.Device.find({}).select('email hash _id');

            query.where('email', req.email).exec(function (err, someValue) {
                if (err) {
                    req.app.logger.log('error', "query email : " + err.message);
                    sendResponse(req, workflow, 1, 0, {}, [{"code": 2, "message": "database error : " + err}]);
                } else {
                    if (someValue.length > 0) {

                        if (!(someValue[0].hash == req.body.hash) && !(someValue[0].hash == "")) {
                            sendResponse(req, workflow, 1, 0, {}, [{"code": 6, "message": "duplicate device"}]);
                        } else {

                            var fieldsToSet = {};
                            fieldsToSet.device_login_date = Date.now();
                            fieldsToSet.is_device_login = true;
                            fieldsToSet.hash = req.body.hash;

                            req.app.db.models.Device.findByIdAndUpdate(someValue[0]._id, fieldsToSet, {new: true}, function (err, devices) {
                                if (err) {
                                    req.app.logger.log('error', "database error : " + err.message);
                                    sendResponse(req, workflow, 1, 0, {}, [{
                                        "code": 2,
                                        "message": "database error : " + err
                                    }]);
                                } else {
                                    sendResponse(req, workflow, 0, 0, {"deviceId": someValue[0]._id}, []);
                                }
                            });
                        }
                    } else {
                        workflow.emit('sendEmail');
                    }
                }
            });
        }
    });

    workflow.on('sendEmail', function () {

        req.app.utility.sendmail(req, res, {
            from: req.app.config.smtp.from.name + ' <' + req.app.config.smtp.from.address + '>',
            to: req.email,
            subject: req.app.config.welcomeMessage.subject,
            htmlPath: __dirname + '/../../' + req.app.config.welcomeMessage.bodyFilePath,
            success: function (message) {
                workflow.emit('createDevice');
            },
            error: function (err) {
                req.app.logger.log('error', "send mail error : " + err.message);
                workflow.emit('createDevice');
            }
        });

    });

    //create device in database
    workflow.on('createDevice', function () {

        var current_date = (new Date()).valueOf().toString();
        var random = Math.random().toString();
        var id = req.app.crypto.createHash('sha1').update(current_date + random).digest('hex');

        var fieldsToSet = {
            _id: id,
            email: req.email,
            hash: req.body.hash,
            is_device_login: true,
            device_login_date: Date.now()
        };

        req.app.db.models.Device.create(fieldsToSet, function (err, devices) {

            if (err) {
                req.app.logger.log('error', "create device error : " + err.message);
                return sendResponse(req, workflow, 1, 0, {}, [{"code": 2, "message": "database error : " + err}]);
            }
            return sendResponse(req, workflow, 0, 0, {"deviceId": id}, []);
        });
    });

    workflow.emit('validate');
}

function sendResponse(req, workflow, status, eventCode, data, errors) {
    workflow.outcome = {
        "status": status,
        "eventCode": eventCode,
        "data": data,
        "error": errors
    };
    if (status == 0) {
        req.app.utility.analytics(req.app,
            'SIGNIN_SUCCESS',
            '',
            '1',
            req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            req.headers['user-agent']);
        return workflow.emit('api_response_success');
    }
    else {
        req.app.utility.analytics(req.app,
            'SIGNIN_FAILURE',
            '',
            '1',
            req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            req.headers['user-agent']);
        return workflow.emit('api_response_error');
    }
}