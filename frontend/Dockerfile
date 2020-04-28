FROM node:8.15

WORKDIR /opt/frontend
COPY package*.json ./
RUN npm install
COPY . .
RUN npm rebuild
EXPOSE 3000
ENV DEBUG=cloudstate*
ENTRYPOINT [ "npm", "run", "start-no-prestart" ]
