let http = require('http');
let fs = require('fs');
let path = require('path');
let mime =require('mime');
var cache = {};

function send404(response){
    response.writeHead(404,{'Content-Type':'text/plain'});
    response.write('Error 404 : resource not found.');
    response.end();
}
function sendFile(response, filePath, fileContents){
    response.writeHead(
        200,
        {"content-Type": mime.lookup(path.basename(filePath))}
    );
    response.end(fileContents);
}
function serveStatic (response, cache, absPath){
    if (cache[absPath]){
        sendFile(response, absPath, cache[absPath]);

    }else{
        fs.exists(absPath, function(exists){
            if(exists){
                fs.readFile(absPath, function(err, data){
                    if(err){
                        send404(response);
                    }else{
                        cache[absPath]=data;
                        sendFile(response, absPath, data);
                    }
                });
            } else{
                send404(response);
            }
        });
    }
}
let server = http.createServer(function(req,res){
    let filePath = false;
    if(req.url=='/'){
        filePath= 'public/index.html';
    }else {
        filePath = 'public'+req.url;
    }
    let absPath='./'+filePath;
    serveStatic(res, cache, absPath);
})
server.listen(3000,function(){
    console.log("Server listening on port 3000");
});
let chatServer = require('./lib/chat_server');
chatServer.listen(server);
