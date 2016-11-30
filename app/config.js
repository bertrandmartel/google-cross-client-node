'use strict';

exports.port = process.env.AUTH_SERVER_PORT || 4747;
exports.mongodb = {
    uri: process.env.MONGO_AUTH_URI || 'mongodb://localhost:27017/gcrossclient'
};

exports.baseUrl = process.env.AUTH_SERVER_PREFIX || '/service';

exports.host = process.env.AUTH_SERVER_HOST || 'your-host';

exports.useSSL = false;

exports.oauthPageTitle = process.env.OAUTH_PAGE_TITLE || "Associate your device";

exports.httpsConfig = {
    key: process.env.KEY_PATH || './server.key',
    pem: process.env.CERT_PATH || './server.crt'
}

exports.welcomeMessage = {
    subject: "Welcome to this amazing service",
    bodyFilePath: "body-welcome-email"
}

exports.logFormat = ":remote-addr - :remote-user [:date[iso]] \":method :url HTTP/:http-version\" :status :res[content-length] [:user-agent]"
exports.companyName = 'Bubble & Co';
exports.projectName = 'Bubble Project';
exports.systemEmail = process.env.SYSTEM_EMAIL || 'your@email.addy';
exports.cryptoKey = process.env.CRYPTO_KEY || 'k3yb0ardc4t';
exports.loginAttempts = {
    forIp: process.env.LOGIN_ATTEMPTS_FOR_IP || 50,
    forIpAndUser: process.env.LOGIN_ATTEMPTS_FOR_IP_AND_USER || 7,
    logExpiration: process.env.LOGIN_ATTEMPTS_LOG_EXPIRATION || '20m'
};

exports.requireAccountVerification = process.env.REQUIRE_ACCOUNT_VERIFICATION || false;

exports.disableSignUp = process.env.DISABLE_SIGNUP || false;

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

exports.google = {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || ''
};

exports.api = {
    version: process.env.API_VERSION || 1
};

exports.jwt = {
    secret: process.env.JWT_SECRET || '',
    private_key: process.env.JWT_PRIVATE_KEY_PATH || './jwt_cert.key',
    public_key: process.env.JWT_CERT_PATH || './jwt_cert.crt'
};

exports.authentication_thirdpart = {
    webservice_uri: process.env.AUTH_THIRD_PART_WEBSERVICE_URI || '',
    user_info_endpoint: process.env.AUTH_THIRD_PART_USERINFO_ENDPOINT || '',
    google_oauth_cors_filter: process.env.AUTH_THRID_PART_GOOGLE_OAUTH_CORS_FILTER || ''
};
