'use strict';

function revokeToken(token, app) {

    app.reqmod("https://accounts.google.com/o/oauth2/revoke?token=" + token, function(error, response, body) {

        console.log("revoking access token");

        if (error) {
            console.log(error);
        } else {
            console.log(body);
        }
    });
}

function sendRefreshSuccess(access_token, refresh_token, res) {
    var ret = {};
    ret.access_token = access_token;
    ret.refresh_token = refresh_token;
    res.status(200).send(ret);
}

function sendTokenSuccess(tokens, res) {
    var ret = {};
    ret.token_type = "Bearer";
    ret.access_token = tokens.access_token;
    if ("refresh_token" in tokens) {
        ret.refresh_token = tokens.refresh_token;
    }
    console.log(ret);
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.status(200).send(ret);
}

function sendError(tokens, res, message, app) {

    if (tokens != null) {

        if ("access_token" in tokens) {
            revokeToken(tokens.access_token, app);
        }
        if ("refresh_token" in tokens) {
            revokeToken(tokens.refresh_token, app);
        }
    }

    res.status(401).send({
        "errors": [{
            "message": message
        }]
    });
}

function checkParams(req, check_redirect) {

    if (check_redirect && (req.body.redirect_uri != req.app.config.authentication_thirdpart.webservice_uri)) {
        return false;
    }
    if (req.body.client_id != req.app.config.google.clientId) {
        return false;
    }
    if (req.body.client_secret != req.app.config.google.clientSecret) {
        return false;
    }
    return true;
}

exports.userinfo = function(req, res) {

    var authorization = req.headers['authorization'];

    if (('authorization' in req.headers) && (typeof authorization !== 'undefined' && authorization !== null)) {

        var items = authorization.split(/[ ]+/);

        if (items.length > 1 && items[0].trim() == "Bearer") {

            req.app.oauth2Client.setCredentials({
                "access_token": items[1].trim()
            });

            req.app.google.oauth2("v2").userinfo.v2.me.get({ auth: req.app.oauth2Client }, function(e, profile) {

                if ("email" in profile && "name" in profile) {

                    var link = "none";

                    if ("link" in profile) {
                        link = profile.link;
                    }
                    res.status(200).send({
                        "data": {
                            "name": profile.name,
                            "id": profile.email,
                            "url": link
                        }
                    });
                } else {
                    res.status(500).send({
                        "errors": [{
                            "message": "user info failure"
                        }]
                    });
                }
            })
        }
    }
}

