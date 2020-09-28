let socketio=require('socket.io');
let io;
let guestNumber=1;
let nickNames= {};
let namesused=[];
let currentRoom={};

exports.listen=function(server){
    io=socketio.listen(server);
    io.set('log level',1);

    io.sockets.on('connection', function(socket){
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
        joinRoom(socket,'Lobby');   

        handleMessageBroadcasting(socket, nickNames);
        handleNameChangeAttempts(socket, nickNames, namesUsed);
        handleRoomjoining(socket);

        socket.on('rooms',function(){
            socket.emit('rooms',io.socket.manager.rooms);
        });

        handleClientDisconnection(socket, nickNames, namesUsed);
    })
}
function assignGuestName(socket, guestNumber, nickNames, namesUsed){
    let name = 'Guest'+guestNumber;
    nickNames[socket.id] = name;
    socket.emit('nameResult',{
        success : true,
        name : name
    });
    namesUsed.push(name);
    return guestNumber + 1;

}
function joinRoom(socket, room){
    socket.join(room);
    currentRoom[socket.id]=room;
    socket.emit('joinResult',{room:room});
    socket.broadcast.to(room).emit('message',{
        text:nickNames[socket.id]+'has joined'+room +'.'
    });

    let usersInroom = io.sockets.clients(room);
    if (usersInroom.length>1){
        let usersInroomSummary = 'Users currently'+ room + ':';
        for(let index in usersInroom){
            let userSocketId = usersInRoom[index].id;
            if(userSocketId != socket.id){
                if(index > 0){
                    usersinRoomSummary += ',';
                }
                usersInroomSummary+=nickNames[iserSocketId];
            }
        }
        usersInRoomSummary +='.';
        socket.emit('message',{text : usersInroomSummary})
    }
} 
function handleNameChangeAttempts(socket, nickNames, namesUsed){
    socket.on('nameAttempt',function(name){
        if (name.indexOf('Guest')==0){
            socket.emit('nameResult',{
                success : false,
                message : 'Names cant begin with "Guest".'
            });
        }else{
            if(namesUsed.indexOf(name)==-1){
                let previousName = nickNames[socket.id];
                let previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id]=name;
                delete namesUsed[previousNameIndex];

                socket.emit('nameResult',{
                    success : true, 
                    name: name
                });
                socket.broadcast.to(currentRoom[socket.id]).emit('message',{
                    text : previousName + 'is now known as '+ name + '.'
                });
            }else{
                socket.emit('nameReulst',{
                    success : false,
                    message : 'That name is already in use'
                });
            } 
        }
    });
}
function handleMessageBroadcasting(socket){
    socket.on('message',function(message){
        socket.broadcast.to(message,room).emit('message',{
            text: nickNames[socket.id]+':'+message.text
        });
    });
}
function handleRoomjoining(socket){
    socket.on('join',function(room){
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket,room.newRoom)

        });
    
} 
function handleClientDisconnection(socket){
    socket.on('disconnect',function(){
        let nameIndex = nameUsed.indexOf(nickNames[socket.id]);
        delete nameUsed[nameIndex];
        delete nickNames[socket.id]
    })
}
