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
                
                //$target = $("#resources .reflow_0");
                $target = $("#resources");
					
                for(key in http){
                    var name = http[key];
                    resources[name].refs = {}
                    resources[name].source = new Firebase(resources[name].updateURL);
                    resources[name].counter = 0;
                    resources[name].progress = 0;
                }
                    
                
                /*
				add_group(resources.verbs, $("#resources .reflow_0"));
                add_group(resources.headers,$("#resources .reflow_1"));
                add_group(resources.codes,$("#resources .reflow_2"));
				*/
					
				add_group(resources.verbs, $("#resources"));
                add_group(resources.headers,$("#resources"));
                add_group(resources.codes,$("#resources"));
					
					
                
                    
                function add_group(r, $t){
 
                    r.source.once('value', function(snapshot){
                           
                           r.counter = Object.keys(snapshot.val()).length;
                           for(name in snapshot.val()){
                               resource = snapshot.val()[name];
                               //console.log(resource);
                               this.refs[name] = new Firebase(this.updateURL + "/" + resource.name.toLowerCase());
                                this.refs[name].on('value', function(snap){
                                    if(this.parent.progress == 0){$t.append(title.render(r));}
									this.current = snap.val();
                                    
                                    this.self.percent = 0;
                                    if(this.current.votes.total > 0){
                                        this.self.percent = Math.round((this.current.votes.up/this.current.votes.total) * 100);
                                    }
                                    
                                    this.self.rel = this.parent.rel + "/" + this.self.name.toLowerCase();
                                    this.self.uid = this.self.rel.replace(/\//g, "");
                                    this.target = $("#" + this.self.uid);
                                    
                                    if(this.target.length != 0){
                                        //update!
                                        console.log("update!");
                                        var remove_class = this.target.data('color') + "bar_" + this.target.data('percent');
                                        var add_class = this.target.data('color') + "bar_" + this.self.percent;
                                        this.target.data('percent', this.self.percent);
                                        
                                        this.target.find(".votes").html(this.current.votes.total);
                                        this.target.find(".percent").html(this.self.percent + "%");
                                        this.target.find(".content").removeClass(remove_class).addClass(add_class);
                                        
                                        
                                    } else {
                                        //render!
                                        if($('body').data("auth")){this.user = {"authorized": true}}
                                        var p = randomFromInterval(0, 100);
                                        var render_data = $.extend({}, this.parent, this.self, {"percent": this.self.percent, "percent_display": this.self.percent + "%","votes": this.current.votes.total});
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
                    //reflow($("#resources").find(".reflow_0,  .reflow_1 ,  .reflow_2,  .reflow_3,  .reflow_4"),11);
                    //reflow($("#resources .reflow"),12);
                    $(".resource:not(.title)").click(function(){
                        window.location.href = $(this).data('link');
                    });
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
                
                var percent = 0;
                if(snapshot.val().votes.total > 0){ percent = Math.round((snapshot.val().votes.up/snapshot.val().votes.total) * 100); }
                var percent_display = percent + "%";
                var barclass = $('.votes').data('color') + "bar_" + percent;
                $('.votes div').html(snapshot.val().votes.total + " votes. " + percent_display + " usage.");
                $('.votes div').removeClass().addClass(barclass);
                
            });
             $(".controls a.vote").click(function(){
                event.preventDefault();
				 if($('body').data('auth')){
					console.log($(this).attr('href'));
				 	$.get($(this).attr('href'), function(){
                    console.log('voted');
					 });
					 $(".controls").removeClass("vote_true vote_false vote_null")
					if($(this).hasClass("vote_up")){            $(".controls").addClass("vote_true");
					}else if($(this).hasClass("vote_down")){    $(".controls").addClass("vote_false");
					}else if($(this).hasClass("vote_remove")){  $(".controls").addClass("vote_null");
					}
				 }else {
					 console.log('modal');
				 	window.location.href="#login-confirm";
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



