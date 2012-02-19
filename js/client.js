var app = Sammy('#main', function() {    
    this.use('Mustache', 'ms');
    
    this.get('/statusnet_js_mashup_2nd', function() {
        this.trigger('getFeed');
    });
    this.get('/statusnet_js_mashup_2nd/Login', function() {
        if (oauth2.authParameters && oauth2.authParameters['access_token']) {
            this.redirect('/statusnet_js_mashup_2nd');
        }
        this.partial('/statusnet_js_mashup_2nd/js/templates/login.ms');
    });
    this.post('/statusnet_js_mashup_2nd/Login', function() {
        var consumerKey = '71b454c797a58e8de5df33137e95cb8c';
        window.open('http://dev.status.net:8080/index.php/api/oauth2/authorize?response_toke=token&client_id=' + consumerKey, 'StatusNetLoginPopup', 'width=400&height=400');
    });
    this.bind('loggedIn', function() {
        this.redirect('/statusnet_js_mashup_2nd');
    });
    this.get('/statusnet_js_mashup_2nd/Logout', function() {
        $('#logout-link').hide();
        oauth2.deleteAccessToken();
        this.redirect('/statusnet_js_mashup_2nd');
    });
    
    this.post('/statusnet_js_mashup_2nd/Feed', function() {
       var that = this;
       $.ajax({
          url: 'http://dev.status.net:8080/index.php/api/statuses/update.json?oauth_token=' + oauth2.authParameters['access_token'],
          type: 'POST',
          data: {
            'status': that.params['status']
          },
          success: function() {
              that.redirect('/statusnet_js_mashup_2nd');
          }
       });
    });
    
    this.bind('getFeed', function() {
        var that = this;
        
        $.ajax({
          url: 'http://dev.status.net:8080/index.php/api/statuses/home_timeline.json?oauth_token=' + oauth2.authParameters['access_token'],
          success: function(response) {
              that.feed = response;
              that.partial('/statusnet_js_mashup_2nd/js/templates/feed.ms');
          }
        });
    });
    
    var checkLoggedIn = function(callback) {
        if (this.path === '/statusnet_js_mashup_2nd/Login') {
            callback();
        }
        if (! oauth2.isLoggedIn()) {
            $('#logout-link').hide();
            this.redirect('/statusnet_js_mashup_2nd/Login');
        } else {
            $('#logout-link').show();
            callback();
        }
    };
    
    this.around(checkLoggedIn);
});

jQuery(function() {
    app.run('/statusnet_js_mashup_2nd');
});

var oauth2 = {
    authParameters: {},
    storeAccessToken : function(fragment, callback) {
        fragment = fragment.split('+').join('%252b');
        fragment = fragment.split('&');
        for (var i = 0; i < fragment.length; i++) {
            var ix = fragment[i].indexOf('=');
            if (ix > 0) {
                oauth2.authParameters[fragment[i].substr(0, ix)] = decodeURIComponent(fragment[i].substr(ix + 1));
            }
        }
        localStorage.setItem("access_token", oauth2.authParameters['access_token']);
        localStorage.setItem("user_id", oauth2.authParameters['user_id']);
        app.trigger('loggedIn');
    },
    isLoggedIn: function() {
        return oauth2.authParameters['access_token'];
    },
    retrieveAccessToken: function() {
        oauth2.authParameters['access_token'] = localStorage.getItem("access_token");
        oauth2.authParameters['user_id'] = localStorage.getItem("user_id");
    },
    deleteAccessToken: function() {
        oauth2.authParameters = {};
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_id");
    }
};

oauth2.retrieveAccessToken();
