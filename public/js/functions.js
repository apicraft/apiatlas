$(function(){
	
    //functions that should run at the beginning of various pages in app
    var alts = ['resource', 'home'];
    var preloads = {
        'home': function(){
            $(window).load(function(){
                $t = $("#hero.resource h1");
                if($t.text().length > 8){
                    $("#hero").addClass("fit");
                    $t.fitText(.7);
                }
                if($t.text().length > 12){
                    $t.fitText(.9);
                }
            });
            $(window).scroll(UpdateTableHeaders).trigger("scroll");
            
            function UpdateTableHeaders() {
                if($(window).scrollTop() > $(".persistent_header").eq(0).offset().top){
                    $(".floating_header").addClass("active");
                   } else {
                       $(".floating_header").removeClass("active");
                   };
               $(".persistent_header").each(function() {
               
                   var el             = $(this),
                       offset         = el.offset(),
                       scrollTop      = $(window).scrollTop()
                   
                   if (scrollTop > offset.top){
                        //a header is visible
                       $(".floating_header").html(el.html());
                   } 
                   return;
               });
            } //UpdateTableHeaders
        }, 
        'resource': function(){
            //load the page's data
            $.getJSON(updateUrl, function(d){
                    updatePage(d);
            });
            
            $("#vote .button.ok, #vote .button.remove").click(function(event){
                event.preventDefault();
                if(!$(this).hasClass('active')){
                    $("#vote .button").removeClass('active');
                    $(this).addClass('active');
                    $('#usage_graph').html("updating...");
                    $.getJSON($(this).attr('href'), function(d){
                        updatePage(d);
                    });
                }
            });
            
            function updatePage(d){
                $('#usage_graph').removeClass().addClass("bar_" + d.percent).html(d.percent + "%");
                $("#vote_meta .assertion").html(d.status.assertion);
                $("#vote_meta .punctuation").html(d.status.punctuation);
                $("#vote_meta .votes").html(d.votes);
                
                $("#vote .button.ok, #vote .button.remove").removeClass("active");
                if(d.your_vote === true){ $("#vote .button.ok").addClass("active");}
                if(d.your_vote === false){ $("#vote .button.remove").addClass("active");}
            }
            
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



