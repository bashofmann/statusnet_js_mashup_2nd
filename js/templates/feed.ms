{{#feed}}
  <div class="well">
      <h3>
        {{text}} 
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