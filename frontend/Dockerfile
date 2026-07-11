FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_URL=http://localhost:3000
ARG VITE_INTRANET_URL=http://localhost:8082
ARG VITE_PORTAL_URL=http://localhost:8080

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN VITE_API_URL=$VITE_API_URL \
    VITE_INTRANET_URL=$VITE_INTRANET_URL \
    VITE_PORTAL_URL=$VITE_PORTAL_URL \
    npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
