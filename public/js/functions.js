$(function(){
	
    //functions that should run at the beginning of various pages in app
    var alts = ['resource', 'home'];
    var preloads = {
        'home': function(){
            fbRefs = []
            for(i in resources){
                //console.log(resources[i].update);
                fbRefs[i] = new Firebase(resources[i].update);
                fbRefs[i].on('value', function(snapshot){
                    console.log(this);
                    if(snapshot.val() !== null) {
                        var targetID = this.id;
                        $('#' + targetID).find('.votes').html(this.voteups + "/" + this.votes);
                    }
                }, function(){}, resources[i]);
            }
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



