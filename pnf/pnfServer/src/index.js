import * as net from 'node:net'
import * as fs from 'node:fs'
console.log("hello Docker, Server Speaking")


var batch_size = 1000;
var founds = [];
var highest_sent_number = 1;

//keepalive
setInterval(()=>{}, 1000)
if (fs.existsSync("primes.txt")){
  fs.rmSync("primes.txt")
}
const server = net.createServer((socket) => {
  socket.setEncoding("utf-8")
  socket.on('end', () => {
    console.log('client disconnected');
  });
  socket.on('data', function(data) {dataRecieved(socket, data)});

  console.log('client connected');
  console.log("writing h")
  socket.write("H");
    
})
server.on('error', (err) => {
  console.log("an error occured")
});

//makes the server start listenting to the port
server.listen({port:5001, host:"0.0.0.0"}, () => {
  console.log('server bound');
});

function dataRecieved(socket, data) {
  switch (data[0])
  {
    case "R":
      sendTask(socket)
      break;
    case "F":
      processResults(data)
      break;
  }
}

function sendTask(socket) {
  socket.write("S " + (highest_sent_number + 1) + " " + (highest_sent_number + batch_size))
  console.log("starting task: ", (highest_sent_number + 1), " - ", (highest_sent_number + batch_size))
  highest_sent_number += batch_size;
}

function processResults(data) {
  fs.appendFileSync("primes.txt", data.slice(2) + "\n")
  console.log("found prime: ", parseInt(data.slice(2)))
}