'use strict';

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.set('X-Auth-Required', 'true');
    req.session.returnUrl = req.originalUrl;
    res.redirect(req.app.config.baseUrl + '/login/');
}

function ensureAdmin(req, res, next) {
    if (req.user.canPlayRoleOf('admin')) {
        return next();
    }
    res.redirect(req.app.config.baseUrl + '/');
}

exports = module.exports = function(app) {

    if ("authentication_thirdpart" in app.config && "user_info_endpoint" in app.config.authentication_thirdpart) {
        app.get(app.config.baseUrl + app.config.authentication_thirdpart.user_info_endpoint, require('./api/oauth/index').userinfo);
    }

    //oauth api
    app.get(app.config.baseUrl + '/oauth/login', require('./views/oauth/index').init);

    //login/out
    app.get(app.config.baseUrl + '/login/', require('./views/login/index').init);
    app.post(app.config.baseUrl + '/login/', require('./views/login/index').login);
    app.get(app.config.baseUrl + '/logout/', require('./views/logout/index').init);
    app.get(app.config.baseUrl + '/login/forgot/', require('./views/login/forgot/index').init);
    app.post(app.config.baseUrl + '/login/forgot/', require('./views/login/forgot/index').send);
    app.get(app.config.baseUrl + '/login/reset/', require('./views/login/reset/index').init);
    app.get(app.config.baseUrl + '/login/reset/:email/:token/', require('./views/login/reset/index').init);
    app.put(app.config.baseUrl + '/login/reset/:email/:token/', require('./views/login/reset/index').set);
    app.get(app.config.baseUrl + '/logout/', require('./views/logout/index').init);

    //admin
    app.all(app.config.baseUrl + '/admin*', ensureAuthenticated);
    app.all(app.config.baseUrl + '/admin*', ensureAdmin);
    app.get(app.config.baseUrl + '/admin/', require('./views/admin/index').init);

    //admin > users
    app.get(app.config.baseUrl + '/admin/users/', require('./views/admin/users/index').find);
    app.post(app.config.baseUrl + '/admin/users/', require('./views/admin/users/index').create);
    app.get(app.config.baseUrl + '/admin/users/:id/', require('./views/admin/users/index').read);
    app.put(app.config.baseUrl + '/admin/users/:id/', require('./views/admin/users/index').update);
    app.put(app.config.baseUrl + '/admin/users/:id/password/', require('./views/admin/users/index').password);
    app.put(app.config.baseUrl + '/admin/users/:id/role-admin/', require('./views/admin/users/index').linkAdmin);
    app.delete(app.config.baseUrl + '/admin/users/:id/role-admin/', require('./views/admin/users/index').unlinkAdmin);
    app.put(app.config.baseUrl + '/admin/users/:id/role-account/', require('./views/admin/users/index').linkAccount);
    app.delete(app.config.baseUrl + '/admin/users/:id/role-account/', require('./views/admin/users/index').unlinkAccount);
    app.delete(app.config.baseUrl + '/admin/users/:id/', require('./views/admin/users/index').delete);

    //admin > administrators
    app.get(app.config.baseUrl + '/admin/administrators/', require('./views/admin/administrators/index').find);
    app.post(app.config.baseUrl + '/admin/administrators/', require('./views/admin/administrators/index').create);
    app.get(app.config.baseUrl + '/admin/administrators/:id/', require('./views/admin/administrators/index').read);
    app.put(app.config.baseUrl + '/admin/administrators/:id/', require('./views/admin/administrators/index').update);
    app.put(app.config.baseUrl + '/admin/administrators/:id/permissions/', require('./views/admin/administrators/index').permissions);
    app.put(app.config.baseUrl + '/admin/administrators/:id/groups/', require('./views/admin/administrators/index').groups);
    app.put(app.config.baseUrl + '/admin/administrators/:id/user/', require('./views/admin/administrators/index').linkUser);
    app.delete(app.config.baseUrl + '/admin/administrators/:id/user/', require('./views/admin/administrators/index').unlinkUser);
    app.delete(app.config.baseUrl + '/admin/administrators/:id/', require('./views/admin/administrators/index').delete);

    //admin > admin groups
    app.get(app.config.baseUrl + '/admin/admin-groups/', require('./views/admin/admin-groups/index').find);
    app.post(app.config.baseUrl + '/admin/admin-groups/', require('./views/admin/admin-groups/index').create);
    app.get(app.config.baseUrl + '/admin/admin-groups/:id/', require('./views/admin/admin-groups/index').read);
    app.put(app.config.baseUrl + '/admin/admin-groups/:id/', require('./views/admin/admin-groups/index').update);
    app.put(app.config.baseUrl + '/admin/admin-groups/:id/permissions/', require('./views/admin/admin-groups/index').permissions);
    app.delete(app.config.baseUrl + '/admin/admin-groups/:id/', require('./views/admin/admin-groups/index').delete);

    //admin > devices
    app.get(app.config.baseUrl + '/admin/devices/', require('./views/admin/devices/index').find);
    app.post(app.config.baseUrl + '/admin/devices/', require('./views/admin/devices/index').create);
    app.get(app.config.baseUrl + '/admin/devices/:id/', require('./views/admin/devices/index').read);
    app.put(app.config.baseUrl + '/admin/devices/:id/', require('./views/admin/devices/index').update);
    app.delete(app.config.baseUrl + '/admin/devices/:id/', require('./views/admin/devices/index').delete);

    //admin > log
    app.get(app.config.baseUrl + '/admin/log/', require('./views/admin/log/index').find);
    app.get(app.config.baseUrl + '/admin/log/:id/', require('./views/admin/log/index').read);
    app.delete(app.config.baseUrl + '/admin/log/:id/', require('./views/admin/log/index').delete);

    //admin > whitelist
    app.get(app.config.baseUrl + '/admin/whitelist/', require('./views/admin/whitelist/index').find);
    app.post(app.config.baseUrl + '/admin/whitelist/', require('./views/admin/whitelist/index').create);
    app.get(app.config.baseUrl + '/admin/whitelist/:id/', require('./views/admin/whitelist/index').read);
    app.put(app.config.baseUrl + '/admin/whitelist/:id/', require('./views/admin/whitelist/index').update);
    app.delete(app.config.baseUrl + '/admin/whitelist/:id/', require('./views/admin/whitelist/index').delete);

    //route not found
    app.all('*', require('./views/http/index').http404);
};
