var express = require("express"),
    app = express(),
    binaryServer = require('binaryjs').BinaryServer,
    bodyparser = require("body-parser"),
    wav = require('wav'),
    fs = require('fs'),
    outFile = 'speech.wav',
    spawn = require("child_process"),
    fs = require('fs'),
    mongoose = require("mongoose");
    
app.use(bodyparser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));
mongoose.connect("mongodb://localhost:27017/transcriptionDB",{useNewUrlParser:true});

var MySchema = new mongoose.Schema({
    name: String,
    password: String,
    transcription: String,
    date: String,
    time: String
});
var Doctor = mongoose.model("Doctor", MySchema);
var Patient = mongoose.model("Patient", MySchema);

var person = new Patient({
    name: "Emily",
    password: "12345",
    transcription: "...",
    date: "08/04/2018",
    time: "14:00"
});
person.save(function(err, per){
    if(err){
        console.log("something wrong")
    }else{
        console.log("we just saved a cat to the db:")
        console.log(per);
    }
});

app.get("/", function(req, res){
  res.render("landing");
});

app.get("/record", function(req, res){
    res.render("client");
});

var username = "Please login";
app.get("/profile", function(req, res){
  res.render("profile", {username: username});
});

app.post("/profile", function(req, res){
  var username = req.body.username;
  Patient.find({name: username}, function(err, person){
      if(err){
          console.log(err);
      }else{
          // console.log(person[0]);
          res.render("profile", {person: person[0]});
      }
  });
});

app.get("/login", function(req, res){
  res.render("login");
});

app.listen(3700, function(){
  console.log("server is listening......");
});


var server = binaryServer({port: 9001});

server.on('connection', function(client) {
  console.log('new connection');

  var fileWriter = new wav.FileWriter(outFile, {
    channels: 1,
    sampleRate: 48000,
    bitDepth: 16
  });

  client.on('stream', function(stream, meta) {
    console.log('new stream');
    stream.pipe(fileWriter); 

    stream.on('end', function() {
      fileWriter.end();
      console.log('wrote to file ' + outFile);
      try {
        //Execute python functions
        pythonProcess = spawn.spawnSync('python3',['SpeechToText.py', 'speech.wav']);

        // process.stdout.on('data', (data) => {
        //   console.log(`stdout: ${data}`);
        // });

        // process.on('close', (code) => {
        //   console.log(`child process exited with code ${code}`);
        // });

        function getTextFromFile(company){
            var path = "speech" + company + ".txt";
            fs.readFile(path, 'utf8', function (err,data) {
              if (err) {
                console.log(err);
              }
              console.log("send transcription of" + company);
              client.send({company: company, data: data});
            });
        }
        getTextFromFile("Google");
        getTextFromFile("AWS");
      }
      catch(error) {
        console.log(error);
        // client.send({msg: "Error when transcribe.", type: "error"});
      }
    });
  });
});





