var express = require("express"),
    app = express(),
    binaryServer = require('binaryjs').BinaryServer,
    bodyparser = require("body-parser"),
    wav = require('wav'),
    fs = require('fs'),
    fs = require('fs'),
    mongoose = require("mongoose"),
    unpipe = require('unpipe');
const { exec } = require('child_process');
    
app.use(bodyparser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));
mongoose.connect("mongodb://localhost:27017/transcriptionDB",{useNewUrlParser:true});


var user = {username: "", password: ""};
var patientID = {patientName: "", patientDOB: ""};

var MySchema = new mongoose.Schema({
    name: String,
    password: String,
    transcription: String,
    patient: String,
    birthday: String,
    date: String
});
var Doctor = mongoose.model("Doctor", MySchema);

function addTranscriptionToDB(transcription){
  var time = new Date();
  var person = new Doctor({
    name: user.username,
    password: user.password,
    patient: patientID.patientName,
    birthday: patientID.patientDOB,
    transcription: transcription,
    date: time.toString()
  });
  person.save(function(err, per){
    if(err){
        console.log("something wrong")
    }else{
        console.log("we just saved a transcription to the db:")
        console.log(per);
    }
  });
}


app.get("/", function(req, res){
  res.render("landing");
});

app.get("/record", function(req, res){
    res.render("client");
});

app.get("/profile", function(req, res){
  res.render("profile", {username: username});
});

app.post("/record", function(req, res){
  
  patientID.patientName = req.body.patientName;
  patientID.patientDOB = req.body.patientDOB;
  res.render("client");
});

app.post("/profile", function(req, res){
  user.username = req.body.username;
  user.password = req.body.password;
  Doctor.find({name: user.username, password: user.password}, function(err, person){
      if(err){
        console.log(err);
      }else if(person.length == 0){
        res.render("login", {found: false});
          
      }else{
          res.render("profile", {person: person[0]});
      }
  });
});

app.get("/login", function(req, res){
  res.render("login", {found: true});
});

app.post("/login", function(req, res){
  user.username = req.body.username;
  user.password = req.body.password;
  addTranscriptionToDB("I just created an account.");
  res.render("login", {found: true});
})

app.get("/signup", function(req, res){
  res.render("signup");
})

app.listen(3700, function(){
  console.log("server is listening......");
});


var server = binaryServer({port: 9001});



server.on('connection', function(client) {
  console.log('new connection');

  function getTextFromFile(company, filename){
    var path = "audios/" + filename + company + ".txt";
    fs.readFile(path, 'utf8', function (err,data) {
      if (err) {
        console.log("Cannot open file: " + path);
      }else{
        console.log("send transcription of " + company + "," + filename);
        client.send({company: company, data: data});
        // if(company === "Google") addTranscriptionToDB(data);
      }
    });
  }

  client.on('stream', function(stream, meta) {
    console.log('new stream');

    var time = new Date();
    var outFile = "audios/" + time.toString() + user.username + "-" + patientID.patientName + '.wav';
    var tmpFileNumber = Date.now();
    var tmpFileName = user.username + "-" + patientID.patientName + tmpFileNumber;
    var tmpFilePath = "audios/" + tmpFileName + ".wav";
    var queue = [];
    var fileWriter = new wav.FileWriter(outFile, {
      channels: 1,
      sampleRate: 48000,
      bitDepth: 16
    });
    var tmpFileWriter = new wav.FileWriter(tmpFilePath, {
      channels: 1,
      sampleRate: 48000,
      bitDepth: 16
    });
    stream.pipe(fileWriter);
    stream.pipe(tmpFileWriter);

    var myInt = setInterval(function(){
        unpipe(stream);
        tmpFileWriter.end();
        queue.push(tmpFileName);
        console.log("transcribing " + tmpFileName);
        exec("python3 audios/SpeechToText.py " + tmpFilePath, function(){
          var fileName = queue.shift();
          getTextFromFile("Google", fileName);
          getTextFromFile("AWS", fileName);
          getTextFromFile("IBM", fileName);
          console.log("finished transcribe " + fileName);
        });
        tmpFileNumber = Date.now();
        tmpFileName = user.username + "-" + patientID.patientName + tmpFileNumber;
        tmpFilePath = "audios/" + tmpFileName + ".wav";
        tmpFileWriter = new wav.FileWriter(tmpFilePath, {
          channels: 1,
          sampleRate: 48000,
          bitDepth: 16
        });
        stream.pipe(tmpFileWriter);
        stream.pipe(fileWriter);
    }, 10000);

    stream.on('end', function() {
      tmpFileWriter.end();
      fileWriter.end();
      exec("python3 audios/SpeechToText.py " + tmpFilePath, function(){
          getTextFromFile("Google", tmpFileName);
          getTextFromFile("AWS", tmpFileName);
          getTextFromFile("IBM", tmpFileName);
          console.log("finished transcribe " + tmpFileName);
        });
      clearInterval(myInt);
      console.log('wrote to file ' + outFile);
    });
  });
});

