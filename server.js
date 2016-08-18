const http = require('http');
const path = require('path');
const fs = require('fs');
const server = http.createServer();
const PORT=3333;

server.on('request', function(req, res){
	fs.readFile(path.resolve(__dirname, './dropbox.html'), function (err, html) {
		if (err) {
			throw err;
		}

		res.writeHeader(200, {"Content-Type": "text/html"});
		res.write(html);
		res.end();
	});
});

server.listen(PORT, function(){
	console.log("Server listening on: http://localhost:%s", PORT);
});