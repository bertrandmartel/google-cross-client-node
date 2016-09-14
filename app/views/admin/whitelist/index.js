'use strict';

exports.find = function (req, res, next) {

    req.query.hash = req.query.hash ? req.query.hash : '';
    req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
    req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
    req.query.sort = req.query.sort ? req.query.sort : '_id';

    var filters = {};
    if (req.query.name) {
        filters.name = new RegExp('^.*?' + req.query.name + '.*$', 'i');
    }

    req.app.db.models.Whitelist.pagedFind({
        filters: filters,
        keys: 'hash',
        limit: req.query.limit,
        page: req.query.page,
        sort: req.query.sort
    }, function (err, results) {
        if (err) {
            return next(err);
        }

        if (req.xhr) {
            res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
            results.filters = req.query;
            res.send(results);
        }
        else {
            results.filters = req.query;
            res.render('admin/whitelist/index', {data: {results: escape(JSON.stringify(results))}});
        }
    });
};

exports.read = function (req, res, next) {
    req.app.db.models.Whitelist.findById(req.params.id).exec(function (err, devices) {
        if (err) {
            return next(err);
        }

        if (req.xhr) {
            res.send(devices);
        }
        else {
            res.render('admin/whitelist/details', {data: {record: escape(JSON.stringify(devices))}});
        }
    });
};

exports.create = function (req, res, next) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function () {
        if (!req.user.roles.admin.isMemberOf('root')) {
            workflow.outcome.errors.push('You may not create devices.');
            return workflow.emit('response');
        }

        if (!req.body.hash) {
            workflow.outcome.errors.push('A hash is required.');
            return workflow.emit('response');
        }

        workflow.emit('duplicatedevicesCheck');
    });

    workflow.on('duplicatedevicesCheck', function () {
        req.app.db.models.Device.findById(req.app.utility.slugify(req.body.hash)).exec(function (err, devices) {
            if (err) {
                return workflow.emit('exception', err);
            }

            if (devices) {
                workflow.outcome.errors.push('That devices+email is already taken.');
                return workflow.emit('response');
            }

            workflow.emit('createDevice');
        });
    });

    workflow.on('createDevice', function () {
        var fieldsToSet = {
            hash: req.body.hash
        };

        req.app.db.models.Whitelist.create(fieldsToSet, function (err, devices) {
            if (err) {
                return workflow.emit('exception', err);
            }

            workflow.outcome.record = devices;
            return workflow.emit('response');
        });
    });

    workflow.emit('validate');
};

exports.update = function (req, res, next) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function () {
        if (!req.user.roles.admin.isMemberOf('root')) {
            workflow.outcome.errors.push('You may not update devices.');
            return workflow.emit('response');
        }

        if (!req.body.hash) {
            workflow.outcome.errfor.hash = 'required';
            return workflow.emit('response');
        }

        workflow.emit('patchDevice');
    });

    workflow.on('patchDevice', function () {
        var fieldsToSet = {
            hash: req.body.hash
        };
        var options = {new: true};
        req.app.db.models.Whitelist.findByIdAndUpdate(req.params.id, fieldsToSet, options, function (err, devices) {
            if (err) {
                return workflow.emit('exception', err);
            }

            workflow.outcome.whitelist = devices;
            return workflow.emit('response');
        });
    });

    workflow.emit('validate');
};

exports.delete = function (req, res, next) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function () {
        if (!req.user.roles.admin.isMemberOf('root')) {
            workflow.outcome.errors.push('You may not delete devices.');
            return workflow.emit('response');
        }

        workflow.emit('deleteDevice');
    });

    workflow.on('deleteDevice', function (err) {
        req.app.db.models.Whitelist.findByIdAndRemove(req.params.id, function (err, whitelist) {
            if (err) {
                return workflow.emit('exception', err);
            }
            workflow.emit('response');
        });
    });

    workflow.emit('validate');
};
