$(function(){

	if(typeof window.orientation !== 'undefined'){console.log("mobile - time to paginate");}
	else {console.log('desktop');}
    //functions that should run at the beginning of various pages in app
    var alts = ['resource', 'home', ];
    var preloads = {
        'home': function(){
           
			$.get("/homepage_content", function(t){
               $("#resources").html(t);
				
					var _components = new Firebase(resources.source + "/resources");
					_components.once("value", function(snap){
						var components = snap.val();
						console.log(components);
						//render all components onto page
						
					});
					//register on change events
					var _comp = {
						"headers": resources.headers.updateURL,
						"codes": resources.codes.updateURL,
						"verbs": resources.verbs.updateURL,
					}
					$.each(_comp, function(i){
						var c = new Firebase(this.toString());
						c.on("child_changed", function(child, prevChild){
							updateChild(child, prevChild, i);
						},this);
					});
					function updateChild(c, p, g){
						var target = c.val();
						target.id =g+target.name.toLowerCase();
						target.percent = 0;
						if(target.votes.total > 0){ target.percent = Math.round((target.votes.up/target.votes.total) * 100);}
						target.t = $("#" + target.id);
						target.t.find(".votes").html(target.votes.total + " Responses");
						if(target.t.find(".bar").hasClass("percent_" + target.percent)){
						   //no action req
						   }
						else {
						   var classes = "bar percent "+target.t.data('color')+"bar_"+target.percent+" percent_"+target.percent
						   target.t.find(".bar").removeClass().addClass(classes);
						   target.t.find(".bar .tip").html(target.percent + "% use it");
						   if(target.percent > 50){
						   		target.t.find(".bar .tip").removeClass("left right").addClass("right");
						   }else {
						   		target.t.find(".bar .tip").removeClass("left right").addClass("left");
						   }
						  }
						target.t.data("percent") = target.percent;
					}
				$(".resource:not(.title) .name").on('click', function(e){
					//console.log($(this));
					window.location.href = $(this).find('a').attr('href');
					
				});
			
				$('.resource:not(.title) a.votes').on('click', function(e){
					//console.log($(this));
					e.preventDefault();
					
				});	
            }); //t
                   
            $(".title_bar a.menu_icon").click(function(){
                //menu show
                if($(".title_bar").hasClass("open_menu")){
                    $(".title_bar").removeClass("open_menu");
                }else{
                    $(".title_bar").addClass("open_menu")
                }
            });
       
        
            
}, //end of home  
       
        'resource': function(){
            var resource = new Firebase(updateURL);
            resource.on('value', function(snapshot){
                console.log($('.resource_show').data('color'));
                var percent = 0;
				var req_percent = 0;
				var res_percent = 0;
                if(snapshot.val().votes.total > 0){ 
					percent = Math.round((snapshot.val().votes.up/snapshot.val().votes.total) * 100); 
					if($(".resource_show").hasClass('resource_header')){ 
						if(snapshot.val().votes.request > 0){
							req_percent = Math.round((snapshot.val().votes.request/snapshot.val().votes.total) * 100);
						}
						if(snapshot.val().votes.response > 0){
							res_percent = Math.round((snapshot.val().votes.response/snapshot.val().votes.total) * 100); 
						}
					}
				}
                var percent_display = percent + "%";
                var barclass = $('.resource_show').data('color') + "bar_" + percent + " percent_" + percent;
				
				
				
                $('.content  .bar .tip').html(percent_display + " use it");
				$('.vote_meta .votes').html(counts(snapshot.val().votes.total));
                $('.content .bar').removeClass().addClass("bar percent " + barclass); 

				//update req/res here
				if($(".resource_show").hasClass('resource_header')){
					var request_class = $('.resource_show').data('color') + "bar_" + req_percent;
					var response_class = $('.resource_show').data('color') + "bar_" + res_percent;
					
					$('.content div.request_bar').removeClass().addClass('request_bar ' + request_class);
					$('.content div.response_bar').removeClass().addClass('response_bar ' + response_class);
					
					$('.content div.request_bar').html(req_percent + "% Only use in request");
					$('.content div.response_bar').html(res_percent + "% Only use in response");
					
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
							$(".controls").removeClass("vote_true vote_yes vote_no vote_false vote_null vote_request vote_response")
							$(".controls").addClass("vote_true");
						}
					} 
					else {
						$(".controls").removeClass("vote_true vote_yes vote_no vote_false vote_null vote_request vote_response")
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
			$("body").on('click', '.voting_controls  .vote', function(e){
				e.preventDefault();
				if($('body').data('auth')){
					var $context = { 
						'link': 	$(this).attr('href'),
						'id':	 	$(this).data('parent_resource'),
						'method':   $(this).data('vtype')
					}					
				 	
					$.get($context.link, function(){
                    	console.log('voted on: ', $context.id);
						$('.' + $context.id + ' .voting_controls').removeClass('vote_yes vote_true');
						$('.' + $context.id + ' .voting_controls').removeClass('vote_no vote_false');
						if($context.method !== 'vote_remove'){
							$('.' + $context.id + ' .voting_controls').addClass($context.method);
						}
						//update the UI!
					});
					
					
						
				}else {
					console.log('modal');
				 	window.location.href="#login-confirm";
				}	
				
			});

        }
    
    }
	preloads['*'](); //helper function for the every-page
    
    $.each(alts, function(i, val){
        if($('body').hasClass(val)){ preloads[val](); }
    });
	function log(x){console.log(x);} //silence is close at hand
	//$(".resource .verb:first").click();
    
    function randomFromInterval(from,to) { return Math.floor(Math.random()*(to-from+1)+from); }
	function counts(x){
		if(x == 1){ return x + " Response";}
		else { return x + " Responses";}
	}
});



