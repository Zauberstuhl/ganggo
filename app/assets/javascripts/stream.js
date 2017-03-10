var api = new RestClient("/api/v0")
api.res({
  posts: [
    'comments',
    'likes'
  ],
  people: ['profile']
});

var infiniteScroll = {
  offset: 0,
  elemList: $("#post-list"),
  elem: $("#post-element")
}

function loadContent(offset) {
  api.posts.get({ offset: offset }).then(function(posts) {
    var regexp = /\{\[\{(.+?)(\..+?){0,1}\}\]\}/g;

    if (PostTemplate === undefined) { return; }

    $.each(posts, function(i, val) {
      api.people(val.PersonID).get().then(function(person) {
        val["Person"] = person;
        api.people(val.PersonID).profile.get().then(function(profile) {
          val["Profile"] = profile;

          var postHtml = PostTemplate;
          var editorHtml = EditorCommentTemplate;
          var likeCnt = 0, dislikeCnt = 0;

          while ((match = regexp.exec(PostTemplate)) != null) {
            var replacement = val[match[1]];
            if (replacement === undefined)
              continue;

            if (match[2] !== undefined)
              replacement = replacement[match[2].substr(1)];

            postHtml = postHtml.replace(match[0], replacement);
          }
          postHtml = $(postHtml);

          // comments
          api.posts(val.ID).comments.get().then(function(comments) {
            if (CommentTemplate === undefined) { return; }

            $.each(comments, function(i, commentVal) {
              api.people(commentVal.PersonID).get().then(function(person) {
                commentVal["Person"] = person;
                api.people(commentVal.PersonID).profile.get().then(function(profile) {
                  commentVal["Profile"] = profile;

                  // parse the template
                  commentHtml = CommentTemplate;
                  while ((match = regexp.exec(CommentTemplate)) != null) {
                    var replacement = commentVal[match[1]];
                    if (replacement === undefined)
                      continue;

                    if (match[2] !== undefined)
                      replacement = replacement[match[2].substr(1)];

                    commentHtml = commentHtml.replace(match[0], replacement);
                  }
                  postHtml.append($(commentHtml));
                });
              });
            });
          });

          // likes
          api.posts(val.ID).likes.get().then(function(likes) {
            $.each(likes, function(i, likeVal) {
              if (likeVal.Positive) {
                likeCnt++;
              } else {
                dislikeCnt++;
              }
            });
            postHtml.find(".like").html(likeCnt);
            postHtml.find(".dislike").html(dislikeCnt);
          });

          infiniteScroll.elemList.append(postHtml);

          // comment editor box
          while ((match = regexp.exec(EditorCommentTemplate)) != null) {
            var replacement = val[match[1]];
            if (replacement === undefined)
              continue;

            editorHtml = editorHtml.replace(match[0], replacement);
          }
          infiniteScroll.elemList.append(editorHtml);
        });
      });
    });
    infiniteScroll.offset += 10;
  });
}

$(window).scroll(function(){
  if ($(window).scrollTop() + $(window).height() >= $(document).height()) {
    if (!infiniteScroll.running)
      loadContent(infiniteScroll.offset)
  }
});

// intial page load
loadContent(infiniteScroll.offset);