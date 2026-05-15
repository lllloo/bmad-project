FROM nginx:1.27-alpine

# 拿掉預設 conf，由我們的反代設定接管
RUN rm /etc/nginx/conf.d/default.conf

COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
