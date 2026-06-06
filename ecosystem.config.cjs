module.exports = {
  apps: [
    {
      name: "ready-deliveries-api",
      script: "dist-api/main.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        ENVIROMENT: "local",
      },
    },
    {
      name: "ready-deliveries-web",
      script: "server.mjs",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: "3001",
      },
    },
  ],
};
