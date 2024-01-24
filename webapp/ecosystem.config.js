module.exports = {
  apps: [{
    script: "npm run dev",
    watch: true,
    // watch_delay: 1000,
    ignore_watch : ["node_modules", "src/components", "src/pages", "\\.next", "\\.dist"],
  }]
}
