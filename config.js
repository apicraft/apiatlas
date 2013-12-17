function Config() {
  this.port = process.env.PORT || 3000;
  this.proxyUrl = process.env.PROXY_URL || 'http://localhost:3001';

  this.GITHUB_CLIENT = process.env.GITHUB_CLIENT;
  this.GITHUB_SECRET = process.env.GITHUB_SECRET;
  this.FIREBASE_FORGE = process.env.FIREBASE_FORGE;
  
  this.SESSION_SECRET = process.env.SESSION_SECRET;
}

module.exports = new Config();
