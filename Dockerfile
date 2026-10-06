FROM ubuntu:24.04

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    curl \
    zip \
    unzip \
    tar \
    pkg-config \
    ca-certificates \
    socat \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN git clone https://github.com/microsoft/vcpkg.git /opt/vcpkg

RUN /opt/vcpkg/bootstrap-vcpkg.sh -disableMetrics

RUN cmake -S . -B build \
    -DCMAKE_TOOLCHAIN_FILE=/opt/vcpkg/scripts/buildsystems/vcpkg.cmake \
    && cmake --build build --config Release

EXPOSE 10000

CMD ["sh", "-c", "./build/payroll_api & exec socat TCP-LISTEN:${PORT:-10000},fork,reuseaddr TCP:127.0.0.1:18080"]