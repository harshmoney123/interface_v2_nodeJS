(function(window) {
  var client = new BinaryClient('ws://localhost:9001');
  
  client.on('open', function() {
    window.Stream = client.createStream();

    client.on('stream', function(stream, meta){    ;
      stream.on('data', function(data){
        console.log("Received response from the server.");
        $("h3").css("visibility", "hidden");
        console.log(data);
        try {
          if(data.company === "Google"){
            $("#google-navtab").html(data.data);
          }else if(data.company === "AWS"){
            $("#amazon-navtab").html(data.data);
          }
        } catch(error) {
            alert(error);
        }
      });
    });
    
    if (!navigator.getUserMedia)
          navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    
    
    navigator.getUserMedia({audio: true}, initializeRecorder,function(e) {
      alert('Error capturing audio.');
    });
    
    var recording = false;
    
    function initializeRecorder(e) {
        audioContext = window.AudioContext || window.webkitAudioContext;
        context = new audioContext();
        audioInput = context.createMediaStreamSource(e);
        var bufferSize = 2048;
        recorder = context.createScriptProcessor(bufferSize, 1, 1);
        recorder.onaudioprocess = function(e){
          if(!recording) return;
          console.log ('recording......');
          var left = e.inputBuffer.getChannelData(0);
          window.Stream.write(convertoFloat32ToInt16(left));
        }
        audioInput.connect(recorder)
        recorder.connect(context.destination); 
    }
    
    function convertoFloat32ToInt16(buffer) {
      var l = buffer.length;
      var buf = new Int16Array(l)
    
      while (l--) {
        buf[l] = buffer[l]*0xFFFF;    //convert to 16 bit
      }
      return buf.buffer
    }
    
    startRecord.disabled = false;
    pauseRecord.disabled = true;
    stopRecord.disabled = true;
    
    startRecord.onclick = e => {
      startRecord.disabled = true;
      pauseRecord.disabled = false;
      stopRecord.disabled = false;
      recording = true;
    }
    
    pauseRecord.onclick = e => {
      startRecord.disabled = false;
      pauseRecord.disabled = true;
      stopRecord.disabled = false;
      recording = false;
    }
    
    stopRecord.onclick = e => {
      startRecord.disabled = false;
      pauseRecord.disabled = true;
      stopRecord.disabled = true;
      recording = false;
      window.Stream.end();
      $("h3").css("visibility", "visible");
    }
  });

// ======================================================================================

$(document).ready(function(){
    $(".nav-tabs a").click(function(){
        $(this).tab('show');
    });
});


})(this);