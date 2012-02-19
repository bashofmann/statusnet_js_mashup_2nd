var app = Sammy('#main', function() {
    this.use('Mustache', 'ms');
    
    this.get('', function() {
        this.trigger('getFeed');
    });
    this.bind('getFeed', function() {
        var that = this;
        $.ajax({
          url: 'http://dev.status.net:8080/index.php/api/statuses/user_timeline/home_timeline.json',
          success: function(response) {
              that.feed = response;
              that.partial('js/templates/feed.ms');
          }
        });
    });
});

jQuery(function() {
    app.run();
});