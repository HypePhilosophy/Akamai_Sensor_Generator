ARG IMAGE_VERSION

FROM node:${IMAGE_VERSION}

# main wrkdir
WORKDIR /usr/src/app

# copy pkg
COPY package*.json ./

# install pkg
RUN npm install

# copy everything over to wrkdir
COPY . .

EXPOSE 3000

CMD ["npm", "run", "server"]