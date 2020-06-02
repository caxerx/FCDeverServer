FROM node:12
MAINTAINER caxerx

WORKDIR /fcdever
COPY . .

RUN npm install

EXPOSE 3000
ENTRYPOINT ["npm", "run", "start"]
