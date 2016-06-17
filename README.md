# Google Cross Client - Node JS

Node JS server part authenticating Android clients with google signin compliant with <a href="https://developers.google.com/identity/protocols/CrossClientAuth">google standards</a>

Android devices will send their device serial + google JWT token to this server which will check google authentication, check device serial from a whitelist and store email/serial in database

To be used with this Android client : https://github.com/akinaru/google-cross-client-android

This project is built from <a href="https://github.com/jedireza/drywall">drywall</a>

## Features

* check google JWT token on server with tokeninfo endpoint
* store device id / email in mongo database
* manage devices entries with an web admin page
* manage a whitelist that define a list of authorized devices (device id filters)

## Setup

* create file config.js :

```
'use strict';

exports.port = process.env.PORT || 4747;
exports.mongodb = {
  uri: process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost:27017/gcrossclient'
};
exports.logFormat=":remote-addr - :remote-user [:date[iso]] \":method :url HTTP/:http-version\" :status :res[content-length] [:user-agent]"
exports.companyName = '';
exports.projectName = 'Google cross client';
exports.systemEmail = 'yourmail@gmail.com';
exports.cryptoKey = 'k3yb0ardc4t';
exports.loginAttempts = {
  forIp: 50,
  forIpAndUser: 7,
  logExpiration: '20m'
};

exports.requireAccountVerification = true;
exports.disableSignUp = true;

exports.smtp = {
  from: {
    name: process.env.SMTP_FROM_NAME || exports.projectName + ' Website',
    address: process.env.SMTP_FROM_ADDRESS || 'yourmail@gmail.com'
  },
  credentials: {
    user: process.env.SMTP_USERNAME || 'yourmail@gmail.com',
    password: process.env.SMTP_PASSWORD || 'password',
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    ssl: true
  }
};
exports.google = {
    clientId: "your_client_id",
    clientSecret: "your_client_secret",
    redirectUri: "postmessage"
};

exports.api = {
    version: 1
};

exports.jwt = {
    secret: "jwt_secret_to_be_used",
    private_key: "./path/to/jwt_cert.key",
    public_key: "./path/to/jwt_cert.pem"
};

exports.authentication_thirdpart = {
    webservice_uri: "webservice_redirect_uri",
    user_info_endpoint: "user_info_api_endpoint",
    google_oauth_cors_filter: "google_cors_api_filter"
};

```

* create your admin in mongo database : 

```
db.admingroups.insert({ _id: 'root', name: 'Root' });
db.admins.insert({ name: {first: 'Root', last: 'Admin', full: 'Root Admin'}, groups: ['root'] });
var rootAdmin = db.admins.findOne();
db.users.save({ username: 'root', isActive: 'yes', email: 'yourmail@gmail.com', roles: {admin: rootAdmin._id} });
var rootUser = db.users.findOne();
rootAdmin.user = { id: rootUser._id, name: rootUser.username };
db.admins.save(rootAdmin);
```

* install & start

```
npm install
npm start
```

## Enable your Android device id in whitelist

Add your device id in whitelist database from the admin page.

You can set the following filters :
* `*1234` : begin with 1234
* `1234*` : end with 1234
* `*1234*` : contain 1234

You can whitelist as much device id as you want. By default NO device is authorized

## External APIS

### Device authentication 

* `POST /api/v1/signin`

Device signin api

* `POST /api/v1/signout`

Device signout api

### Webservice authentication

* `POST /api/v1/oauth/tokensignin`

Webservice Oauth2.0 user signin via Oauth2.0 code to request access token / refresh token

{
  "grant_type":"authorization_code/refresh_token",
  "client_id":"<your_client_id>",
  "client_secret":"<your_client_secret>"
}

** grant_type:authorization_code

additionnal parameters :

* code : oauth2.0 code to be used to request an access token / refresh token
* redirect_uri : redirect uri (required but not used for now) 

** grant_type:refresh_token

additionnal parameters :

* refresh_token : the refresh token to be used to generate a new access token



### JWT protected

These APIs should have `Authorization` header with `Bearer` type followed by a JWT token signed with a private key defined in `config.js` as `jwt.private_key` and decoded with a public key defined in the same file as `jwt.public_key`. The secret is defined by `jwt.secret`.

* `POST /api/v1/oauth/ext/authstatus`

Get auth status for both device & webservice


request example :

```
POST /api/v1/oauth/ext/authstatus HTTP/1.1
Host: localhost:4747
Content-Type: application/json
Authorization: Bearer <your_jwt_token_here>

{
  "deviceId":"61c8e927a533e30b4785aebcecd5a031b3a06f73"
}
```

response body example :

```
{
  "deviceId":"akofsdro2323232323"
}
```

* `POST /api/v1/oauth/ext/device`

Get device ID from Google access token

request example :

```
POST /api/oauth/ext/device HTTP/1.1
Host: localhost:4747
Content-Type: application/json
Authorization: Bearer <your_jwt_token_here>

{
  "accessToken":"your_access_token_here"
}
```

response body example :

```
{
  "is_device_login": true,
  "is_webservice_login": false
}
```

note : to encode/decode JWT, <a href="https://github.com/auth0/node-jsonwebtoken">node-jsonwebtoken</a> is used

To encode JWT :

```
var cert2 = fs.readFileSync(config.jwt.private_key);
var token = jwt.sign(config.jwt.secret, cert2, {algorithm: 'HS512'});
console.log(token);
```

## License

The MIT License (MIT) Copyright (c) 2016 Bertrand Martel
