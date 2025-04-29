const net = require('node:net');
const readline = require('node:readline');
const fs = require('node:fs');

var address = fs.readFileSync("address")
setInterval(()=>{}, 1000);
console.log("hello Docker, Client Speaking")


const socket = net.createConnection({host: address, port: 5001, family:4 },() => {
  // 'connection' listener.
  console.log('client connected to server');
})
socket.setEncoding("utf-8")
socket.on("error", (e)=>{
  console.log("Error occured: ", e)

})
socket.on('data', (data) => {
  dataRecieved(data)
});
socket.on('end', () => {
  console.log('disconnected from server');
});


function dataRecieved(data) {
  switch (data[0])
  {
    case "H":
      requestTask()
      break;
    case "S":
      findPrimes(data)
      break;
  }
}

function requestTask() {
  socket.write("R")
}

function findPrimes(data) {
  endpoints = data.split(" ")
  console.log(endpoints)
  for(var to_check = parseInt(endpoints[1]); to_check<= parseInt(endpoints[2]); to_check++) {
    console.log("check: ", to_check)
    var is_prime = true;
    for (var divisor = 2; divisor < (to_check/2) +1; divisor ++){
      if (Math.ceil(to_check/divisor) == Math.floor(to_check/divisor) ) {
          is_prime = false;
          break;
      }
    }
    if(is_prime){
      console.log("found prime", to_check)
      socket.write("F " + to_check);
    }
  }
  //requestTask()
}