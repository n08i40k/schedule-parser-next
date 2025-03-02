FROM node:current-alpine3.19
LABEL authors="n08i40k"

WORKDIR /app

RUN apk add bash

COPY package.json package-lock.json ./
RUN npm i --omit=dev
RUN npm i prisma

COPY . ./

RUN npm run build

ENTRYPOINT ["chmod +x /scripts/start.sh && /bin/bash /scripts/start.sh"]

CMD ["npm", "run", "start:prod"]
