API ATLAS
======

API Atals is a web interface for voting on which parts of the HTTP spec you use when designing APIs. It is hosted at [apiatlas.com](http://apiatlas.com).

We used a combination of less, purecss, node.js, and firebase to create this site. If you'd like to get your own copy running, make sure to set your own versions of the environment variables specified in config.js. REDIRECT is the oAuth callback used by your github application. 

##Why we made this
This project was created as a followup to [a session](https://github.com/apicraft/detroit2013/wiki/What-can-we-use-from-HTTP%3F) at the 2013 [API Craft Conference](http://apicraft.org) which asked the question: "What should we be borrowing from the HTTP spec when designing apis?"


##Code to borrow
###Passport
Users are authenticated with a github account via [passport](http://passportjs.org). The first ~120 lines of [server.js](https://github.com/apicraft/apiatlas/blob/master/server.js) contain all the utility fucntions for gettin passport up and running on your site.

###Progress bars
All progress bars on the site are rendered in pure CSS, and take advantage of rendering background gradients. Animations are difficult to achieve (I couldn't make them work), but rendering performance is excellent. A recursive less mixin performs the stylesheet rendering magic for getting 100 classes (1 for each percent) of progress bar in 3 different colors. See the bottom of [styles.less](https://github.com/apicraft/apiatlas/blob/master/public/css/styles.less)

This was an alternative to rendering in JS with the primary consideration being performance on a mobile device while showing over 200 obejects at once on the homepage. 

##Go Vote!
[Apiatlas.com](http://apiatlas.com).

