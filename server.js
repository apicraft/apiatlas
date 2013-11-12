var express = require('express')
    , lessMiddleware = require('less-middleware')
    , http = require('http')
    , url = require('url')
    , fs = require('fs')
    , path = require('path')
    , ejs = require('ejs')
    , extend = require('node.extend')
    , app = express()
    , Firebase = require('firebase');

/*
    var resources = new Firebase('https://13protons.firebaseio.com/http4apis/resources');
    resources.on('value', function(snapshop){
        console.log("resources: ", snapshot.val());
    });
*/  

    var user = "1234";
    var fbURL = "https://13protons.firebaseio.com/http4apis";
    
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
                output.push({"title": data.title, "votes": data.votes.total, "voteups": data.votes.up, "link": data.direction + "/" + data.type + "/" + data.title})
            }            
            res.render('index', {
                "resources": output
            });
        });
	  
	});
    app.get('/:direction/:type/:title', function(req, res){
        var d = {
            "dir": req.params.direction,
            "type": req.params.type,
            "title": req.params.title,
            "name": ""
        }
        
        d.name =  d.dir + d.type + d.title;
        var resource = new Firebase(fbURL + '/resources/' + d.name);
        resource.once('value', function(snap_r){
            //if logged in, we'd look for the user ID in the users up & down objects and raise "you voted" flag
            var data = snap_r.val();
            var v = req.query.vote;
            
            var userVotes = new Firebase(fbURL + '/users/' + user + '/votes');
            var didVote = new Firebase(fbURL + '/users/' + user + '/votes/resources/' + d.name);
            didVote.once('value', function(snap_d){
                userVotes.once('value', function(snap_u){
                    data.your_vote = snap_d.val();
                    
                    if(typeof(v) != "undefined"){
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
                                self: new Firebase(fbURL + '/users/' + user),
                                down: new Firebase(fbURL + '/users/' + user + '/votes/down'),
                                up: new Firebase(fbURL + '/users/' + user + '/votes/up'),
                                total: new Firebase(fbURL + '/users/' + user + '/votes/total'),
                                resource: new Firebase(fbURL + '/users/' + user + '/votes/resources/' + d.name);
                            },
                            raw: {
                                self: new Firebase(fbURL + '/raw'),
                                total: new Firebase(fbURL + '/raw/total'),
                                user: new Firebase(fbURL + '/raw/' + d.name + '/' + user)
                            }
                                
                        }
                        function vote(boolean){
                            update.resource.self.push({user: boolean});
                            update.user.self.child('votes').child('resources').push({d.name: boolean});
                            update.raw.self.child(d.name).push({user: boolean});
                        }
                                               
                        if(v == "up" && data.your_vote !== true){
                            //vote up                            
                            if(data.your_vote === false){
                                //reduce down votes
                                console.log('changing down to up');
                                
                                //remove vote from resource
                                update.resource.down.transaction(function(c) { return c - 1; });
                                update.resource.total.transaction(function(c) { return c - 1; });
                                //remove vote from user
                                update.user.down.transaction(function(c) { return c - 1; });
                                update.user.total.transaction(function(c) { return c - 1; });
                                //remove vote from raw
                                update.raw.total.transaction(function(c) { return c - 1; });
                                
                                //remove previous votes 
                                update.resource.user.remove();
                                update.user.resource.remove();
                                update.raw.user.remove();
                                
                            }
                            //increase up votes 
                            vote(true);
                            
                        }if(v == "down" && data.your_vote !== false){
                            //vote down
                            if(data.your_vote === true){
                                //reduce up votes first 
                                
                                //remove previous votes 
                                update.resource.user.remove();
                                update.user.resource.remove();
                                update.raw.user.remove();
                            }
                            vote(false);
                            
                        }
                    }
                    
                    res.render(__dirname + '/views/resource_show.ejs', {
                        "r": data
                    });
                });
            });
            
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

function log(x){
    console.log(x);
}
