$(function(){
	
    //functions that should run at the beginning of various pages in app
    var alts = ['resource', 'home'];
    var preloads = {
        'home': function(){
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
                                this.current = snap.val();
                                this.self.rel = this.parent.rel + "/" + this.self.name.toLowerCase();
                                this.self.uid = this.self.rel.replace(/\//g, "");
                                this.target = $("#" + this.self.uid);
                                if(this.target.length != 0){
                                    //update!
                                    console.log("update!");
                                    console.log(this.target.find(".votes"));
                                    this.target.find(".votes").html(this.current.votes.up + "/" + this.current.votes.total);
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
             $(".controls a").click(function(){
                $(".controls").removeClass("vote_true vote_false vote_null")
                if($(this).hasClass("vote_up")){            $(".controls").addClass("vote_true");
                }else if($(this).hasClass("vote_down")){    $(".controls").addClass("vote_false");
                }else if($(this).hasClass("vote_remove")){  $(".controls").addClass("vote_null");
                }
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



