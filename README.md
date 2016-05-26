# Google Cross Client - Node JS

Node JS server part that authentify with remote server compliant with <a href="https://developers.google.com/identity/protocols/CrossClientAuth">google standards</a>

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
exports.gcm = {
  clientId: "your_client_id_here"
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

## License

```
Copyright (C) 2016  Bertrand Martel

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 3
of the License, or (at your option) any later version.

Foobar is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Foobar.  If not, see <http://www.gnu.org/licenses/>.
```

