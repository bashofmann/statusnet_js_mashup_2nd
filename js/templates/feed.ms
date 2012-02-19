<form action="/statusnet_js_mashup_2nd/Feed" method="post" class="form-horizontal">
    <legend>Add status update</legend>
    <fieldset>
        <div class="control-group">
            <label class="control-label" for="input_status">Status update</label>
            <div class="controls">
                <textarea name="status" class="input-xlarge" id="input_status" rows="3"></textarea>
            </div>
        </div>
        <div class="form-actions">
            <button type="submit" class="btn btn-primary">send</button>
        </div>
    </fieldset>
</form>

<legend>Feed</legend>

{{#feed}}
  <div class="well feed-item">
      <h3>
        {{{statusnet_html}}}
        {{#geo}}
        <a href="http://maps.google.com/maps?q={{coordinates.0}},{{coordinates.1}}&z=16"
            class="attachment thumbnail" rel="nofollow external">
            http://maps.google.com/maps?q={{coordinates.0}},{{coordinates.1}}&z=16
        </a>
        {{/geo}}
        {{#user}}
        <small>
            <a href="{{statusnet_profile_url}}">
            {{name}}
            </a>
        </small>
        {{/user}}
      </h3>
      <blockquote>
        <dl>
            <dt>Created</dt>
            <dd>{{created_at}}</dd>
            <dt>Source</dt>
            <dd>{{source}}</dd>
        </dl>
      </blockquote>
  </div>
{{/feed}}