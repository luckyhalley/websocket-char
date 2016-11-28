$(function() {
  var FADE_TIME = 150; 
  var TYPING_TIMER_LENGTH = 400;
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // 初始化变量
  var $window = $(window);
  var $usernameInput = $('.usernameInput'); // 昵称输入框
  var $messages = $('.messages'); // 消息区
  var $inputMessage = $('.inputMessage'); // 输入消息框

  var $loginPage = $('.login.page'); // 登陆页
  var $chatPage = $('.chat.page'); // 对话页

  // 通知设置用户昵称
  var username;
  var connected = false;
  var typing = false;
  var lastTypingTime;
  var $currentInput = $usernameInput.focus();

  var socket = io();
  function addParticipantsMessage (data) {
    var message = '';
    if (data.numUsers === 1) {
      message += "这里有1个访客";
    } else {
      message += "这里有 " + data.numUsers + " 个访客";
    }
    log(message);
  }

  // 设置用户昵称
  function setUsername () {
    username = cleanInput($usernameInput.val().trim());

    // 用户名已输入
    if (username) {
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off('click');
      $currentInput = $inputMessage.focus();

      // 通知服务端用户进入
      socket.emit('add user', username);
    }
  }

  // 发送消息
  function sendMessage () {
    var message = $inputMessage.val();
    message = cleanInput(message);
    if (message && connected) {
      $inputMessage.val('');
      addChatMessage({
        username: username,
        message: message
      });
      // 通知服务器执行新消息事件
      socket.emit('new message', message);
    }
  }

  // 记录消息
  function log (message, options) {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  // 对话加入消息列表
  function addChatMessage (data, options) {
    var options = options || {};
    var $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));
    var $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message);

    var $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
  }

  // 界面显示一条信息
  function addMessageElement (el, options) {
    var $el = $(el);
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  function cleanInput (input) {
    return $('<div/>').text(input).text();
  }

  // 分配用户名显示颜色
  function getUsernameColor (username) {
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  // 键盘事件
  $window.keydown(function (event) {
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // 回车键按下发送消息
    if (event.which === 13) {
      if (username) {
        sendMessage();
      } else {
        setUsername();
      }
    }
  });

  // 点击输入框自动获取焦点
  $loginPage.click(function () {
    $currentInput.focus();
  });

  $inputMessage.click(function () {
    $inputMessage.focus();
  });

  // Socket 事件
  // 当用户登录时显示状态消息
  socket.on('login', function (data) {
    connected = true;
    // 显示欢迎信息
    var message = "欢迎光临716901010033严明坤的对话系统";
    log(message, {
      prepend: true
    });
    addParticipantsMessage(data);
  });

  // 当收到新消息时显示消息
  socket.on('new message', function (data) {
    addChatMessage(data);
  });

  // 当用户加入对话显示状态消息
  socket.on('user joined', function (data) {
    log(data.username + ' 加入谈话');
    addParticipantsMessage(data);
  });

  // 当用户离开对话显示状态消息
  socket.on('user left', function (data) {
    log(data.username + ' 离开谈话');
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

});