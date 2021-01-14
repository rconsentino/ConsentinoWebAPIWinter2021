//app is the entry point of application
var http = require('http')
var url = require('url')

http.createServer(function(request, response)
{
    var pathName = url.parse(request.url).pathname
    //http header
    response.writeHead(200,{'Content-type':'text/html'})

    response.write('<!DOCTYPE><html><body><div>Request for' + pathName + '</div></body></html>')
    //send a response to the body of the html
    response.end()
}).listen(3000)

console.log("Server is running on port 3000")
