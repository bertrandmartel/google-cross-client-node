'use strict';

var fs = require('fs');

if (!fileExists("./config.js")) {
    console.log("error config.js is missing");
    return;
}

//dependencies
var config = require('./config'),
    express = require('express'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    http = require('http'),
    https = require('https'),
    request = require('request'),
    session = require('express-session'),
    mongoStore = require('connect-mongo')(session),
    passport = require('passport'),
    mongoose = require('mongoose'),
    path = require('path'),
    helmet = require('helmet'),
    morgan = require('morgan'),
    FileStreamRotator = require('file-stream-rotator'),
    google = require('googleapis'),
    crypto = require('crypto'),
    jwt = require('jsonwebtoken'),
    csrf = require('csurf');

//create express app
var app = express();

app.jwt = jwt;
app.fs = fs;

var OAuth2 = google.auth.OAuth2;
app.oauth2Client = new OAuth2(config.google.clientId, config.google.clientSecret, config.google.redirectUri);
app.google = google;

app.reqmod = request;
app.crypto = crypto;

var logDirectory = __dirname + '/log'

// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)

// create a rotating write stream
var accessLogStream = FileStreamRotator.getStream({
    date_format: 'YYYYMMDD',
    filename: logDirectory + '/access-%DATE%.log',
    frequency: 'daily',
    verbose: false
})

app.config = config;

exports.systemEmail = process.env.SYSTEM_EMAIL || 'your@email.addy';
exports.smtp = {
    from: {
        name: process.env.SMTP_FROM_NAME || exports.projectName + ' Website',
        address: process.env.SMTP_FROM_ADDRESS || 'your@email.addy'
    },
    credentials: {
        user: process.env.SMTP_USERNAME || 'your@email.addy',
        password: process.env.SMTP_PASSWORD || 'bl4rg!',
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        ssl: process.env.SMTP_USE_SSL || true
    }
};

// setup the logger
//app.use(morgan(app.config.logFormat, {stream: accessLogStream}))
app.use(require('morgan')('dev'));

// create api router
app.api = createApiRouter(app.config, morgan, accessLogStream);

// mount api before csrf is appended to the app stack
app.use('/api/v' + app.config.api.version, app.api);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Avoids DEPTH_ZERO_SELF_SIGNED_CERT error for self-signed certs

//setup server
var server;
var protocol = 'http';

if (("httpsConfig" in config) && ("key" in config.httpsConfig) && ("pem" in config.httpsConfig) && fileExists(config.httpsConfig.key) && fileExists(config.httpsConfig.pem)) {
    server = https.createServer({
        key: fs.readFileSync(config.httpsConfig.key),
        cert: fs.readFileSync(config.httpsConfig.pem)
    }, app);
    protocol = 'https';
}
else {
    server = http.createServer(app);
}

//setup mongoose
app.db = mongoose.createConnection(config.mongodb.uri);
app.db.on('error', console.error.bind(console, 'mongoose connection error: '));
app.db.once('open', function () {
    //and... we have a data store
});

//config data models
require('./models')(app, mongoose);

//settings
app.disable('x-powered-by'); //disable x-powered-by: Express HTTP header
app.set('port', config.port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//middleware
app.use(require('compression')());
app.use(require('serve-static')(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser(config.cryptoKey));
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: config.cryptoKey,
    store: new mongoStore({
        url: config.mongodb.uri
    })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(csrf({
    cookie: {
        signed: true
    }
}));
helmet(app);

//response locals
app.use(function (req, res, next) {
    res.cookie('_csrfToken', req.csrfToken());
    res.locals.user = {};
    res.locals.user.defaultReturnUrl = req.user && req.user.defaultReturnUrl();
    res.locals.user.username = req.user && req.user.username;
    next();
});

//global locals
app.locals.projectName = app.config.projectName;
app.locals.copyrightYear = new Date().getFullYear();
app.locals.copyrightName = app.config.companyName;

//setup passport
require('./passport')(app, passport);

if ("authentication_thirdpart" in app.config && "google_oauth_cors_filter" in app.config.authentication_thirdpart) {
    app.all(app.config.authentication_thirdpart.google_oauth_cors_filter, [require('./middlewares/googlecors')]);
}

//setup routes
require('./routes')(app);

//setup utilities
app.utility = {};
app.utility.sendmail = require('./util/sendmail');
app.utility.slugify = require('./util/slugify');
app.utility.workflow = require('./util/workflow');

// launch listening loop
server.listen(app.get('port'), function () {

    console.log("Server listening at " + protocol + "://%s:%s", server.address().address, server.address().port)

})

function createApiRouter(config, morgan, accessLogStream) {

    var router = new express.Router();
    router.use(bodyParser.urlencoded({
        extended: true
    }));
    router.use(bodyParser.json());

    router.app = app;

    if ("jwt" in app.config && "secret" in app.config.jwt && "private_key" in app.config.jwt) {
        router.all('/oauth/ext/*', [require('./middlewares/jwtcors')]);
    } else {
        console.log("jwt not specified in configuration");
    }
    // setup the logger
    //router.use(morgan(config.logFormat, {stream: accessLogStream}))

    //setup routes
    require('./apiRoutes')(router);

    return router
}

function fileExists(path) {

    try {
        return fs.statSync(path).isFile();
    }
    catch (e) {

        if (e.code == 'ENOENT') { // no such file or directory. File really does not exist
            console.log("File does not exist.");
            return false;
        }

        console.log("Exception fs.statSync (" + path + "): " + e);
        throw e; // something else went wrong, we don't have rights, ...
    }
}