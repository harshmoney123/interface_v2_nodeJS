var express = require("express"),
    app = express(),
    binaryServer = require('binaryjs').BinaryServer,
    wav = require('wav'),
    fs = require('fs'),
    outFile = 'speech.wav',
    spawn = require("child_process"),
    fs = require('fs');
    
    
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));

app.get("/", function(req, res){
    res.render("client");
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





