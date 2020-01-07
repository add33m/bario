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

// Better organised console printing with timestamps
function cprint(str) {
  let time = new Date()
  console.log(time.getFullYear()+"-"+(time.getMonth()+1)+"-"+time.getDate()+":"+time.getHours()+":"+time.getMinutes()+":"+time.getSeconds()+":"+time.getMilliseconds() + ">> " + str);
}

// Set up server for handling incoming HTTP POSTs
http.createServer(function(request,response) {
  cprint("Recieved XHR!");

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

    // Do processing when data stream has ended
    request.on("end", function() {
      cprint("Collected request data");

      // Get the already saved maps
      let savedMaps;
      filesys.readFile(__dirname+"/courses.json", function(err, data) {
        if (err) throw err;
        savedMaps = JSON.parse(data);
        cprint("Gathered courses.json");

        function isMapValid(map) {
          // Map must be of valid JSON format and an array
          if (!Array.isArray(map)) {
            cprint("Course is not an array!");
            // Finish XHR with 403 response
            response.writeHead(403, "Forbidden", {"Content-Type": "text/html"});
            response.end("Course is not an array!");
            cprint("Ended XHR");
            return false;
          }

          // Go through every block and make sure it is a valid block
          let blocks = ["inv","bricks","block","flagpole","mushroom_block","used_block","goomba"] // All allowed/valid blocks
          for (let i=0; i<map.length;i++) {
            let block = map[i];
            if (!Array.isArray(block)) {
              // If block isn't even an array
              cprint("Invalid block detected!");
              // Finish XHR with 403 response
              response.writeHead(403, "Forbidden", {"Content-Type": "text/html"});
              response.end("Invalid block detected!");
              cprint("Ended XHR");
              return false;
            }

            if (isNaN(block[0]) || isNaN(block[1])) {
              // If block coordinate is not a number
              cprint("Invalid block coordinate detected!");
              // Finish XHR with 403 response
              response.writeHead(403, "Forbidden", {"Content-Type": "text/html"});
              response.end("Invalid block coordinate detected!");
              cprint("Ended XHR");
              return false;
            }

            let blockType = block[2]; // Blocktype is in index 2 of every block array: [x,y,"blocktype"]
            if (blocks.indexOf(blockType) == -1) {
              // If blocktype is not found in blocks array
              cprint("Invalid blocktype detected!");
              // Finish XHR with 403 response
              response.writeHead(403, "Forbidden", {"Content-Type": "text/html"});
              response.end("Invalid blocktype detected!");
              cprint("Ended XHR");
              return false;
            }
          }

          // If nothing fails the test
          return true;
        }

        function isMapUnique(map) {
          // Map can't be the same as an already existing map
          for (let i=0; i<savedMaps.length; i++) {
            if (JSON.stringify(savedMaps[i].courseData) == JSON.stringify(map)) {
              // If map is recognized as the same
              // Finish XHR with 403 response
              response.writeHead(403, "Forbidden", {"Content-Type": "text/html"});
              response.end("Course already exists!");
              cprint("Ended XHR");
              return false;
            }
          }
          // If map isn't recognized as the same as any other
          return true;
        }

        cprint("Map is valid? " + isMapValid(JSON.parse(JSON.parse(requestBody).courseData)));
        cprint("Map is unique? " + isMapUnique(JSON.parse(JSON.parse(requestBody).courseData)));

        // Save map if valid and unique
        if (isValidJson(requestBody) && isMapValid(JSON.parse(JSON.parse(requestBody).courseData)) && isMapUnique(JSON.parse(JSON.parse(requestBody).courseData))) {
          cprint("Saving map...")

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

          // Generate and set a unique id for the new course
          let id = newId();
          while (!isIdUnique(id)) {
            id = newId();
          }
          mapData.courseId = id;

          mapData.courseData = JSON.parse(recievedMap.courseData);

          // Add new map to saved maps
          savedMaps.push(mapData);

          // Write updated file to courses.json
          filesys.writeFile(__dirname+"/courses.json",JSON.stringify(savedMaps), function(err, data) {
            if (err) cprint(err);
          });
          cprint("Wrote to courses.json");

          // Finish XHR with 200 response
          response.writeHead(200, "OK", {"Content-Type": "text/html"});
          response.end("Course published successfully!");
          cprint("Ended XHR");
        }
      });
    });
    
  }
}).listen(PORT);

console.log("Listening to port " + PORT);