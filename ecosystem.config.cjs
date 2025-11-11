// PM2 Configuration for Development Environment
module.exports = {
  apps: [
    {
      name: 'smartpolis-portal',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=smartpolis-db --local --ip 0.0.0.0 --port 3000',
      cwd: '/home/user/webapp',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
}
