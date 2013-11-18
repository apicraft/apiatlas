$(function(){
	
    //functions that should run at the beginning of various pages in app
    var alts = ['resource', 'home'];
    var preloads = {
        'home': function(){
        /*
            var fbRefs = []
            for(i in resources){
                //console.log(resources[i].update);
                fbRefs[i] = new Firebase(resources[i].update);
                fbRefs[i].on('value', function(snapshot){
                    console.log("changing", this.title);
                    if(snapshot.val() !== null) {
                        var targetID = this.id;
                        if(typeof(snapshot.val().up) != 'undefined'){
                            $('#' + targetID).find('.votes').html(snapshot.val().up + "/" + snapshot.val().total);
                        }
                    }
                }, function(){}, resources[i]);
            }
        */    
        /*
        "request_headers"
		"request_verbs"
        "response_headers
        "response_codes"
        */
        var template = {};
        $.get("./templates/homepage.ejs", function(t){
            template.source = t;
            template.render = function(x){ return ejs.render(this.source, x); }
            
            for(var i=0; i < resources.length; i++){ 
               resources[i].refs = {};
               resources[i].source = new Firebase(resources[i].updateURL);
               resources[i].source.once('value', function(snapshot){
                   for(name in snapshot.val()){
                    resource = snapshot.val()[name];
                       //console.log(resource);
                       this.refs[name] = new Firebase(this.updateURL + "/" + resource.name.toLowerCase());
                        this.refs[name].on('value', function(snap){
                            this.self.rel = this.parent.rel + "/" + this.self.name.toLowerCase();
                            this.self.uid = this.self.rel.replace(/\//g, "");
                            this.target = $("#" + this.self.uid);
                            if(this.target.length != 0){
                                //update!
                                this.target.find(".votes").html(this.self.votes.up + "/" + this.self.votes.down);
                            } else {
                                //render!
                                this.self.rel = this.parent.rel + "/" + this.self.name.toLowerCase();
                                $("#" + this.parent.id).append(template.render(this.self));
                            }
                        }, function(){}, {"parent": this, "self": resource});
                   }
                   
               }, function(){},resources[i]);
            }
            
        });
        
        
            

            
        }, //end of home  
        'resource': function(){
            var resource = new Firebase(updateURL);
            resource.on('value', function(snapshot){
                $('.votes').html(snapshot.val().votes.up + "/" + snapshot.val().votes.total);
            });
        },
        '*': function(){
            //run before ANY page
        }
    
    }
	preloads['*'](); //helper function for the every-page

    $.each(alts, function(i, val){
        if($('body').hasClass(val)){ preloads[val](); }
    });
	function log(x){console.log(x);} //silence is close at hand
	//$(".resource .verb:first").click();
});



