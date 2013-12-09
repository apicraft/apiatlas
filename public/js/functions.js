$(function(){

	
    //functions that should run at the beginning of various pages in app
    var alts = ['resource', 'home', 'grid', 'vis'];
    var preloads = {
        'vis': function(){
            var http = {"verbs":["GET","POST","PUT","DELETE","OPTIONS","TRACE","CONNECT","PATCH","HEAD"],"headers":["Accept","Accept-Charset","Accept-Datetime","Accept-Encoding","Accept-Language","Authorization","Cache-Control","Connection","Content-Length","Content-MD5","Content-Type","Cookie","Date","Expect","From","Host","If-Match","If-Modified-Since","If-None-Match","If-Range","If-Unmodified-Since","Max-Forwards","Origin","Pragma","Proxy-Authorization","Range","Referer","Upgrade","User-Agent","Warning","Via","TE"],"codes":["100","101","102","200","201","202","203","204","205","206","207","208","226","300","301","302","303","304","305","307","308","400","401","402","403","404","405","406","407","408","409","410","411","412","413","414","415","416","417","419","420","422","423","424","425","426","428","429","431","444","449","450","451","494","495","496","497","499","500","501","502","503","504","505","506","507","508","509","510","511"]}
            console.log(http);
            
            //load template
            var template = {};
            var title = {};
            $.get("./templates/vis_resource.ejs", function(t){
                $.get("./templates/vis_title.ejs", function(t2){
                template.source = t;
                template.render = function(x){ return ejs.render(this.source, x); }
                
                title.source = t2;
                title.render = function(x){ return ejs.render(this.source, x); }
                var max_p = 100;
                //verbs
                $(".col.verbs").append(title.render({"color": "blue", "title": "verbs"}));
                for(i in http.verbs){
                    var p = randomFromInterval(0,max_p);
                    $(".col.verbs").append(template.render({"type": "verb", "color": "blue", "percent": p, "percent_display": p + "%", "name": http.verbs[i],"votes": randomFromInterval(0,200) }) );
                    
                }
                //headers
                $(".col.headers_0").append(title.render({"color": "green", "title": "headers"}));
                for(i in http.headers){
                    var p = randomFromInterval(0,max_p);
                    var header = template.render({"type": "header", "color": "green", "percent": p, "percent_display": p + "%", "name": http.headers[i],"votes": randomFromInterval(0,200) });
                    if(i < 10){ $(".col.headers_0").append(header); }
                    else if(i < 21){ $(".col.headers_1").append(header); }
                    else{ $(".col.headers_2").append(header); }
                    
                }
                
                //codes
                $(".col.codes_0").append(title.render({"color": "yellow", "title": "codes"}));
                for(i in http.codes){
                    var p = randomFromInterval(0,max_p);
                    var code = template.render({"type": "code", "color": "yellow", "percent": p, "percent_display": p + "%", "name": http.codes[i],"votes": randomFromInterval(0,200) });
                    if(i < 10){ $(".col.codes_0").append(code); }
                    else if(i < 22){ $(".col.codes_1").append(code); }
                    else if(i < 34){ $(".col.codes_2").append(code); }
                    else if(i < 46){ $(".col.codes_3").append(code); }
                    else if(i < 58){ $(".col.codes_4").append(code); }
                    else{ $(".col.codes_5").append(code); }
                    
                }

                });
            });
            
        },
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



