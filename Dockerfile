FROM node:current-alpine3.19
LABEL authors="n08i40k"

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm i --omit=dev
RUN npm i prisma

COPY . ./

RUN npm run build

CMD ["chmod", "+x", "/scripts/start.sh"]
ENTRYPOINT ["/bin/bash", "-i", "/scripts/start.sh"]

CMD ["npm", "run", "start:prod"]
