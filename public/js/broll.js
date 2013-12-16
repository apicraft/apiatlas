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