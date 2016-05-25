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
    csrf = require('csurf');

//create express app
var app = express();

app.reqmod = request;

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

// setup the logger
app.use(morgan(app.config.logFormat, {stream: accessLogStream}))

// create api router
app.api = createApiRouter(app.config, morgan, accessLogStream);

// mount api before csrf is appended to the app stack
app.use('/api', app.api);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Avoids DEPTH_ZERO_SELF_SIGNED_CERT error for self-signed certs

//setup server
var server;

if (fileExists(config.httpsConfig.key) && fileExists(config.httpsConfig.pem)) {
    server = https.createServer({
        key: fs.readFileSync(config.httpsConfig.key),
        cert: fs.readFileSync(config.httpsConfig.pem)
    }, app);
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

//setup routes
require('./routes')(app);

//setup utilities
app.utility = {};
app.utility.sendmail = require('./util/sendmail');
app.utility.slugify = require('./util/slugify');
app.utility.workflow = require('./util/workflow');

// launch listening loop
server.listen(app.get('port'), function () {

    console.log("Server listening at https://%s:%s", server.address().address, server.address().port)

})

function createApiRouter(config, morgan, accessLogStream) {

    var router = new express.Router();
    router.use(bodyParser.urlencoded({
        extended: true
    }));
    router.use(bodyParser.json());

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