# base image
FROM node:20-alpine

# install pnpm
RUN npm install -g pnpm

# set working directory
WORKDIR /app

# copy package files
COPY package.json pnpm-lock.yaml* ./

# install dependencies
RUN pnpm install

# copy source code
COPY . .

# build the application
RUN pnpm run build

# expose port
EXPOSE 4000

# start the application
CMD ["node", "dist/main.js"]