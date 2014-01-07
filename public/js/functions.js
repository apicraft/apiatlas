$(function(){

	
    //functions that should run at the beginning of various pages in app
    var alts = ['resource', 'home', ];
    var preloads = {
        'home': function(){
            var http = ['verbs', 'headers', 'codes'];
            
            //load template
            var template = {};
            var title = {};
			//a bunch of future listeners
			$("#resources").on('click', '.mobile_voting .vote a', function(evt){
				evt.preventDefault(); 
            });
            if($('body').data('auth')){
			$("#resources").on('click', '.mobile_voting .vote', function(){
				
				
					var $context = { 
						'link': 	$(this).find('a').attr('href'),
						'id':	 	$(this).data('parent_resource'),
						'method':   $(this).data('vtype')
					}					
				 	
					$.get($context.link, function(){
                    	console.log('voted on: ', $context.id);
						$('.' + $context.id + ' .content').removeClass('vote_yes');
						$('.' + $context.id + ' .content').removeClass('vote_no');
						if($context.method !== 'vote_remove'){
							$('.' + $context.id + ' .content').addClass($context.method);
						}
						//update the UI!
					});
					
					
						
					
				
				 });
			};
			 
			$("#resources").on('click', '.resource:not(.title) .name', function(){
						//console.log($(this));
                       window.location.href = $(this).find('a').attr('href');
                    });
	
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
                                    //did the user vote on this? 
									//this.self.didVote = user_votes[this.parent.rel][this.self.name.toLowerCase()];
									
                                    this.self.rel = this.parent.rel + "/" + this.self.name.toLowerCase();
                                    this.self.uid = this.self.rel.replace(/\//g, "");
                                    this.target = $("#" + this.self.uid);
                                    
									
									if(typeof(user_votes[r.id]) == 'object'){
										this.self.your_vote = user_votes[r.id][this.self.name.toLowerCase()];
									}else {
										this.self.your_vote = undefined;
									}
									
									if(this.self.your_vote == undefined){
										this.self.vote_class = "";
									}else if (this.self.your_vote == false){
										this.self.vote_class = "vote_no";
									}else {this.self.vote_class = "vote_yes"; }
									//console.log(user_votes[this.parent.rel][this.self.name.toLowerCase()]);
									
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
                                        var render_data = $.extend({}, this.parent, this.self, {"percent": this.self.percent, "percent_display": this.self.percent + "%","votes": this.current.votes.total, "desc": this.current.description, "your_vote": this.self.your_vote, "vote_class": this.self.vote_class });
                                        $t.append(template.render(render_data));
                                        $('#loading').hide();
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
				var req_percent = 0;
				var res_percent = 0;
                if(snapshot.val().votes.total > 0){ 
					percent = Math.round((snapshot.val().votes.up/snapshot.val().votes.total) * 100); 
					if($(".resource").hasClass('resource_header')){ 
						if(snapshot.val().votes.request > 0){
							req_percent = Math.round((snapshot.val().votes.request/snapshot.val().votes.total) * 100);
						}
						if(snapshot.val().votes.response > 0){
							res_percent = Math.round((snapshot.val().votes.response/snapshot.val().votes.total) * 100); 
						}
					}
				}
                var percent_display = percent + "%";
                var barclass = $('.votes').data('color') + "bar_" + percent;
				
                $('.votes  div.total_bar').html(percent_display + " use this");
				$('.vote_count').html(snapshot.val().votes.total + " people voted.");
                $('.votes div.total_bar').removeClass().addClass("total_bar"); 
				$('.votes div.total_bar').addClass(barclass); 
				//update req/res here
				if($(".resource").hasClass('resource_header')){
					var request_class = $('.votes').data('color') + "bar_" + req_percent;
					var response_class = $('.votes').data('color') + "bar_" + res_percent;
					
					$('.votes div.request_bar').removeClass().addClass('request_bar');
					$('.votes div.response_bar').removeClass().addClass('response_bar');
					
					$('.votes div.request_bar').html(req_percent + "% Only use in request").addClass(request_class);
					$('.votes div.response_bar').html(res_percent + "% Only use in response").addClass(response_class);
					
				}
				
                
            });
             $(".controls a").click(function(evt){
                 evt.preventDefault();
				 
				 if($('body').data('auth')){
					console.log($(this).attr('href'));
				 	$.get($(this).attr('href'), function(){
                    	console.log('voted');
					 });
					
					//console.log("controls clarify: ", !$(".controls").is(".vote_request, .vote_response"));
					
					if($(this).hasClass("clarify_request")){
						//toggle
						if(!$(".controls").is(".vote_request, .vote_response")){
							//both true, so toggle req off
							$(".controls").addClass("vote_response");
						}else if( $(".controls").hasClass("vote_response") ){
							$(".controls").removeClass("vote_response");
							$(".controls").addClass("vote_true");
						}
					}
					else if($(this).hasClass("clarify_response")){
						//toggle
						if(!$(".controls").is(".vote_request, .vote_response")){
							//both true, so toggle res off
							$(".controls").addClass("vote_request");
						}else if( $(".controls").hasClass("vote_request") ){
							$(".controls").removeClass("vote_request");
							$(".controls").addClass("vote_true");
						}
					} 
					else {
						$(".controls").removeClass("vote_true vote_false vote_null vote_request vote_response")
						if($(this).hasClass("vote_up")){           $(".controls").addClass("vote_true");	}
						else if($(this).hasClass("vote_down")){    $(".controls").addClass("vote_false");	}
						else if($(this).hasClass("vote_remove")){  $(".controls").addClass("vote_null");	}
					}
				 }else {
					console.log('modal');
				 	window.location.href="#login-confirm";
				 }
                
                 return false;
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



