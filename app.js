var express = require('express');
var app = express();
app.get('/',function(req,res){
	res.sendFile(__dirname + '/index.html');
});
app.use('/Scripts',express.static(__dirname + '/Scripts'));
var server = app.listen(8000,'localhost');

console.log("Server is running on localhost:8000");