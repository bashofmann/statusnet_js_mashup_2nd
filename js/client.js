var app = Sammy('#main', function() {
    var embeds = [];
    var feed = [];
    this.use('Mustache', 'ms');
    
    this.get('/statusnet_js_mashup_2nd', function() {
        this.trigger('getFeed');
    });
    this.get('/statusnet_js_mashup_2nd/', function() {
        this.trigger('getFeed');
    });
    this.get('/statusnet_js_mashup_2nd/Widget', function() {
        var that = this;
        $.ajax({
            url: 'http://localhost:8080/statusnet_js_mashup_2nd/backend/widget.json',
            success: function(result) {
                that.widget = html_sanitize(result.html);
                that.partial('/statusnet_js_mashup_2nd/js/templates/widget.ms');
            }
       });
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
              feed = response;
              that.trigger('renderFeed');
              that.trigger('connect');
          }
        });
    });
    
    this.bind('renderFeed', function() {
        this.feed = feed;
        this.partial('/statusnet_js_mashup_2nd/js/templates/feed.ms');
    });
    
    this.bind('changed', function() {
        embeds = [];
        $('div.feed-item a').removeClass('thumbnail');
        $('div.feed-item div.embed').remove();
        $('div.feed-item blockquote.embed-preview').remove();
        $('div.feed-item h3').embedly({
            key:'87d885aab65e11e0a0724040d3dc5c07',
            maxWidth: 450,
            wmode: 'transparent'
        }, function (oembed, dict) {
            if (oembed == null) {
                return;
            }
            console.log(oembed);
            var output = "<blockquote class='embed-preview'><a class='embedly' id='embed-" + embeds.length + "' href='javascript:;'><img src='" + oembed.thumbnail_url + "' /></a>";
            output += "<small><a href='" + oembed.provider_url + "'>" + oembed.provider_name + "</a> &sdot; " + oembed.title + "</small></blockquote>";
            embeds.push(oembed['code']);
            $(dict["node"]).parent().after(output);
        });
        $('a.embedly').live("click", function (e) {
            var embedId;
            e.preventDefault();
            embedId = $(this).attr('id').replace('embed-', '');
            $(this).parents('blockquote').replaceWith(embeds[embedId]);
        });
    });

    this.bind('connect', function() {
        var that = this;
        var socket = new io.connect('http://localhost', {port: 8000, rememberTransport: false});
        socket.on('message', function(obj){
            xmlDoc=$(obj);
            xmlDoc.find('entry').each(function() {
               feed = [{
                  'statusnet_html': $(this).find('content').text(),
                  'created_at': $(this).find('published').text(),
                  'source': $(this).find('statusnet\\:notice_info').attr('source'),
                  'user': {
                      'name': xmlDoc.find('author').find('poco\\:displayName').text(),
                      'statusnet_profile_url': xmlDoc.find('author').find('uri').text()
                  },
                  'geo': {
                      'coordinates':$(this).find('georss\\:point').text().split(' ')
                  }
               }].concat(feed);
               that.trigger('renderFeed');
            });
        });

        socket.on('connect', function(){
            console.log('connected');
            that.trigger('subscribe');
        });
        socket.on('disconnect', function(){ console.log('disconnected'); });
        socket.on('reconnect', function(){ console.log('reconnected'); });
    });
    this.bind('subscribe', function() {
       console.log('subscribe to feed');
       var feed = 'http://dev.status.net:8080/index.php/api/statuses/user_timeline/' + oauth2.authParameters['user_id'] + '.atom';
       var hub = 'http://dev.status.net:8080/index.php/main/push/hub';
       $.ajax({
          url: hub,
          type: 'POST',
          data: {
              'hub.topic': feed,
              'hub.callback': 'http://localhost:8000/',
              'hub.mode': 'subscribe',
              'hub.verify': 'async'
          },
          success: function(response) {
              console.log(response);
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
    app.run();
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
