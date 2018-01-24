/**
 * Created by bertrandmartel on 14/12/16.
 */

// https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
exports = module.exports = function trackEvent(app, action, label, value, uip, ua, cb) {
    const data = {
        v: '1', // API Version.
        tid: app.config.analytics.tracking_id, // Tracking ID / Property ID.
        // Anonymous Client Identifier. Ideally, this should be a UUID that
        // is associated with particular user, device, or browser instance.
        cid: '555',
        t: 'event', // Event hit type.
        ec: app.config.analytics.category, // Event category.
        ea: action, // Event action.
        el: label, // Event label.
        ev: value // Event value.
    };

    var headers = {
        'Content-Type': 'application/json',
    };

    if (uip) {
        headers['X-forwarded-for'] = uip;
    }

    if (ua) {
        headers['User-Agent'] = ua;
    }
    else {
        headers['User-agent'] = app.config.analytics.category;
    }

    app.reqmod.post({
            url: 'http://www.google-analytics.com/collect',
            form: data,
            headers: headers,
            method: 'POST'
        },
        function (err, response) {
            if (err) {
                if (cb) {
                    cb(err);
                }
                else {
                    req.app.logger.log('error', err.message);
                }
                return;
            }
            if (response.statusCode !== 200) {
                if (cb) {
                    cb(new Error('Tracking failed'));
                }
                else {
                    req.app.logger.log('error', 'Tracking failed');
                }
                return;
            }
            if (cb) {
                cb();
            }
        });
};


