var names = []
var banned_names = []
var canvas
var wheel_section
var colors = {}
var backgrounds = {}
var isRunning = false;
var wheel = {a:0,v:0,
    launch_speed:100,
    friction:0.7,
    friction_hard:1.6, 
    hard_threshold:2,

}
var oldnames = []
var old_banned_names = []
var able_to_restore = false
var has_token = false
var access_token


window.addEventListener("load", (event)=>{
    const urlParams = new URLSearchParams(window.location.hash.substring(1))
    access_token = urlParams.get("access_token")
    if (access_token != null) {
        localStorage.setItem("access_token", access_token)
        window.location.replace("https://meowterspace5129.github.io/wheel/index.html")
    }
    else if (localStorage.getItem("access_token") != null) {
        access_token = localStorage.getItem("access_token")
        websocket()
    }

})


var is_socket_open = false;
var websocket_session_id;
async function websocket() {
    var response = await fetch("https://id.twitch.tv/oauth2/validate", {
		method:"get",
		headers:{
            "Authorization" : "OAuth " + access_token
        },
	})
    var data = await response.json();
    user = data.user_id

    socket = new WebSocket("wss://eventsub.wss.twitch.tv/ws");
    socket.addEventListener('open', async event => {
    })
    socket.addEventListener('message', async event => {
        var message = JSON.parse(event.data)
        if (message.metadata.message_type == "session_welcome") {
            websocket_session_id = message.payload.session.id
            is_socket_open = true;

            var response = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
                method:"post",
                headers: {
                    "Authorization": "Bearer " + access_token,
                    "Content-Type": "application/json",
                    "Client-Id": "xhkdzxezvzvekg0hck3kflplnj912i"
                },
                body:JSON.stringify({
                    "type": "channel.chat.message",
                    "version": "1",
                    "condition": {
                        "broadcaster_user_id": "772777589",
                        "user_id": user,
                    },
                    "transport": {
                        "method": "websocket",
                        "session_id": websocket_session_id,
                    }
                }),
            })
            var data = await response.json();
        }
        if(message.metadata.message_type =="notification") {
            websocket_received(message.payload.event)
        }
    })
    socket.addEventListener("close", async event => {
        is_socket_open = false
    })
}
function websocket_received(event)
{
    if (isRunning) return;
    if (event.message.text=="1")
    {
        if(banned_names.indexOf(event.chatter_user_name)==-1)
        appendName(event.chatter_user_name)
        banned_names.push(event.chatter_user_name)
    }
}
p5.Image.prototype.resizeNN = function (w, h) {
  "use strict";

  // Locally cache current image's canvas' dimension properties:
  const { width, height } = this.canvas;

  // Sanitize dimension parameters:
  w = ~~Math.abs(w), h = ~~Math.abs(h);

  // Quit prematurely if both dimensions are equal or parameters are both 0:
  if (w === width && h === height || !(w | h))  return this;

  // Scale dimension parameters:
  if (!w)  w = h*width  / height | 0; // only when parameter w is 0
  if (!h)  h = w*height / width  | 0; // only when parameter h is 0

  const img = new p5.Image(w, h), // creates temporary image
        sx = w / width, sy = h / height; // scaled coords. for current image

  this.loadPixels(), img.loadPixels(); // initializes both 8-bit RGBa pixels[]

  // Create 32-bit viewers for current & temporary 8-bit RGBa pixels[]:
  const pixInt = new Int32Array(this.pixels.buffer),
        imgInt = new Int32Array(img.pixels.buffer);

  // Transfer current to temporary pixels[] by 4 bytes (32-bit) at once:
  for (var x = 0, y = 0; y < h; x = 0) {
    const curRow = width * ~~(y/sy), tgtRow = w * y++;

    while (x < w) {
      const curIdx = curRow + ~~(x/sx), tgtIdx = tgtRow + x++;
      imgInt[tgtIdx] = pixInt[curIdx];
    }
  }

  img.updatePixels(); // updates temp 8-bit RGBa pixels[] w/ its current state

  // Resize current image to temporary image's dimensions:
  this.canvas.width = this.width = w, this.canvas.height = this.height = h;
  this.drawingContext.drawImage(img.canvas, 0, 0, w, h, 0, 0, w, h);

  return this;
};
function appendName(name) {
    if (document.getElementById("name_" + name) != null || name == null || name=="") {
        return;
    }
    if (colors[name] == null) {
        colorMode(HSB)
        var this_color = color(random()*512, 100, 100)
        colors[name] = ["grid", this_color, this_color]
        colorMode(RGB)

    }
    names.push(name)
    document.getElementById("names_section").innerHTML+=
                    "<div class=\"name\" id=\"name_"+name+"\">\n" +
                    "   " + name + "\n" +
                    "   <button onClick=\"removeName(&quot;"+name+"&quot;)\"> X </button>\n"+
                    "</div>"
                    
}
function removeName(name) {
    document.getElementById("name_" + name).remove();
    names.splice(names.indexOf(name),1);
}
function addCustomName() {
    if (document.getElementById("add_name_input").value=="") return;
    appendName(document.getElementById("add_name_input").value)
    document.getElementById("add_name_input").value = ""
}
function start() {
    if (isRunning) return;
    isRunning = true;
    if (names.length == 0) return;
    document.getElementById("start_button").style.backgroundColor="darkgreen"
    document.getElementById("winner_name").innerHTML = ""
    wheel.v=wheel.launch_speed
    wheel.a=Math.random()*PI*2
}
function reset() {
    oldnames = [...names]
    oldnames.forEach(e => removeName(e))
    old_banned_names = [...banned_names]
    banned_names = []
    able_to_restore = true
}
function restore() {
    oldnames.forEach(e => appendName(e))
    old_banned_namess.forEach(e => banned_names.push(e))

}
function winner()
{
    if (names.length == 0) return;
    var ratio = wheel.a/(PI*2)
    var actialratio = ratio - (1/names.length/2)
    actialratio = ((actialratio % 1 ) + 1) % 1
    var index = names.length - 1 - Math.floor(actialratio*names.length)
    document.getElementById("winner_name").innerHTML = names[index]
    document.getElementById("start_button").style.backgroundColor="transparent"
    removeName(names[index])
}
var img_grid
function preload()
{
    img_grid = loadImage("https://meowterspace5129.github.io/wheel/assets/grid.png")
    img_uwu = loadImage("https://meowterspace5129.github.io/wheel/assets/uwu.png")
}
function setup() {
    colorMode(RGB)
    colors = {
        "MeowterSpace5129" : ["uwu", color(255,0,255), color(128,0,128)],
        "ringtail216" : ["grid", color(200,200,190), color(20,20,20)]
    }
    wheel_section = document.getElementById("wheel_section")
    canvas = createCanvas(wheel_section.clientWidth, wheel_section.clientHeight + 100);
    canvas.parent(wheel_section)
}

