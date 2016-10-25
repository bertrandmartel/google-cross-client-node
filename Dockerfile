FROM node:latest

MAINTAINER Bertrand Martel <bmartel.fr@gmail.com>

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# install pm2 (node package manager) & setup pm2 start script
RUN npm install -g pm2

# Install app dependencies
COPY app/package.json /usr/src/app/

# Bundle app source
COPY ./app /usr/src/app

ADD start.sh /var/www/
RUN chmod +x /var/www/start.sh

CMD ["/var/www/start.sh"] 
