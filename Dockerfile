FROM node:8.15
# Copy and install deps. This is done as a separate step as an optimization, so changes to the programs files
# don't require the npm install to be redone
RUN mkdir -p /opt/cloudstateservice
#COPY node-support /opt/node-support
COPY package.json /opt/cloudstateservice
RUN cd /opt/cloudstateservice && npm install
# Now copy the entire app
COPY . /opt/cloudstateservice
WORKDIR /opt/cloudstateservice
#RUN npm run prestart  
# CA - ^ TODO: this is giving a proto problem (will circle back to deal)
EXPOSE 8080
CMD ["npm", "run", "start-no-prestart"]
