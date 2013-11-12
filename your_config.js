function Config() {
  this.port = process.env.PORT || 3000;
  this.proxyUrl = process.env.PROXY_URL || 'http://localhost:3001';

  this.GITHUB_CLIENT = "your github client id";
  this.GITHUB_SECRET = "your github secret";
  this.FIREBASE_FORGE = "https://[dbname].firebaseio.com/[appname]"
  
  this.SESSION_SECRET = "shhhhh";
}

module.exports = new Config();
