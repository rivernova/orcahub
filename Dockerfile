FROM node:20-alpine AS frontend-builder
WORKDIR /app/web/frontend
COPY web/package.json web/pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY web/frontend/ .
RUN pnpm build

FROM golang:1.23-alpine AS go-builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

COPY --from=frontend-builder /app/web/dist ./web/dist

RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w" \
    -o /bin/orcahub \
    ./cmd/orcahub

FROM alpine:3.19
# Necesario para hablar con el Docker socket
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=go-builder /bin/orcahub .

EXPOSE 8080
ENTRYPOINT ["./orcahub"]