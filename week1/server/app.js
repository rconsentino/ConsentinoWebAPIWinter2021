//app is the entry point of application
var http = require('http')

http.createServer(function(request, response){
    //http header
    response.writeHead(200,{'content-type':'text/plain'})
    //send a response to the body of the html
    response.end("Wouldn't you like to be a pepper too???")
}).listen(3000)

console.log("Server is running on port 3000")
