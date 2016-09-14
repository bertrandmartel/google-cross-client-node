#!/bin/bash

npm rebuild

pm2 start app.js --no-daemon