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

            var cert = req.app.fs.readFileSync(req.app.config.jwt.private_key);

            req.app.jwt.verify(items[1].trim(), cert, {algorithms: ['HS512']}, function (err, decoded) {
                if (err) {
                    req.app.logger.log('error', err.message);
                    sendError(res, err.message);
                }
                else {
                    if (req.app.config.jwt.secret == decoded) {
                        next();
                    }
                    else {
                        req.app.logger.log('error', 'unauthorized');
                        sendError(res, "unauthorized");
                    }
                }
            });
        }
        else {
            req.app.logger.log('error', 'bad authorization protocol');
            sendError(res, "bad authorization protocol");
        }
    }
    else {
        req.app.logger.log('error', 'not authorized');
        sendError(res, "not authorized");
    }


};
