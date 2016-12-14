'use strict';

exports = module.exports = function (req, res) {
    var workflow = new (require('events').EventEmitter)();

    workflow.outcome = {
        success: false,
        errors: [],
        errfor: {}
    };

    workflow.hasErrors = function () {
        return Object.keys(workflow.outcome.errfor).length !== 0 || workflow.outcome.errors.length !== 0;
    };

    workflow.on('exception', function (err) {
        workflow.outcome.errors.push('Exception: ' + err);
        return workflow.emit('response');
    });

    workflow.on('response', function () {
        workflow.outcome.success = !workflow.hasErrors();
        res.send(workflow.outcome);
    });

    workflow.on('api_response_success', function () {
        res.status(200).send(workflow.outcome);
    });

    workflow.on('api_response_error', function () {
        res.status(500).send(workflow.outcome);
    });

    return workflow;
};
