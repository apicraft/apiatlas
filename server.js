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

    var fb = new Firebase('https://13protons.firebaseio.com/13protons');
    fb.set("hello world!");

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
	  res.render('index', {
	  	"type": "home"
	  });
	});
    
	app.locals({
	  table  : function(list) {
	    var template = fs.readFileSync(__dirname + '/views/table.ejs', 'utf-8');
	    return ejs.render(template, list);
	  },
      message: ""
    
	});

	var port = process.env.PORT || 3000;
	app.listen(port);

	console.log('Listening on port %d', port);

function log(x){
    console.log(x);
}
