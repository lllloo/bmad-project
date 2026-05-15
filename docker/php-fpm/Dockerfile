# W0 spike — 用 8.4 而非 8.3：composer container 預設 PHP 8.4 install vendor，
# 對應的 platform-check 要 runtime 也是 8.4+。AR19 鎖「PHP 8.3+」，8.4 合法。
FROM php:8.4-fpm-alpine

# 系統相依
RUN apk add --no-cache \
        bash \
        git \
        unzip \
        libzip-dev \
        zip \
        oniguruma-dev \
        postgresql-dev \
        autoconf \
        g++ \
        make \
        linux-headers

# PHP 擴充：pdo_pgsql / mbstring / zip / bcmath
RUN docker-php-ext-install \
        pdo \
        pdo_pgsql \
        mbstring \
        zip \
        bcmath

# composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/backend

# PHP-FPM 預設 listen 9000
EXPOSE 9000

CMD ["php-fpm", "-F"]
