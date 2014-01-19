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

var resources = {
    "headers":  {"title": "Headers", "type": "header", "updateURL": fbURL + "/resources/headers", "id": "headers", "rel": "/headers", "color": "blue"},
    "verbs":    {"title": "Verbs", "type": "verb", "updateURL": fbURL + "/resources/verbs", "id": "verbs", "rel": "/verbs", "color": "green"},
    "codes":    {"title": "Codes", "type": "code", "updateURL": fbURL + "/resources/codes", "id": "codes", "rel": "/codes", "color": "yellow"}
};

/* next prev cache */
/* Build a chache from firebase resources to keep in memory. Rebuild every so often */
/* it hurts to have to do this with a realtime db, but not having next/prev sibling filtering demands drastic measures */
var resource_cache = {
	cache: [],
	lookup: {},
	keep_alive: 1000 * 60 * 30, /* in miliseconds, 0 to only build on startup */
	rebuild: function(){
		console.log("rebuilding cache...");
		var context = this;
		var tmp_cache = {
			counts: 0,
			content: [],
			index: []
		};
		//walk the "resources" object and keep a reference to each anticipated URL for the resources in question
		for(type in resources){
			tmp_cache.index.push(type);
			var n = new Firebase(resources[type].updateURL);
			n.once('value', function(s){
				for(r in s.val()){
					var a = {
						'resource': r,
						'url': tmp_cache.index[tmp_cache.counts] + "/" + r
					}
					
					tmp_cache.content.push(a);
				}
				tmp_cache.counts ++;
				try_save_cache(tmp_cache.counts);
			});
		}
		
		function try_save_cache(x){
			//only move local tmp_cache into parent this.cache if we've recieved every expected reponse from firebase
			if(x >= Object.keys(resources).length){
				context.cache = tmp_cache.content;
				for(i in tmp_cache.content){
					context.lookup[tmp_cache.content[i].url] = i;
				}
				tmp_cache = null;
				//console.log(context.lookup);
				console.log('cache rebuilt');
			}
			
		}
	},
	init: function(){
		this.rebuild();
		if(this.keep_alive > 0){
			this.repeater = setInterval(this.rebuild.bind(this), this.keep_alive);
		}
	}
}

resource_cache.init();

var gitHubStrategy = new GitHubStrategy({
        clientID: config['GITHUB_CLIENT'],
        clientSecret: config['GITHUB_SECRET'],
        callbackURL: config['REDIRECT'] //change for production
      },oauthCallBack);

