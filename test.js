fs = require('fs')
var google_text = getTextFromFile("Google");
console.log("1");
console.log(google_text);
function getTextFromFile(company){
    var path = "speech" + company + ".txt";
    res = "";
    fs.readFile(path, 'utf8', function (err,data) {
        console.log("2");
        res = "data";
    });
    console.log(res);
    return res;
}