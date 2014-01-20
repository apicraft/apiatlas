function Config() {
  this.port = process.env.PORT || 3000;
  this.proxyUrl = process.env.PROXY_URL || 'http://localhost:3001';

  this.GITHUB_CLIENT = process.env.GITHUB_CLIENT;
  this.GITHUB_SECRET = process.env.GITHUB_SECRET;
  this.FIREBASE_FORGE = process.env.FIREBASE_FORGE;
  
  this.SESSION_SECRET = process.env.SESSION_SECRET;
  this.REDIRECT=process.env.REDIRECT
  this.ADMINS=JSON.parse(process.env.ADMINS);
 
  this.MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
}

module.exports = new Config();
