scrape_configs:
  - job_name: 'http-metrics'
    metrics_path: /metrics
    basic_auth:
      username: ${METRICS_USER}
      password: ${METRICS_PASS}

    static_configs:
      - targets: ['auth-service:3001']
        labels:
          service: auth-service
          display: Auth

      - targets: ['game-service:3002']
        labels:
          service: game-service
          display: Game

      - targets: ['chat-service:3003']
        labels:
          service: chat-service
          display: Chat

      - targets: ['user-service:3004']
        labels:
          service: user-service
          display: User

      - targets: ['websocket-service:3005']
        labels:
          service: websocket-service
          display: WebSocket
