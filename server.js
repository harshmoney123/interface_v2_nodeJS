var express = require("express"),
    app = express(),
    binaryServer = require('binaryjs').BinaryServer,
    wav = require('wav'),
    fs = require('fs'),
    outFile = 'speech.wav',
    spawn = require("child_process").spawn;
    
    
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

    // stream.on('end', function() {
    //   fileWriter.end();
    //   console.log('wrote to file ' + outFile);
    // });
  });

  server.on('message', function(messageEvent) {
    console.log("Received message from the server.");

    var massage = JSON.parse(messageEvent.data);
    var type = massage.type;
    if(massage.error){
      alert(massage.result);
    }else if(type === "common"){
      if(massage.msg === "newAudio"){
        console.log("new audio arrived");

        try {
          // Execute python functions
          // pythonProcess = spawn('python3',['SpeechToText.py', 'speech.wav']);

          // pythonProcess.stdout.on('data', (data) => {
          //   console.log(`stdout: ${data}`);
          // });

          // pythonProcess.on('close', (code) => {
          //   console.log(`child process exited with code ${code}`);
          // });

          var google_text = getTextFromFile("Google");
          var amazon_text = getTextFromFile("AWS");
          var result = {"Amazon": amazon_text, "Google": google_text};
          server.send({msg: result, type: "transcription"});
        }
        catch(error) {
          console.log(error);
          server.send({msg: "Error when transcribe.", type: "error"});
        }
      }else{
        console.log("wrong msg content: " + massage.msg);
      }

    }else{
      console.log("wrong msg type: " + type);
    }
  });
});



function getTextFromFile(company){
    var path = "speech" + "company" + ".txt";
    var file = new File(path);
    file.open("r"); // open file with read access
    var str = "";
    while (!file.eof) {
      // read each line of text
      str += file.readln() + "\n";
    }
    file.close();
    return str;
}


