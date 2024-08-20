module.exports = {
  apps: [{
    script: "npm run dev",
    watch: true,
    // watch_delay: 1000,
    ignore_watch: ["node_modules", "src/components", "src/pages", "src/context", "\\.next", "\\.dist", "tsconfig.tsbuildinfo",".DS_Store","src/test"
    ],
    "env": {
      "DEBUG": "webapp*,-webapp:middleware:auth:*",
    },
  }]
}
