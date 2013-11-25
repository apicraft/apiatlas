$(function(){

	
    //functions that should run at the beginning of various pages in app
    var alts = ['resource', 'home', 'grid'];
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
                                    if($('body').data("auth")){this.user = {"authorized": true}}
                                    $("#" + this.parent.id).append(template.render(this.self));
                                }
                            }, function(){}, {"parent": this, "self": resource});
                       }
                   }, function(){},resources[i]);
                }
            });
            
        }, //end of home  
        
        'grid': function(){
            
            $("#expand_resources").click(function(){
                if($("#bar_chart").hasClass("expanded")){
                    $("#bar_chart").removeClass("expanded");
                }else{
                    $("#bar_chart").addClass("expanded");
                }    
            });
            
            $(document).on("click mouseenter", "#heatmap .resource", function(){
                var targetId = "#" + $(this).data("source");
                $("#heatmap_focus table tr").remove();
                $(targetId).clone().appendTo("#heatmap_focus table");
            });
            
            var home_template = {};
            var grid_template = {};
            $.get("./templates/homepage.ejs", function(ht){
            $.get("./templates/grid.ejs", function(gt){
                home_template.source = ht;
                grid_template.source = gt;
                grid_template.render = function(x){ return ejs.render(this.source, x); }
                home_template.render = function(x){ return ejs.render(this.source, x); }
                
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
                                    this.self.percent = randomFromInterval(0,100);
                                    
                                    if($('body').data("auth")){
                                        this.self.user = {"authorized": true};
                                    }
                                    $("#heatmap").append(grid_template.render(this.self));
                                    $("#" + this.parent.id).append(home_template.render(this.self));
                                }
                            }, function(){}, {"parent": this, "self": resource});
                       }
                   }, function(){},resources[i]);
                }
                
            });
            });
        }, //end of grid 
        
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
    
    function randomFromInterval(from,to) { return Math.floor(Math.random()*(to-from+1)+from); }
    function hslFromPercent(p){
        //this returns a color object with {h: "", s: "", l: ""} that is p percent along a 3 part gradient from white [hsl(60,100,100)] to yellow [hsl(60,100,50)] to red [hsl(0,100,50)]
        var color = {h: 60, s: "100%", l: 100}
        if(p<=50){ color.l = color.l-p + "%";
        }else {
            color.l = "50%";
            color.h = Math.round(color.h * ((p-50) * .02))
        }
        
        return color;
        
    }
});



