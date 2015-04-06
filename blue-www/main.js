var redis = require('redis')
var express = require('express')
var fs      = require('fs')
var multer  = require('multer')
var app = express()
var client = redis.createClient(6379, '127.0.0.1', {})
var args = process.argv.slice(2);
var PORT = args[0];

app.get('/', function(req, res)
{
	res.send('Everything goes well!');
});
app.get('/switch',function(req,res){
	res.send('switch page ON blue');
	client.set("switch","1");
})
app.post('/upload',[ multer({ dest: './uploads/'}), function(req, res){
	console.log(req.body) // form fields
	console.log(req.files) // form files

	if( req.files.image )
	{
		fs.readFile( req.files.image.path, function (err, data) {
			if (err) throw err;
			var img = new Buffer(data).toString('base64');
			client.lpush("myimg",img)
			//console.log(img);
		});
	}

	res.status(204).end()
}]);

app.get('/meow', function(req, res) {
	{
		client.lpush("myPages",req.url)
		client.lrange("myimg",0,1,function(err,items){
			var imagedata=items[0]
			res.send("<h1>\n<img src='data:my_pic.jpg;base64,"+imagedata+"'/>");
		})
	}
})
var server = app.listen(PORT, function () {

	var host = server.address().address
	var port = server.address().port

	console.log('Example app listening at http://%s:%s', host, port)
});
