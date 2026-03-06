FROM nginx:alpine
RUN apk add --no-cache openssl
COPY . /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/40-init-cert.sh /docker-entrypoint.d/40-init-cert.sh
RUN chmod +x /docker-entrypoint.d/40-init-cert.sh
EXPOSE 80 443
