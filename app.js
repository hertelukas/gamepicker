const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));

app.get('/', (req, res) => {
    res.render('index');
});

var currentTitles = new Map();

var online = 0;

io.on('connection', (socket) => {
    online += 1;
    io.emit('user change', online)

    for(const title of currentTitles.keys()){
        socket.emit('new game', title);
    };

    var data = [];

    currentTitles.forEach(function(value, key){
        data.push(value + "|" + key);
    });
    socket.emit('vote', data);

    socket.on('new game', (title) => {

        if(!currentTitles.has(title)){
            io.emit('new game', title);

            //Update the map
            currentTitles.set(title, 0);
        }
    });

    socket.on('vote', (vote) => {
        var text = vote.split("|")[0];
        var value = Number(vote.split("|")[1]) + currentTitles.get(text);

        currentTitles.set(text, value);
        var data = [];

        currentTitles.forEach(function(value, key){
            data.push(value + "|" + key);
        });

        io.emit('vote', data);
    });

    socket.on('reset', () =>{
        currentTitles = new Map();
        io.emit('reset');
    });

    socket.on('disconnect', () => {
        online = online - 1;
        io.emit('user change', online)
    });
});


var port = process.env.PORT || 3000;
http.listen(port, () => {
    console.log("Listening on port " + port);
});