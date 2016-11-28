// 安装Express服务器
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
// 按作业要求后4位为0033所以改为5位端口号
var port = process.env.PORT || 10033;

server.listen(port, function () {
  console.log('716901010033严明坤的计算机网络第三次上机作业');
  console.log('服务器启动在%d端口', port);
});

// 使用express中间件静态资源
app.use(express.static(__dirname + '/public'));

// 聊天室中用户数量
var numUsers = 0;

// 建立socket连接
io.on('connection', function (socket) {
  var addedUser = false;

  // 监听用户发送的新消息并传播消息
  socket.on('new message', function (data) {
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // 监听新用户加入会话
  socket.on('add user', function (username) {
    if (addedUser) return;

    // 在socket session中存储用户
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // 当新用户加入对话，对所有当前访客发送通知
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // 监听用户退出会话
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // 当用户离开对话，对所有当前访客发送通知
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});