'use strict';

exports.init = function (req, res) {

    var workflow = req.app.utility.workflow(req, res);

    //validate message format
    workflow.on('validate', function () {

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
                    }
                    else if (hash.startsWith("*") && (hash.substr(hash.length - 1) == "*")) {
                        //containing
                        if (req.body.hash.indexOf(hash.substr(1, hash.length - 2)) > -1) {
                            match = true;
                        }
                    }
                    else if (hash.startsWith("*")) {
                        //beginning
                        if (req.body.hash.endsWith(hash.substr(1, hash.length - 1))) {
                            match = true;
                        }
                    }
                    else if (hash.endsWith("*")) {
                        //ending
                        if (req.body.hash.startsWith(hash.substr(0, hash.length - 2))) {
                            match = true;
                        }
                    }
                    else if (req.body.hash == hash) {
                        match = true;
                    }
                }
            }

            if (match) {
                workflow.emit('verifier');
            }
            else {
                workflow.outcome = {};
                workflow.outcome.response = {
                    "status": 2,
                    "eventCode": 9,
                    "message": "device not authorized"
                };
                return workflow.emit('api_response');
            }
        });
    });

    //verify token
    workflow.on('verifier', function () {

        console.log("find token : " + req.body.token);

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
                    workflow.emit('duplicatedevicesCheck');
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
                    "message": "request format error"
                };
                return workflow.emit('api_response');
            }
        });
    });

    //check for duplicates in database
    workflow.on('duplicatedevicesCheck', function () {

        var query = req.app.db.models.Device.find({}).select('email _id');

        query.where('email', req.email).exec(function (err, someValue) {
            if (err) {
                workflow.outcome = {};
                workflow.outcome.response = {
                    "status": 2,
                    "eventCode": 5,
                    "message": err
                };
                workflow.emit('api_response');
            }
            else {
                if (someValue.length > 0) {

                    var fieldsToSet = {};
                    fieldsToSet.device_login_date = Date.now();
                    fieldsToSet.is_device_login = true;

                    req.app.db.models.Device.findByIdAndUpdate(someValue[0]._id, fieldsToSet, {new: true}, function (err, devices) {
                        if (err) {
                            workflow.outcome = {};
                            workflow.outcome.response = {
                                "status": 2,
                                "eventCode": 5,
                                "message": err
                            };
                            workflow.emit('api_response');
                        }
                        else {
                            console.log("update success");
                            workflow.outcome = {};
                            workflow.outcome.response = {
                                "status": 1,
                                "eventCode": 2,
                                "deviceId": someValue[0]._id,
                                "message": "registration success. Already registered"
                            };
                            workflow.emit('api_response');
                        }
                    });
                }
                else {
                    workflow.emit('createDevice');
                }
            }
        });
    });

    //create device in database
    workflow.on('createDevice', function () {

        var current_date = (new Date()).valueOf().toString();
        var random = Math.random().toString();
        var id = req.app.crypto.createHash('sha1').update(current_date + random).digest('hex');
        console.log("new id : " + id);

        var fieldsToSet = {
            _id: id,
            email: req.email,
            hash: req.body.hash,
            is_device_login: true,
            device_login_date: Date.now()
        };

        req.app.db.models.Device.create(fieldsToSet, function (err, devices) {

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
                "eventCode": 1,
                "deviceId": id,
                "message": "registration success"
            };

            return workflow.emit('api_response');
        });
    });

    workflow.emit('validate');
}