// silly chrome wants SSL to do screensharing
var fs = require('fs'),
    express = require('express'),
    https = require('https'),
    routes = require('./routes/routes'),
    path = require('path'),
    user = require('./routes'),
    http = require('http'),
    colors = require('colors'),
    mime = require('mime'),
    cache = {};

function sendFile(response, filePath, fileContents) {
  response.writeHead(
    200, 
    {"content-type": mime.lookup(path.basename(filePath))}
  );
  response.end(fileContents);
}

var privateKey = fs.readFileSync('fakekeys/privatekey.pem').toString(),
    certificate = fs.readFileSync('fakekeys/certificate.pem').toString();


var app = express();

app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'html');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('your secret here'));
    app.use(express.session());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
    /*  app.use(express.static(path.join(__dirname, 'resources')));
      app.use(express.static(path.join(__dirname, 'views/partials')));*/
});
app.configure('development', function () {
    app.use(express.errorHandler());
});

routes(app);
https.createServer({key: privateKey, cert: certificate}, app).listen(8000);
var server =http.createServer(app).listen(8001);
var chatServer = require('./libs/chat_server');
chatServer.listen(server);

console.log('running on https://localhost:8000 and http://localhost:8001');