exports.tokensignin = function(req, res) {

    console.log("in tokensignin");
    console.log(req.body);
    console.log(JSON.stringify(req.headers));

    if (("grant_type" in req.body) && ("client_id" in req.body) && ("client_secret" in req.body)) {

        if (req.body.grant_type == "authorization_code") {

            if (!("code" in req.body)) {
                sendError(null, res, "missing parameter code for grant_type : authorization_code", req.app);
                return;
            }
            if (!("redirect_uri" in req.body)) {
                sendError(null, res, "missing parameter redirect_uri for grant_type : authorization_code", req.app);
                return;
            }

            if (!checkParams(req, true)) {
                sendError(null, res, "incorrect client_id, client_secret or redirect_uri", req.app);
                return;
            }

            req.app.oauth2Client.getToken(req.body.code, function(err, tokens) {
                // Now tokens contains an access_token and an optional refresh_token. Save them.
                if (!err) {
                    if ("access_token" in tokens) {

                        var refresh_token = "";

                        if ("refresh_token" in tokens) {
                            refresh_token = tokens.refresh_token;
                        }

                        console.log(tokens);
                        req.app.oauth2Client.setCredentials(tokens);

                        req.app.google.oauth2("v2").userinfo.v2.me.get({ auth: req.app.oauth2Client }, function(e, profile) {

                            if ("email" in profile) {

                                console.log(profile.email);

                                var query = req.app.db.models.Device.find({}).select('email _id');

                                query.where('email', profile.email).exec(function(err, someValue) {
                                    if (err) {
                                        console.log(err);
                                        sendError(tokens, res, "select device failure", req.app);
                                    } else {
                                        if (someValue.length > 0) {
                                            console.log("updating device with id  : " + someValue[0]._id);

                                            var fieldsToSet = {};
                                            fieldsToSet.access_token = tokens.access_token;
                                            fieldsToSet.webservice_login_date = Date.now();
                                            fieldsToSet.last_refresh_date = Date.now();
                                            fieldsToSet.is_webservice_login = true;

                                            if (refresh_token != "") {
                                                fieldsToSet.refresh_token = tokens.refresh_token;
                                            }

                                            req.app.db.models.Device.findByIdAndUpdate(someValue[0]._id, fieldsToSet, { new: true }, function(err, devices) {
                                                if (err) {
                                                    console.log(err);
                                                    sendError(tokens, res, "update failure", req.app);
                                                } else {
                                                    console.log("update success");
                                                    sendTokenSuccess(tokens, res);
                                                }
                                            });
                                        } else {

                                            console.log("inserting device");
                                            var current_date = (new Date()).valueOf().toString();
                                            var random = Math.random().toString();
                                            var id = req.app.crypto.createHash('sha1').update(current_date + random).digest('hex');
                                            console.log("new id : " + id);

                                            req.app.db.models.Device.create({
                                                _id: id,
                                                email: profile.email,
                                                hash: '',
                                                is_webservice_login: true,
                                                access_token: tokens.access_token,
                                                refresh_token: refresh_token,
                                                last_refresh_date: Date.now(),
                                                webservice_login_date: Date.now()
                                            }, function(err, devices) {

                                                if (err) {
                                                    console.log(err);
                                                    sendError(tokens, res, "insertion failure", req.app);
                                                } else {
                                                    console.log("insertion success");
                                                    sendTokenSuccess(tokens, res);
                                                }
                                            });

                                        }
                                    }
                                });
                            } else {
                                sendError(tokens, res, "get google account failure", req.app);
                            }
                        });
                    } else {
                        sendError(tokens, res, "access token not retrieved", req.app);
                    }
                } else {
                    console.log(err);
                    sendError(tokens, res, err.message, req.app);
                }
            });
        } else if (req.body.grant_type == "refresh_token") {

            if (!("refresh_token" in req.body)) {
                sendError(null, res, "missing parameter refresh_token for grant_type : refresh_token", req.app);
                return;
            }

            if (!checkParams(req, false)) {
                sendError(null, res, "incorrect client_id or client_secret", req.app);
                return;
            }

            req.app.oauth2Client.setCredentials({
                "refresh_token": req.body.refresh_token
            });

            req.app.oauth2Client.refreshAccessToken(function(err, tokens) {

                if (!err) {
                    if ("access_token" in tokens) {

                        var refresh_token = req.body.refresh_token;

                        if ("refresh_token" in tokens) {
                            refresh_token = tokens.refresh_token;
                        }

                        var ret = {
                            "access_token": tokens.access_token,
                            "refresh_token": refresh_token
                        };
                        console.log("refresh success");

                        var fieldsToSet = {};
                        fieldsToSet.access_token = tokens.access_token;
                        fieldsToSet.webservice_login_date = Date.now();

                        if (refresh_token != "") {
                            fieldsToSet.refresh_token = tokens.refresh_token;
                        }
                        req.app.oauth2Client.setCredentials(tokens);

                        req.app.google.oauth2("v2").userinfo.v2.me.get({ auth: req.app.oauth2Client }, function(e, profile) {

                            if ("email" in profile) {

                                console.log(profile.email);

                                var query = req.app.db.models.Device.find({}).select('email _id');

                                query.where('email', profile.email).exec(function(err, someValue) {
                                    if (err) {
                                        console.log(err);
                                        sendError(tokens, res, "select device failure", req.app);
                                    } else {
                                        if (someValue.length > 0) {
                                            console.log("updating device with id  : " + someValue[0]._id);

                                            var fieldsToSet = {};
                                            fieldsToSet.access_token = tokens.access_token;
                                            fieldsToSet.last_refresh_date = Date.now();

                                            if (refresh_token != "") {
                                                fieldsToSet.refresh_token = tokens.refresh_token;
                                            }

                                            req.app.db.models.Device.findByIdAndUpdate(someValue[0]._id, fieldsToSet, { new: true }, function(err, devices) {
                                                if (err) {
                                                    console.log(err);
                                                    sendError(tokens, res, "update failure", req.app);
                                                } else {
                                                    console.log("update success");
                                                    sendRefreshSuccess(fieldsToSet.access_token, fieldsToSet.refresh_token, res);
                                                }
                                            });
                                        } else {
                                            sendError(tokens, res, "device not found in database", req.app);
                                        }
                                    }
                                });
                            } else {
                                sendError(tokens, res, "get google account failure", req.app);
                            }
                        });
                    } else {
                        sendError(null, res, "access token not retrieved", req.app);
                    }
                } else {
                    console.log(err);
                    sendError(null, res, "failure during token refresh", req.app);
                }
            });
        }
    } else {
        sendError(null, res, "incorrect parameters", req.app);
    }
};
