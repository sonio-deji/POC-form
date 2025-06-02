FROM node:23-slim


WORKDIR /app


RUN apt-get update -y
RUN apt-get install -y openssl

COPY package*.json .

RUN npm install



COPY . .

RUN npx prisma generate
RUN npm run build  
EXPOSE 5000

CMD ["npm", "start"]

