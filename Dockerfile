FROM node:latest

MAINTAINER Bertrand Martel <bmartel.fr@gmail.com>

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY app/package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY ./app /usr/src/app

EXPOSE 4747
CMD [ "npm", "start" ]