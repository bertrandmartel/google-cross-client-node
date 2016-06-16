'use strict';

function sendError(res, message) {

    res.status(401).send({
        "errors": [
            {
                "message": message
            }
        ]
    });
}

module.exports = function (req, res, next) {

    var authorization = req.headers['authorization'];

    if (('authorization' in req.headers) && (typeof authorization !== 'undefined' && authorization !== null)) {

        var items = authorization.split(/[ ]+/);

        if (items.length > 1 && items[0].trim() == "Bearer") {

            var cert = req.app.fs.readFileSync('jwt_cert.pem');

            req.app.jwt.verify(items[1].trim(), cert, function (err, decoded) {
                if (err) {
                    sendError(res, err.message);
                }
                else {
                    if (req.app.config.jwt.secret == decoded) {
                        next();
                    }
                    else {
                        sendError(res, "unauthorized");
                    }
                }
            });
        }
        else {
            sendError(res, "bad authorization protocol");
        }
    }
    else {
        sendError(res, "not authorized");
    }


};
