#!/bin/bash

npm install
npm rebuild

pm2 start app.js --no-daemon