function oauthCallBack(accessToken, refreshToken, profile, done){
 //save provider, id, display

	
	var avatar_base = "http://www.gravatar.com/avatar/" + profile._json.gravatar_id;

    var p = {
        "provider": profile.provider,
        "id": profile.id,
        "displayName": profile.displayName,
		"gravatar_id": profile._json.gravatar_id,
		"handle": profile.username,
		"avatars": {
			"small": avatar_base + "?s=30",
			"medium": avatar_base + "?s=75",
			"large": avatar_base + "?s=200",
			"base": avatar_base
		}
    };
    console.log('logging in ',p);

    var user = new Firebase(fbURL + '/users/' + profile.id);
    user.once('value', function(snapshot){
        if(snapshot.val() == null){
            //create that user
            console.log('creating user...');
            var users = new Firebase(fbURL + '/users');
            users.child(p.id).set(p, function(e){
                return done(e,p);
            });
        }else{
            return done(null,p);
        }
    });
}

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    console.log('Deserialize user : ',id);
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
    app.use(express.favicon());

    //setup logging
    app.use(express.logger('dev'));

    //Configure sessions and passport
    app.use(express.cookieParser(config['SESSION_SECRET'])); //make it a good one
    app.use(express.session({secret: config['SESSION_SECRET']}));
    app.use(passport.initialize());
    app.use(passport.session());
    
    // Use the GitHubStrategy within Passport.
    //   Strategies in Passport require a `verify` function, which accept
    //   credentials (in this case, an accessToken, refreshToken, and GitHub
    //   profile), and invoke a callback with a user object.
    passport.use(gitHubStrategy);

    app.use(app.router);
    app.use(function(req,res,next){
        res.statusCode = 404;
        res.render('404', {
                    "page":  "not_found",
                    "user": req.user,
                    "name": "/404"
                });
    });
        
    //Handle "?last=x if available
    app.get('/auth/github', function(req, res, next) {
        if(typeof(req.query.last) == "undefined"){ req.session.last = '/'; }
        else{ req.session.last = req.query.last }
        
          passport.authenticate('github', function(err, user, info) {
            if (err) { 
				console.log("error: ", err);
				return next(err); 
			}
            if (!user) { return res.redirect(req.session.last); }
            req.logIn(user, function(err) {
              if (err) { return next(err); }
              return res.redirect(req.session.last);
            });
          })(req, res, next);
    });


    app.get('/auth/github/callback', 
      passport.authenticate('github', { failureRedirect: '/' }),
      function(req, res) {
        req.session['auth'] = true;
		if(typeof(req.session.last) == "undefined"){ res.redirect('/'); }
        else{ res.redirect(req.session.last); }
    });

    app.get('/logout', function(req, res){

        var last = req.session.last || req.query.last || '/';
        req.session.destroy(function (err) {
            //res.redirect('/'); //Inside a callback… bulletproof!
            //req.session['auth'] = false;
            res.redirect(last);
        });
        //req.logout();            
    });
	app.get('/homepage_content', function(req, res){
		//have the server build the html for the home page!
		var u = getUser(req);
		
		_components = new Firebase(fbURL + "/resources");
		_components.once('value', function(snap){
			var output = "";
			var sorted = [];
			var counter = 2;
			for(i in snap.val()){
				sorted[counter] = i;
				counter--;
			}
			for(i in sorted){
				var group = sorted[i];
				output += ejs.render(resource_title, {"title": group});
				for(k in snap.val()[group]){
					var r = snap.val()[group][k];
					r.percent = 0;
					if(r.votes.total > 0){r.percent = Math.round((r.votes.up/r.votes.total)*100);}
					r.id = group;
					r.color = resources[group].color;
					r.rel = "/" + group + "/" + r.name.toLowerCase();
					r.percent_display = r.percent + "%";
					r.vote_class = "vote_null"
					if(u !== null){
						if(r.votes.raw.hasOwnProperty(u.id)){
						   r.vote_class = "vote_" + r.votes.raw[u.id];
						   }
					}
					var d = r; d.description = r.description;
					//console.log(r.description)
					output += ejs.render(resource_template, d);
				}
			}
			res.writeHead(200, {'Content-Type': 'text/html'});
        	res.write(output);
        	res.end();
		
		});
	    
	});
    //default page
    app.get('/', function(req, res) {
        //should this be automated or stuck in config.js? Not yet, but probably in a more flexible version
		var user_votes = {};
		for(n in resources){
			user_votes[n] = {}
		}
		var page_resources = resources;
		resources.source = fbURL;
		
		if(getUser(req) !== null){
				var getUserVotes = new Firebase(fbURL + '/users/' + getUser(req).id + '/votes/resources');
				getUserVotes.once('value', function(snap){
					user_votes = snap.val();
					res.render(__dirname + '/views/index.ejs', {
						"resources": page_resources,
						"page": "home", 
						"user": getUser(req),
						"name": "",
						"votes": user_votes,
						"data": resources //JSON.stringify(output)
					});
				});

		}else {
			res.render(__dirname + '/views/index.ejs', {
                "resources": resources,
                "page": "home", 
                "user": getUser(req),
                "name": "",
				"votes": user_votes,
                "data": resources //JSON.stringify(output)
        	});
		
		}
        
	});

    app.get('/:type/:title/edit', isLoggedIn, function(req, res){
				if(isAdmin(getUser(req))){
					var user = null;
					var full_user = getUser(req);
					if(full_user !== null){ user = full_user.id; }
					var d = {
						"type": req.params.type,
						"title": req.params.title
					};
					
					d = extend(d, {
						uid:  d.type + d.title,
						name: "resources/" + d.type + "/" + d.title,
						lookup: d.type + "/" + d.title
					});
					
					d.index = resource_cache.lookup[d.lookup];		
					console.log("GET ", d.name);
					
					var resource = new Firebase(fbURL + '/' + d.name);
			
					resource.once('value', function(snap_r){
						var data = snap_r.val();
						console.log(data);
						res.render(__dirname + '/views/edit.ejs',{
							"page": 'edit',
							"user": user,
							"name": d.name,
							"type": d.type,
							"title": d.title,
							"r": data
						});
					});
					
					
				}
				else {
					res.redirect('/' + req.params.type + '/' + req.params.title);
				}
	});

	app.get('/:type/:title', function(req, res){
		
        var user = null;
        var full_user = getUser(req);
        if(full_user !== null){ user = full_user.id; }
        var d = {
            "type": req.params.type,
            "title": req.params.title
        };
		
		d = extend(d, {
			uid:  d.type + d.title,
			name: "resources/" + d.type + "/" + d.title,
			lookup: d.type + "/" + d.title
		});
		console.log(d.uid);
		//if(d.uid != 
		d.index = resource_cache.lookup[d.lookup];		
        console.log("GET ", d.name);
		
        var resource = new Firebase(fbURL + '/' + d.name);

        resource.once('value', function(snap_r){
            //if logged in, we'd look for the user ID in the users up & down objects and raise "you voted" flag
            var data = snap_r.val();
			console.log("data: ", data);
			if(typeof(data.votes) == "undefined"){
				
				data.votes = { 
					down: 0,
     				total: 0,
     				up: 0 
				} 
			}
            if(data === null){
                res.statusCode = 404;
                return res.render('404', {
                    "page":  "not_found",
                    "user": full_user,
                    "name": "/404"
                });
            }
			//console.log('index', d.index + 1);
			data.prev = resource_cache.cache[parseInt(d.index) - 1];
			data.next = resource_cache.cache[parseInt(d.index) + 1];
			
            data.priority = snap_r.getPriority();
            var v = req.query.vote;

            if(user == null)
 				return render_resource();

            //console.log(fbURL + '/users/' + user + '/votes/' + d.name);
            var didVote = new Firebase(fbURL + '/users/' + user + '/votes/' + d.name);

            didVote.once('value', function(snap_d){
                    data.your_vote = snap_d.val();
                    
                    //this if block actually does the voting!
                    if(typeof(v) != "undefined" && user !== null){
    
                        //voting! Yup, that's 18 possible references to update
                        var update = {
                            resource: {
                                self: new Firebase(fbURL + '/' + d.name + '/votes/raw'),
                                down: new Firebase(fbURL + '/' + d.name + '/votes/down'),
                                up: new Firebase(fbURL + '/' + d.name + '/votes/up'),
                                total: new Firebase(fbURL + '/' + d.name + '/votes/total'),
								request: new Firebase(fbURL + '/' + d.name + '/votes/request'),
								response: new Firebase(fbURL + '/' + d.name + '/votes/response'),
                                user: new Firebase(fbURL + '/' + d.name + '/votes/raw/' + user)
                            },
                            user: {
                                self: new Firebase(fbURL + '/users/' + user + '/votes/'),
                                down: new Firebase(fbURL + '/users/' + user + '/votes/down'),
                                up: new Firebase(fbURL + '/users/' + user + '/votes/up'),
                                total: new Firebase(fbURL + '/users/' + user + '/votes/total'),
								request: new Firebase(fbURL + '/users/' + user + '/votes/request'),
								response: new Firebase(fbURL + '/users/' + user + '/votes/response'),
                                resource: new Firebase(fbURL + '/users/' + user + '/votes/' + d.name),
								raw: new Firebase(fbURL + '/users/' + user + '/votes/raw/' + d.uid),
                            },
                            raw: {
                                self: new Firebase(fbURL + '/votes'),
                                total: new Firebase(fbURL + '/votes/total'),
                                user: new Firebase(fbURL + '/votes/' + d.name + '/' + user)
                            }      
                        };

                        function vote(v){
							console.log('voting: ', v);
                            var targetResourceName = d.name;
                            update.resource.self.child(user).set(v);
                            update.user.self.child(targetResourceName).set(v);
                            update.raw.self.child(d.name).child(user).set(v);
                            
                            //update vote for resource
                            update.resource.total.transaction(inc);
                            update.user.total.transaction(inc);
                            update.raw.total.transaction(inc);
                            
                            if(v == true){
                                update.resource.up.transaction(inc);
                                update.user.up.transaction(inc);
							}else if(v == 'request'){
								update.resource.up.transaction(inc);
								update.resource.request.transaction(inc);
								
                                update.user.up.transaction(inc);
								update.user.request.transaction(inc);
							
							}else if(v == 'response'){
								update.resource.up.transaction(inc);
								update.resource.response.transaction(inc);
                            
								update.user.up.transaction(inc);
								update.user.response.transaction(inc);
							
							}else{
                                update.resource.down.transaction(inc);
                                update.user.down.transaction(inc);
                            }
							
                        }

                        function reduceTotals(x){
								console.log('reduce totals');
                                //remove previous votes 
                                update.resource.user.remove();
                                update.user.resource.remove();
								update.user.raw.remove();
                                update.raw.user.remove();
                                
                                //decrement total counters
                                update.resource.total.transaction(dec);
                                update.user.total.transaction(dec);
                                update.raw.total.transaction(dec);
                                
							
                                if(data.your_vote === false){
                                    update.resource.down.transaction(dec);
                                    update.user.down.transaction(dec);
                                }
                                
                                if(data.your_vote === true){
                                    update.resource.up.transaction(dec);
                                    update.user.up.transaction(dec);
                                }
                            	
								if(data.your_vote === 'request'){
									update.resource.up.transaction(dec);
									update.resource.request.transaction(dec);
									
                                    update.user.up.transaction(dec);
									update.user.request.transaction(dec);
								}
							
								if(data.your_vote === 'response'){
									update.resource.up.transaction(dec);
									update.resource.response.transaction(dec);
									
                                    update.user.up.transaction(dec);
									update.user.response.transaction(dec);
								}
							
                        }

                        if(v == "remove" && data.your_vote !== null){
                           console.log("remove vote");
                           reduceTotals(data.your_vote);
                        }

                        if(v == "up" && data.your_vote !== true){
                            //vote up                            
                            if(data.your_vote === false){
                                console.log('changing down to up');
                                reduceTotals(data.your_vote);
                            }
                            vote(true);
                        }

                        if(v == "down" && data.your_vote !== false){
                            //vote down
                            if(data.your_vote === true){
                                console.log('changing up to down');
                                reduceTotals(data.your_vote);
                            }else if(data.your_vote === 'response'){
								console.log('changing response to false');
                                reduceTotals(data.your_vote);
							}else if(data.your_vote === 'request'){
								console.log('changing request to false');
                                reduceTotals(data.your_vote);
							}
                            vote(false);           
                        }
						
						if(v == "request") {
							if(data.your_vote === 'response'){
								console.log('changing response to true');
                                reduceTotals(data.your_vote);
								vote(true);
							}else if (data.your_vote === true){
								console.log('changing true to response');
                                reduceTotals(data.your_vote);
								vote('response');
							}  
						}
						
						if(v == "response") {
							if(data.your_vote === 'request'){
								console.log('changing request to true');
                                reduceTotals(data.your_vote);
								vote(true);
							}else if (data.your_vote === true){
								console.log('changing true to request');
                                reduceTotals(data.your_vote);
								vote('request');
							}  
						}
						
						function dec(c){return c-1;}
						function inc(c){return c+1;}
                        //res.redirect(req._parsedUrl.pathname);
                        res.send(); //dont return anything. should add helpful message for ajax client?
                        
                    }else {
                        render_resource();
                    }
            });
            
            function render_resource(){
                
				var votes_meta = {
					percent: 0,
					percent_display: "0%",
					request: 0,
					request_display: "0%",
					response: 0,
					response_display: "0%"
				}
				
				
				if(data.votes.total > 0){ 
					votes_meta.percent = Math.round((data.votes.up/data.votes.total) * 100); 
					votes_meta.percent_display = votes_meta.percent + "%";
					
					 if(d.type == 'headers'){
						if(data.votes.request > 0){
							votes_meta.request = Math.round((data.votes.request/data.votes.total) * 100); 
							votes_meta.request_display = votes_meta.request + "%";
						}
						if(data.votes.response > 0){
							votes_meta.response = Math.round((data.votes.response/data.votes.total) * 100); 
							votes_meta.response_display = votes_meta.response + "%";
						}
					}
				}
                
               
				data.votes = extend(data.votes, votes_meta);
                data = extend(data, resources[d.type]);
                
				console.log('vote data: ', data.votes);
				
                res.render(__dirname + '/views/resource_show.ejs', {
                    "r": data,
                    "page": "resource",
                    "user": full_user,
                    "name": "/"+ d.type +"/"+ d.title,
                    "updateURL": resource
                });
            	
				
            }
            
            
        });   
       
    });

    app.get('/:page', function(req, res) {
        user = getUser(req);
	  	fs.stat(__dirname + '/views/' + req.params.page + ".ejs", function(err){
	  		if(err){
                res.statusCode = 404;
				res.render('404', {
                    "page":  "not_found",
                    "user": user,
                    "name": "/404"
                });
	  		}else{
	  			res.render(__dirname + '/views/' + req.params.page + ".ejs", {
                    "data": resources,
                    "page": req.params.page,
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

	var resource_template = fs.readFileSync(__dirname + '/views/vis_resource.ejs', 'utf-8');
	var resource_title = fs.readFileSync(__dirname + '/views/vis_title.ejs', 'utf-8');


var port = process.env.PORT || 3000;
app.listen(port);

console.log('Listening on port %d', port);

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on 
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the base url of whatever whas trying to be edited
	res.redirect('/' + req.params.type + '/' + req.params.title);
}

function isAdmin(user){
	var admins = config['ADMINS'];
	if(admins.indexOf(user.id)>-1){
		return true;
	}
	else {
		return false;
	}
}

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
