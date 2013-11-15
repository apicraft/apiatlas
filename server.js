/*

2013 Alan Languirand
@13protons

*/

var express = require('express')
    , lessMiddleware = require('less-middleware')
    , http = require('http')
    , url = require('url')
    , fs = require('fs')
    , path = require('path')
    , ejs = require('ejs')
    , passport = require('passport')
    , GitHubStrategy = require('passport-github').Strategy
    , extend = require('node.extend')
    , app = express()
    , Firebase = require('firebase')
    , config = require('./config'); //make sure it's pointing in the right direction. config.js doesn't sync w/ git

    
    var fbURL = config['FIREBASE_FORGE']; //firebase endpoint
    
    //Configure sessions and passport
    app.use(express.cookieParser(config['SESSION_SECRET'])); //make it a good one
    app.use(express.session({secret: config['SESSION_SECRET']}));
    app.use(passport.initialize());
    app.use(passport.session());
    
    // Use the GitHubStrategy within Passport.
    //   Strategies in Passport require a `verify` function, which accept
    //   credentials (in this case, an accessToken, refreshToken, and GitHub
    //   profile), and invoke a callback with a user object.
    passport.use(new GitHubStrategy({
        clientID: config['GITHUB_CLIENT'],
        clientSecret: config['GITHUB_SECRET'],
        callbackURL: "http://localhost:3000/auth/github/callback" //change for production
      },
      function(accessToken, refreshToken, profile, done) {
        // asynchronous verification, for effect...
        process.nextTick(function () {
            //save provider, id, display
            var p = {
                "provider": profile.provider,
                "id": profile.id,
                "displayName": profile.displayName,
            }
            var user = new Firebase(fbURL + '/users/' + profile.id);
            user.once('value', function(snapshot){
                if(snapshot.val() == null){
                    //create that user
                    console.log('creating user...');
                    var users = new Firebase(fbURL + '/users');
                    users.child(p.id).set(p, function(e){
                        if(e){console.log('problem creating user', e);}
                        else{console.log('created user');}
                    });
                }
            });
            console.log('logged in: ', p);
            return done(null, p);
        });
      }
    ));
    
    passport.serializeUser(function(user, done) {
      done(null, user.id);
    });
    
    passport.deserializeUser(function(id, done) {
        var user = new Firebase(fbURL + '/users/' + id);
        user.once('value', function(snapshot){
            done(null, snapshot.val());
        });
    }); 
    
	app.engine('.html', require('ejs').__express);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'html');
    
    //less is more? 
	app.use(lessMiddleware({
	    src      : __dirname + '/public',
	    compress : true
	  }));

	app.use(express.static(path.join(__dirname, 'public'))); //  "public" off of current is root

    //default page
    app.get('/', function(req, res) {
        
        var resources = new Firebase(fbURL + '/resources');
        resources.once('value', function(snapshot){
            var output = [];
            var d = snapshot.val()
            for(var resource in d){
                var data = snapshot.val()[resource];
                var urlFragment = data.direction + "/" + data.type + "/" + data.title;
                output.push({"title": data.title, "votes": data.votes.total, "voteups": data.votes.up, "link": urlFragment, "update": fbURL + '/resources/' + data.direction + data.type + data.title + "/votes", "id": data.direction + "_" + data.type + "_" + data.title})
            }   //how many until this breaks? 
            
            //name = page name used for redirects after login/logout attempts
            //page = a class name used for target styles and the page startup routine isolation in jQuery
            //resources = the big list
            //user = do we have one? Just a github ID and name. All public info, nothing sensetive. 
            res.render('index', {
                "resources": output,
                "page": "home", 
                "user": getUser(req),
                "name": "",
                "data": JSON.stringify(output)
            });
        });
	  
	});

    app.get('/logout', function(req, res){
            if(typeof(req.query.last) == "undefined"){ req.session.last = '/'; }
            else{ req.session.last = req.query.last }
        
            req.logout();
            req.session['auth'] = false;
            res.redirect(req.session.last);
        });

    //Simple login
    //app.get('/auth/github', passport.authenticate('github'));

    //Handle "?last=x if available
    app.get('/auth/github', function(req, res, next) {
        if(typeof(req.query.last) == "undefined"){ req.session.last = '/login'; }
        else{ req.session.last = req.query.last }
        
          passport.authenticate('github', function(err, user, info) {
            if (err) { return next(err); }
            if (!user) { return res.redirect(req.session.last); }
            req.logIn(user, function(err) {
              if (err) { return next(err); }
              return res.redirect(req.session.last);
            });
          })(req, res, next);
    });


    app.get('/auth/github/callback', 
            
      passport.authenticate('github', { failureRedirect: '/login' }),
      function(req, res) {
          req.session['auth'] = true;
        res.redirect(req.session.last);
        
      });


    app.get('/:direction/:type/:title', function(req, res){
        user = null;
        var full_user = getUser(req);
        if(full_user !== null){user = full_user.id;}
        
        var d = {
            "dir": req.params.direction,
            "type": req.params.type,
            "title": req.params.title,
            "name": ""
            
        }
        //var user = req.user.id;
        d.name =  d.dir + d.type + d.title;
        var resource = new Firebase(fbURL + '/resources/' + d.name);
        resource.once('value', function(snap_r){
            //if logged in, we'd look for the user ID in the users up & down objects and raise "you voted" flag
            var data = snap_r.val();
            var v = req.query.vote;
            
            var didVote = new Firebase(fbURL + '/users/' + user + '/votes/resources/' + d.name);
            didVote.once('value', function(snap_d){
                    data.your_vote = snap_d.val();
                    
                    //this if block actually does the voting!
                    if(typeof(v) != "undefined" && user !== null){
                        //voting! Yup, that's 12 possible references to update
                        var update = {
                            resource: {
                                self: new Firebase(fbURL + '/resources/' + d.name + '/votes/raw'),
                                down: new Firebase(fbURL + '/resources/' + d.name + '/votes/down'),
                                up: new Firebase(fbURL + '/resources/' + d.name + '/votes/up'),
                                total: new Firebase(fbURL + '/resources/' + d.name + '/votes/total'),
                                user: new Firebase(fbURL + '/resources/' + d.name + '/votes/raw/' + user)
                            },
                            user: {
                                self: new Firebase(fbURL + '/users/' + user + '/votes/resources'),
                                down: new Firebase(fbURL + '/users/' + user + '/votes/down'),
                                up: new Firebase(fbURL + '/users/' + user + '/votes/up'),
                                total: new Firebase(fbURL + '/users/' + user + '/votes/total'),
                                resource: new Firebase(fbURL + '/users/' + user + '/votes/resources/' + d.name)
                            },
                            raw: {
                                self: new Firebase(fbURL + '/votes'),
                                total: new Firebase(fbURL + '/votes/total'),
                                user: new Firebase(fbURL + '/votes/' + d.name + '/' + user)
                            }
                                
                        }
                        function vote(boolean){
                            var targetResourceName = d.name;
                            update.resource.self.child(user).set(boolean);
                            update.user.self.child(targetResourceName).set(boolean);
                            update.raw.self.child(d.name).child(user).set(boolean);
                            
                            //update vote for resource
                            update.resource.total.transaction(function(c) { return c + 1; });
                            update.user.total.transaction(function(c) { return c + 1; });
                            update.raw.total.transaction(function(c) { return c + 1; });
                            
                            if(boolean){
                                update.resource.up.transaction(function(c) { return c + 1; });
                                update.user.up.transaction(function(c) { return c + 1; });
                            }else{
                                update.resource.down.transaction(function(c) { return c + 1; });
                                update.user.down.transaction(function(c) { return c + 1; });
                            }

                        }
                        function reduceTotals(){
                                update.resource.total.transaction(function(c) { return c - 1; });
                                update.user.total.transaction(function(c) { return c - 1; });
                                update.raw.total.transaction(function(c) { return c - 1; });
                        }
                                               
                        if(v == "up" && data.your_vote !== true){
                            //vote up                            
                            if(data.your_vote === false){
                                
                                console.log('changing down to up');
                                //remove previous votes 
                                update.resource.user.remove();
                                update.user.resource.remove();
                                update.raw.user.remove();
                                
                                //decrement total counters
                                update.resource.down.transaction(function(c) { return c - 1; });
                                update.user.down.transaction(function(c) { return c - 1; });
                                
                                reduceTotals();
  
                            }
                            //increase up votes 
                            vote(true);
                            
                        }if(v == "down" && data.your_vote !== false){
                            //vote down
                            if(data.your_vote === true){
                                console.log('changing up to down');
                                //remove previous votes 
                                update.resource.user.remove();
                                update.user.resource.remove();
                                update.raw.user.remove();
                                
                                //decrement total counters
                                update.resource.up.transaction(function(c) { return c - 1; });
                                update.user.up.transaction(function(c) { return c - 1; });
                                
                                reduceTotals();

                            }
                            vote(false);           
                        }
                        res.redirect(req._parsedUrl.pathname);
                    }else {
                        res.render(__dirname + '/views/resource_show.ejs', {
                            "r": data,
                            "page": "resource",
                            "user": full_user,
                            "name": "/" + d.dir +"/"+ d.type +"/"+ d.title
                            
                        });
                    }
                    
                    
            });
            
        });   
       
    });

    app.get('/:page', function(req, res) {
        user = getUser(req);
	  	fs.stat(__dirname + '/views/' + req.params.page + ".ejs", function(err){
	  		if(err){
				res.render('404', {
                    "page":  "not_found",
                    "user": user,
                    "name": "/404"
                });
	  		}else{
	  			res.render(__dirname + '/views/' + req.params.page + ".ejs", {
                    "page": "page",
                    "user": user,
                    "name": "/" + req.params.page
                });
	  			
	  		}
	  	});

	});

    /*
	app.locals({
	  table  : function(list) {
	    var template = fs.readFileSync(__dirname + '/views/table.ejs', 'utf-8');
	    return ejs.render(template, list);
	  },
      message: ""
    
	});
*/
	var port = process.env.PORT || 3000;
	app.listen(port);

	console.log('Listening on port %d', port);

    function getUser(req){
        var user = null;
        if(typeof(req.user) != 'undefined'){ 
            user = req.user ;
        }
        return user;
    }

function log(x){
    console.log(x);
}
