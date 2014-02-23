$(function() {
  var $editor = $('.tweet-editor'),
      $toolbar = $('.tweet-box .toolbar'),
      $btn = $('.tweet-submit'),
      editorEmpty = function() {
        var $placeholder = $('<div class="tweet-placeholder">输入内容吧...</div>');
        $editor.stop(true, true);
        $editor.html($placeholder)
                          .animate({
                            'min-height': 19
                          }, 160);
        $toolbar.stop(true, true);
        $toolbar.fadeOut(160);
      },
      checkBtn = function() {
        var text = $editor.text();
        if (text.length >= 3) {
          $btn.removeAttr('disabled');
        } else {
          $btn.attr('disabled', 'disabled');
        }
      },
      previewEmpty = function() {
        var $preview = $('.tweet-preview');
        $preview.html('');
        checkPreview();
      },
      checkPreview = function() {
        var $preview = $('.tweet-preview');
        if ($preview.find('img').length > 0) {
          $preview.removeClass('dn');
        } else {
          $preview.addClass('dn');
        }
      },
      blurTimer;
  $.Collipa.mention($D, document, $editor, null, checkBtn);
  $D.on('keyup', '.tweet-editor', function() {
    checkBtn();
  });
  $D.on('focus', '.tweet-editor', function() {
    var $this = $(this);
    $('.tweet-placeholder').remove();
    $this.stop(true, true);
    $this.animate({
      'min-height': 60
    }, 160, function() {
      $toolbar.stop(true, true);
      $toolbar.fadeIn(160);
    });
  });
  $D.on('blur', '.tweet-editor', function() {
    var $this = $(this),
        text = $.trim($this.text());
    if (!text.length) {
      blurTimer = setTimeout(function() {
        editorEmpty();
      }, 400);
    }
  });
  $D.on('keypress', '.tweet-editor', function(e) {
    if (e.ctrlKey && e.which == 13 || e.which == 10) {
      $btn.click();
      $(this).blur();
    }
  });
  $D.on('click', '.tweet-submit', function(e) {
    e.preventDefault();
    var $this = $(this),
        $editor = $('.tweet-editor'),
        $tweetList = $('.tweet-list .item-list'),
        $imgs = $('.tweet-preview img'),
        content = $editor.html(),
        text = $.trim($editor.text()),
        image_ids = [],
        url = '/tweet/create';
    if (text.length) {
      $this.attr('disabled', 'disabled');
      $imgs.each(function(i, e) {
        var $e = $(e);
        image_ids.push($e.data('id'));
      });
      $.ajax({
        url: url,
        type: 'post',
        data: {
          content: content,
          image_ids: image_ids.join(','),
          '_xsrf': get_cookie('_xsrf')
        },
        success: function(data) {
          if (data.status === 'success') {
            var source = $('#tweet-template').html(),
                render = template.compile(source),
                html = render(data);
            if ($tweetList.length) {
              $tweetList.prepend(html);
            } else {
              $('.tweet-list').html('<ul class="item-list">' + html + '</ul>');
            }
            //editorEmpty();
            previewEmpty();
            $editor.html('').focus();
            $('#show-' + data.id).css({
                                   opacity: 0
                                 })
                                 .animate({
                                   opacity: 1
                                 });
          } else {
            $this.removeAttr('disabled');
            noty(data);
          }
        }
      });
    }
  });
  $D.on('click', '.retweet a', function(e) {
    e.preventDefault();
    var $this = $(this),
        $name_area = $this.parents('.item').find('a.name'),
        name = $name_area.attr('data-name'),
        nickname = $name_area.html(),
        user_url = $name_area.attr('href'),
        $textarea = $('.tweet-editor');

    $textarea.append('&nbsp;<a class="mention" data-username="' + name + '" href="'+ user_url +'">@' + nickname + '</a>&nbsp;');
    $textarea.focus();
    placeCaretAtEnd($textarea[0]);
    checkBtn();
  });
  $('#pic-select').imageUpload({
    cbk: function(data) {
      var img = '<span class="img-cover"><img data-id="' + data.id + '" src="' + data.path + '"><i class="icon-remove-circle"></i></span>',
          $area = $('.tweet-preview');
      $area.append(img);
      checkPreview();
    }
  });
  $D.on('click', '.add-img', function(e) {
    e.preventDefault();
    clearTimeout(blurTimer);
    $editor.focus();
    $('#pic-select').click();
  });
  $D.on('click', '.tweet-preview .img-cover i', function() {
    var $this = $(this),
        $imgCover = $this.parent('.img-cover'),
        id = $imgCover.find('img').data('id'),
        url = '/image/' + id;
    clearTimeout(blurTimer);
    $editor.focus();
    $.ajax({
      url: url + '?_xsrf=' + get_cookie('_xsrf'),
      type: 'DELETE',
      success: function(jsn) {
        $imgCover.fadeOut(function() {
          $(this).remove();
        });
        noty(jsn);
      }
    });
  });
  $D.on('click', '.tweet-img-content', function() {
    var $this = $(this),
        $covers = $this.find('.img-cover'),
        $dns = $this.find('.img-cover.dn'),
        $ul = $this.prev('.thumbs').find('ul'),
        $thumbs = $ul.find('li'),
        $area = $this.parents('.tweet-img-area');
    $ul.width(($thumbs.outerWidth() + 10) * $thumbs.length);
    if ($area.hasClass('close')) {
      $area.removeClass('close').addClass('open');
      $thumbs.removeClass('cur');
      $thumbs.eq(0).addClass('cur');
      $covers.hide();
      $covers.eq(0).show();
    } else {
      $area.removeClass('open').addClass('close');
      $covers.show();
      $dns.hide();
    }
  });
  $D.on('click', '.thumbs li', function() {
    var $this = $(this),
        $area = $this.parents('.tweet-img-area'),
        $ul = $this.parent('ul'),
        $thumbs = $ul.find('li'),
        $covers = $area.find('.img-cover'),
        idx = $thumbs.index($this[0]);
    $covers.hide();
    $covers.eq(idx).show();
    $thumbs.removeClass('cur');
    $this.addClass('cur');
  });
  $D.on('mousemove', '.thumbs', function(e) {
    var $this = $(this),
        $ul = $this.find('ul'),
        pos = e.pageX - $this.offset().left,
        posP = pos / $this.width(),
        listP = $ul.width() * posP,
        offset = pos - listP;
    if ($ul.width() > $this.width()) {
      $ul.css({
        'left': offset
      });
    }
  });
});