//app is the entry point of application
var http = require('http')
var url = require('url')
var fileSystem = require('fs')

http.createServer(function(request, response)
{
    var pathName = url.parse(request.url).pathname
    var fileName = "index.html"

    fileSystem.readFile(fileName, CallBack)

    function CallBack(err, data)
    {
        if(err)
        {
            //if the file is not present
            console.log(err)

            response.writeHead(400, {'Content-Type':'text/html'})
            response.write('<!DOCTYPE><html><body><div>Page not found</div></body></html>')
        }
        else
        {
            //if the file is present
            //http header
            response.writeHead(200,{'Content-type':'text/html'})
            response.write(data.toString())
        }
        //send a response to the body of the html
        response.end()
    }

}).listen(3000)

console.log("Server is running on port 3000")
