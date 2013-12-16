$(function(){

	
    //functions that should run at the beginning of various pages in app
    var alts = ['resource', 'home', ];
    var preloads = {
        'home': function(){
            var http = ['verbs', 'headers', 'codes'];
            
            //load template
            var template = {};
            var title = {};
            $.get("./templates/vis_resource.ejs", function(t){
                $.get("./templates/vis_title.ejs", function(t2){
                template.source = t;
                template.render = function(x){ return ejs.render(this.source, x); }
                
                title.source = t2;
                title.render = function(x){ return ejs.render(this.source, x); }
                //Got both templates. Now go back to firebase: 
                
                $target = $("#resources .reflow_0");
                
                for(key in http){
                    var name = http[key];
                    resources[name].refs = {}
                    resources[name].source = new Firebase(resources[name].updateURL);
                    resources[name].counter = 0;
                    resources[name].progress = 0;
                }
                    
                //verbs
                add_group(resources.verbs, $("#resources .reflow_0"));
                add_group(resources.headers,$("#resources .reflow_1"));
                add_group(resources.codes,$("#resources .reflow_2"));
                
                    //reflow once all has been loaded
                    
                function add_group(r, $t){
 
                    r.source.once('value', function(snapshot){
                           $t.append(title.render(r));
                           r.counter = Object.keys(snapshot.val()).length;
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
                                        if($('body').data("auth")){this.user = {"authorized": true}}
                                        var p = randomFromInterval(0, 100);
                                        var render_data = $.extend({}, this.parent, this.self, {"percent": p, "percent_display": p + "%","votes": randomFromInterval(0,200)});
                                        $t.append(template.render(render_data));
                                        this.parent.progress += 1;
                                        try_reflow();
                                    }
                                }, function(){}, {"parent": r, "self": resource});
                           }
                       }, function(){},r); 
                }
                }); //t2
            }); //t
                
                    
                    
                /*   
                for(i in http.verbs){
                    var p = randomFromInterval(0,max_p);
                    $("#resources .reflow_0").append(template.render({"type": "verb", "color": "blue", "percent": p, "percent_display": p + "%", "name": http.verbs[i],"votes": randomFromInterval(0,200) }) );
                    
                }
                    
                //headers
                $("#resources .reflow_0").append(title.render({"color": "pure-hidden-phone clear", "title": "blank"}));
                $("#resources .reflow_0").append(title.render({"color": "green", "title": "headers"}));
                for(i in http.headers){
                    var p = randomFromInterval(0,max_p);
                    var header = template.render({"type": "header", "color": "green", "percent": p, "percent_display": p + "%", "name": http.headers[i],"votes": randomFromInterval(0,200) });
                    
                    $("#resources .reflow_0").append(header);
                    
                    
                }
                
                //codes
                $("#resources .reflow_0").append(title.render({"color": "yellow", "title": "codes"}));
                for(i in http.codes){
                    var p = randomFromInterval(0,max_p);
                    var code = template.render({"type": "code", "color": "yellow", "percent": p, "percent_display": p + "%", "name": http.codes[i],"votes": randomFromInterval(0,200) });
                    
                    $("#resources .reflow_0").append(code);
                    
                }
                
                reflow($("#resources").find(".reflow_0,  .reflow_1 ,  .reflow_2,  .reflow_3,  .reflow_4"),11);
                reflow($("#resources .reflow"),12);
                });
            });
            */
                    
            $(".title_bar a.menu_icon").click(function(){
                //menu show
                if($(".title_bar").hasClass("open_menu")){
                    $(".title_bar").removeClass("open_menu");
                }else{
                    $(".title_bar").addClass("open_menu")
                }
            });
            
            function try_reflow(){
                var flag = true;
                for(key in http){
                    var name = http[key];
                    if(resources[name].counter != resources[name].progress){ flag = false;}
                }
                if(flag == true){
                    console.log(resources);
                    console.log("reflow!");
                    reflow($("#resources").find(".reflow_0,  .reflow_1 ,  .reflow_2,  .reflow_3,  .reflow_4"),11);
                    reflow($("#resources .reflow"),12);
                }
            }
    
            function reflow(target_collection, count){
                //grab all elements of reflow class. 
                target_collection.each(function(){
                    var $next = $(this).next();
                    if($next.length > 0){ //not the last element
                        //if element has too many imediate children, push them over to the next sibling
                        while($(this).children().length > count){
                            $(this).children().last().detach().prependTo($next);
                        }
                        
                    }
                });
            }
        
            
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
    
    function randomFromInterval(from,to) { return Math.floor(Math.random()*(to-from+1)+from); }

});



