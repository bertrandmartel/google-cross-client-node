'use strict';

exports.tokensignin = function (req, res) {

    console.log("in tokensignin");
    console.log(req.body);
    console.log(JSON.stringify(req.headers));
    console.log(req.body.code);

    var successBody = {
        "data": {}
    };

    var errorBody = {
        "errors": [
            {
                "message": "Something went wrong!"
            }
        ]
    };

    req.app.oauth2Client.getToken(req.body.code, function (err, tokens) {
        // Now tokens contains an access_token and an optional refresh_token. Save them.
        if (!err) {
            if ("access_token" in tokens) {

                console.log(tokens);

                req.app.oauth2Client.setCredentials(tokens);

                req.app.reqmod("https://accounts.google.com/o/oauth2/revoke?token=" + tokens.access_token, function (error, response, body) {

                    console.log("revoking access token");

                    if (error) {
                        console.log(error);
                    }
                    else {
                        console.log(body);
                    }
                });
            }
            if ("refresh_token" in tokens) {

                req.app.reqmod("https://accounts.google.com/o/oauth2/revoke?token=" + tokens.refresh_token, function (error, response, body) {

                    console.log("revoking refresh token");

                    if (error) {
                        console.log(error);
                    }
                    else {
                        console.log(body);
                    }
                });
            }
        }
        else {
            console.log(err);
        }
        res.status(401).send(errorBody);
    });

};