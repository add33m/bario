// Server side. Handles posting of courses

let http = require("http");
let filesys = require("fs");
let PORT = 8441; // will listen to domain.com:8441/addcourse


// Checks if input is valid JSON
function isValidJson(str) {
  try {
    JSON.parse(str);
  } catch(err) {
    return false;
  }
  return true;
}

// Set up server for handling incoming HTTP POSTs
http.createServer(function(request,response) {
  if (request.method == "POST" && request.url == "/addcourse") {
    // Gather incoming data
    let requestBody = "";
    request.on("data", function(data) {
      requestBody += data;
      if(requestBody.length > 1e7) {
        response.writeHead(413, "Request Entity Too Large", {"Content-Type": "text/html"});
        response.end("<!doctype html><html><head><title>413</title></head><body>413: Request Entity Too Large</body></html>");
      }
    });

    // Get the already saved maps
    let savedMaps = JSON.parse(filesys.readFile("courses.json", function(err, data) {if (err) throw err}));
    if (isValidJson(requestBody)) {
      let recievedMap = JSON.parse(requestBody);

      // Check if generated courseId is unique
      function isIdUnique(id) {
        for (let i=0; i<savedMaps.length; i++) {
          if (savedMaps[i].courseId == id) {
            return false;
          }
        }
        return true;
      }

      // Generate new courseId (int between 100000 and 999999)
      function newId() {
        return Math.floor((Math.random() * 900000) + 100000);
      }

      // Create dictionary for putting the new map in
      let mapData = {};
      // Set parameters
      mapData.name = recievedMap.name;
      mapData.creator = recievedMap.creator;
      mapData.likes = 0;

      let id = newId();
      while (!isIdUnique(id)) {
        id = newId();
      }
      mapData.courseId = id;
      mapData.courseData = recievedMap.courseData;

      // Add new map to saved maps
      savedMaps.push(mapData);
    }
    // Write updated file to courses.json
    filesys.writeFile("courses.json",JSON.stringify(savedMaps), function(err, data) {if (err) throw err});
  }
}).listen(PORT);