$().ready(function() {
    var Chat = function(socket) {
        this.socket = socket;
    };
    var room = location.search && location.search.split('?')[1];
    console.log("head:"+room);
    if(!room)
        room = "Lobby";
        // create our webrtc connection
    var webrtc = new SimpleWebRTC({
        // the id/element dom element that will hold "our" video
        localVideoEl: 'localVideo',
        // the id/element dom element that will hold remote videos
        remoteVideosEl: '',
        // immediately ask for camera access
        autoRequestMedia: true,
        debug: false,
        detectSpeakingEvents: true,
        autoAdjustMic: true,
        localVideo: {
                autoplay: true,
                mirror: true,
                muted: true
        }
    });
    //发送信息
    Chat.prototype.sendMessage = function(room, text) {
        var message = {
            //房间名和内容
            room: room,
            text: text
        };
        //发送
        this.socket.emit('message', message);
    };
    //改变房间
    Chat.prototype.changeRoom = function(room) {
        // console.log("change"+ room);
        webrtc.createRoom(room, function (err, name) {
            // console.log(' create room cb', arguments);
            $("#room").text(room);
            if(err)
                setRoom(name);
        });
        this.socket.emit('join', {
            newRoom: room
        });
    };
        Chat.prototype.processCommand = function(command) {
        //获得开头的命令
        var words = command.split(' ');
        var command = words[0]
        .substring(1, words[0].length)
        .toLowerCase();
        var message = false;

        switch(command) {
            case 'join':
                //将字符串向右移，除掉第一个命令，在链接
                words.shift();
                var room = words.join(' ');
                location.href="/?"+room;
                break;
            default:
                message = 'Unrecognized command.';
            break;
        };

        return message;
    };
    // 获得所有成员列表
    // $.ajax({
    //     type: 'GET',
    //     url: "/list",
    //     data:room,
    //     success: function(data){
    //         shownames(data);
    //     },
    //     error:function(err){
    //     }
    // });
    function shownames(data){
        for(var i in data){
            $("#userlist").append("<a style='background-color:blue;color:#fff;' href='/?"+data[i].curoom+"'>"+data[i].name+"</a>");
        }
    }
    function divEscapedContentElement(message) {
        return $('<div></div>').text(message);
    }

    function divSystemContentElement(message) {
        return $('<div></div>').html('<i>' + message + '</i>');
    }
    //处理用户输入
    function processUserInput(chatApp, socket) {
        var message = $('#send-message').val();
        var systemMessage;

        if (message.charAt(0) == '/') {
            systemMessage = chatApp.processCommand(message);
            if (systemMessage) {
                $('#messages').append(divSystemContentElement(systemMessage));
            }
        } else {
            chatApp.sendMessage($('#room').text(), message);
            $('#messages').append(divEscapedContentElement(message));
            $('#messages').scrollTop($('#messages').prop('scrollHeight'));
        }

        $('#send-message').val('');
    }

    var socket = io.connect();

    var chatApp = new Chat(socket);
    var roomn = $("#room").text();
    if(room!=roomn){
        chatApp.changeRoom(room);
        $("#room").text(room)
    }

    socket.on('nameResult', function(result) {
        var message;
        console.log(result);
        if (result.success) {
            var name = $("#username").val();
            if(name!=result.name){
                if(name == "注册"){
                    name = result.name;
                }else{
                    this.socket.emit('nameAttempt', name);
                }
            }
            message = 'You are now known as ' + name + '.';
        } else {
            message = result.message;
        }
        $('#messages').append(divSystemContentElement(message));
    });

    socket.on('joinResult', function(result) {
        $('#room').text(result.room);
        $('#messages').append(divSystemContentElement('Room changed.'));
    });

    socket.on('message', function (message) {
        var newElement = $('<div></div>').text(message.text);
        $('#messages').append(newElement);
    });

    socket.on('rooms', function(rooms) {

        $('#room-list').empty();

        for(var room in rooms) {
            room = room.substring(1, room.length);

            if (room != '') {
                $('#room-list').append(divEscapedContentElement(room));
            }
        }

        $('#room-list div').click(function() {
            location.href='/?' + $(this).text();
            $('#send-message').focus();
        });
    });

    setInterval(function() {
        socket.emit('rooms');
    }, 1000);

    $('#send-message').focus();

    $('#send-form').submit(function() {
        processUserInput(chatApp, socket);
        return false;
    });
    // Since we use this twice we put it here
    function setRoom(name) {
        // $('#createRoom').remove();
        $('h1').text(name);
        $('#subTitle').text('Link to join: ' + location.href);
        $('body').addClass('active');
    }
    
    // when it's ready, join if we got a room from the URL
    webrtc.on('readyToCall', function () {
        // you can name it anything
        console.log( "roomName:"+room);
        var roomName = $('#room').text();
        if (room) webrtc.joinRoom(room);
    });
    //显示音量
    function showVolume(el, volume) {
        if (!el) return;
        if (volume < -45) { // vary between -45 and -20
            el.style.height = '0px';
        } else if (volume > -20) {
            el.style.height = '100%';
        } else {
            el.style.height = '' + Math.floor((volume + 100) * 100 / 25 - 220) + '%';
        }
    }
    webrtc.on('channelMessage', function (peer, label, data) {
        if (data.type == 'volume') {
        showVolume(document.getElementById('volume_' + peer.id), data.volume);
    }
    });
    webrtc.on('videoAdded', function (video, peer) {
        console.log('video added', peer);
        var remotes = document.getElementById('remotes');
        if (remotes) {
            var d = document.createElement('div');
            d.className = 'videoContainer';
            d.id = 'container_' + webrtc.getDomId(peer);
            d.appendChild(video);
            var vol = document.createElement('div');
            vol.id = 'volume_' + peer.id;
            vol.className = 'volume_bar';
            video.onclick = function () {
                video.style.width = video.videoWidth + 'px';
                video.style.height = video.videoHeight + 'px';
            };
            d.appendChild(vol);
            d.style="float:left";
            remotes.appendChild(d);
        }
    });
    webrtc.on('videoRemoved', function (video, peer) {
        console.log('video removed ', peer);
        var remotes = document.getElementById('remotes');
        var el = document.getElementById('container_' + webrtc.getDomId(peer));
        if (remotes && el) {
            remotes.removeChild(el);
        }
    });
    webrtc.on('volumeChange', function (volume, treshold) {
        //console.log('own volume', volume);
        showVolume(document.getElementById('localVolume'), volume);
    });

    

    if (room) {
        setRoom(room);
    } else {
        var val = $('#roomName').val().toLowerCase().replace(/\s/g, '-').replace(/[^A-Za-z0-9_\-]/g, '');
        webrtc.createRoom(val, function (err, name) {
            console.log(' create room cb', arguments);

            var newUrl = location.pathname + '?' + name;
            if (!err) {
                history.replaceState({foo: 'bar'}, null, newUrl);
                setRoom(name);
            } else {
                console.log(err);
            }
        });
    }
    $("#disconnet").on('click',function(){
        console.log("dis");
        webrtc.leaveRoom();
        location.href="/";
    });
    $("#stoplocal").on('click',function(){
        console.log("stop");
        webrtc.stopLocalVideo();
    });
    $("#startlocal").on('click',function(){
        console.log("start");
        webrtc.startLocalVideo();
    });
});