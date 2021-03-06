const express = require('express');
const serverless = require('serverless-http');
const app = express();






const server = app.listen(3000, () => console.log('Local app listening on port 3000!'));


const io = require('socket.io')(server)

const Datastore = require('nedb-promises')

const fs = require('fs')

const db = {} 
db.onlines      = Datastore.create('onlines.exe')
db.messagesData = Datastore.create('messagesData.exe')
db.files        = Datastore.create('files.exe')

// Connected People
const onlines = new Set()


app.post('/uploads', multipartMiddleware, function(req, res) {
	uploader.post(req, function(status, filename, original_filename, identifier) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "content-type")

		setTimeout(function () {
			res.send(status);
		}, 500);
	});
});

  app.options('/uploads', function(req, res){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "content-type")
    
    res.status(200).send();
  });
  
  // Handle status checks on chunks through Uploader.js
  app.get('/uploads', function(req, res) {
    uploader.get(req, function(status, filename, original_filename, identifier) {
        console.log('GET', status);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "content-type")
        res.status(status == 'found' ? 200 : 204).send(status);
    });
  });
  

  app.get('/download/:identifier', function(req, res) {
    const file = `./tmp/${req.params.identifier}`
    res.download(file)
  });

app.get('/*', (req,res)=>{
    res.redirect('/')
})

io.on('connection', socket =>{

    socket.on('getFiles', ()=>{
        fs.readdir( './tmp', function( err, files ) {
            files = files.sort((f1, f2)=>{
                return f1.toLowerCase() > f2.toLowerCase()
            })
            io.emit('getFiles', files)
        })
    })

    socket.on('fileAdded', (file) =>{
        socket.broadcast.emit('fileAdded', file)
    })

    socket.on('complete', () =>{
        socket.broadcast.emit('complete')
    })

    socket.on('fileError', () =>{
        socket.broadcast.emit('fileError')
    })

    socket.on('disconnect', ()=>{
        onlines.delete(socket.name)
        socket.name = null
        io.emit('initOnlines', [...onlines])
    })

    socket.on('removeOnline', name =>{
        onlines.delete(name)
        io.emit('initOnlines', [...onlines])
    })

    socket.on('newName', name =>{
        const oldName = socket.name
        const newName = name 
        onlines.delete(oldName)
        socket.broadcast.emit('changedName', [oldName, newName])
        socket.name = newName
        onlines.add(newName)
        io.emit('initOnlines', [...onlines])
    })

    socket.on('initState', async (name)=>{
        socket.name = name || null
        if(name){
            onlines.add(name)
            io.emit('initOnlines', [...onlines])
        }

        const messagesData = await db.messagesData.find({}).sort({date: 1})
        socket.emit('initState', messagesData)
        
    })

    socket.on('addOnline', online =>{
        socket.name = online
        onlines.add(online)
        io.emit('initOnlines', [...onlines])
    })

    socket.on('addTyper', typer => {
        io.emit('addTyper', typer)
    })

    socket.on('removeTyper', typer =>{
        io.emit('removeTyper', typer)
    })

    socket.on('addMessage', async person =>{
        
        await db.messagesData.insert({...person, date: Date.now()})
        io.emit('addMessage', person)
    })
})












const bodyParser = require('body-parser');

const router = express.Router();
router.get('/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<h1>Hello from Express.js!</h1>');
  res.end();
});
router.get('/another', (req, res) => res.json({ route: req.originalUrl }));
router.post('/', (req, res) => res.json({ postBody: req.body }));

app.use(bodyParser.json());
app.use('/.netlify/functions/server', router);  // path must route to lambda

module.exports = app;
module.exports.handler = serverless(app);