function draw() {
    deltaTime /= 1000
    var rotated = 0
    translate(width/2, height/2)
    scale(min(width,height),min(width,height))
    scale(1/100,1/100)
    clear()
    rotated+=wheel.a;
    rotate(wheel.a)
    for(var i=0;i<names.length;i++){
        push()
        /*
        translate(width/2, height/2)
        scale(width, height)
        
        */
        beginClip()
        arc(0,0,95,95,(1/names.length)*PI*-1,(1/names.length)*PI,PIE)
        endClip()
        var this_grid_img
        if (backgrounds[[names[i]]]==null) {
            var template
            if (colors[names[i]][0] == "grid") {template = img_grid}
            if (colors[names[i]][0] == "uwu") {template = img_uwu}
            template.loadPixels()
            var this_color_1 = colors[names[i]][1]
            var this_color_2 = colors[names[i]][2]
            var this_grid_img = createImage(template.width, template.height)
            this_grid_img.loadPixels()
            this_grid_img.pixels.forEach((e,ind)=>{
                if (ind%4!=0) return;
                var this_color
                if (template.pixels[ind] == 0) {
                    this_color = this_color_1
                } else {
                    this_color = this_color_2
                }
                this_grid_img.pixels[ind+0] = red(this_color)
                this_grid_img.pixels[ind+1] = green(this_color)
                this_grid_img.pixels[ind+2] = blue(this_color)
                this_grid_img.pixels[ind+3] = alpha(this_color)*255
            })
            this_grid_img.updatePixels()
            this_grid_img.resizeNN(width, height)
            backgrounds[names[i]] = this_grid_img;
        } else {
            this_grid_img = backgrounds[names[i]]
        }

        rotate(-rotated)
        image(this_grid_img,-50,-50,100,100)
        rotate(rotated)
        pop()

        fill(0)
        stroke(255)
        strokeWeight(0.5)
        strokeJoin(ROUND)
        textAlign(RIGHT, CENTER)
        var textlength = names[i].length
        var textfraction = textlength/25
        var textamount = textfraction < 0.5? 0:(textfraction-0.5)*2
        textSize(4 - 2*textamount)
        

        text(names[i],45,0)


        rotated+=(1/names.length)*PI*2
        rotate((1/names.length)*PI*2)
    }
    rotate(-rotated)
    fill(255)
    stroke(0)
    strokeWeight(0)
    beginShape()
    vertex(47,0)
    vertex(50,-10)
    vertex(50,10)
    endShape(CLOSE)


    wheel.a += wheel.v*deltaTime
    
    if (wheel.a > PI*2) {
        wheel.a-=PI*2
    }
    if(wheel.v > wheel.hard_threshold) {
        wheel.v *= 1 - (wheel.friction * deltaTime)
    } else {
        wheel.v *= 1 - (wheel.friction_hard * deltaTime)
    }
    if (wheel.v < 0.01 && isRunning) {
        wheel.v = 0
        isRunning = false
        winner()
    }
}
