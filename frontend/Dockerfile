FROM node:18-slim

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]