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
var horses = {horses:{}
    
}
var list = {red_names:[]}
var oldnames = []
var old_banned_names = []
var able_to_restore = false
var has_token = false
var access_token
var wheel_mode = 0
var starting
var border_stroke = 2
var line_stroke = 2
var goal_stroke = 3
var horse_size = 2
var horse_speed = 12
var last_horse_angle = 0
var last_about_angle = 0
var last_after_angle = 0

window.addEventListener("load", (event)=>{
    const urlParams = new URLSearchParams(window.location.hash.substring(1))
    access_token = urlParams.get("access_token")
    if (access_token != null) {
        localStorage.setItem("access_token", access_token)
        window.location.replace("https://meowterspace5129.github.io/wheel/index.html")
    } else if (localStorage.getItem("access_token") != null) {
        access_token = localStorage.getItem("access_token")
        document.getElementById("generate_box").style.display = "none"
        document.getElementById("generate_button").style.display = "none"
        websocket()
    } else {
        
        document.getElementById("start_button").style.display = "none"
        document.getElementById("reset_button").style.display = "none"
        document.getElementById("restore_button").style.display = "none"
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
            if (data.error == "Unauthorized") {
                localStorage.removeItem("access_token")
                window.location.replace("https://meowterspace5129.github.io/wheel/index.html")
            }
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
        var this_color = color(random()*360, 100, 100)
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
    if (names.length == 0) return;
    isRunning = true;
    document.getElementById("start_button").style.backgroundColor="darkgreen"
    document.getElementById("winner_name").innerHTML = ""
    starting = true;
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
function changeMode() {
    if (wheel_mode == 0) wheel_mode = 1
    else wheel_mode = 0
}
function winner(name)
{
    document.getElementById("winner_name").innerHTML = name
    document.getElementById("start_button").style.backgroundColor="transparent"
    removeName(name)
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
    horses.geometry = [
        {type:"border", p:createVector(0,0), r:95},
        {type:"line", p1:createVector(10,10), p2:createVector(10,-10)},

        {type:"line", p1:createVector(-10,10), p2:createVector(-30,10)},
        {type:"line", p1:createVector(-10,-10), p2:createVector(-30,-10)},
        
        {type:"line", p1:createVector(0,-25), p2:createVector(0,-35)},
        {type:"line", p1:createVector(20,-25), p2:createVector(20,-30)},
        {type:"line", p1:createVector(-20,-25), p2:createVector(-20,-30)},

        {type:"line", p1:createVector(0,25), p2:createVector(0,35)},
        {type:"line", p1:createVector(20,25), p2:createVector(20,30)},
        {type:"line", p1:createVector(-20,25), p2:createVector(-20,30)},

        {type:"line", p1:createVector(25,5), p2:createVector(35,15)},
        {type:"line", p1:createVector(25,-5), p2:createVector(35,-15)},
        
        {type:"goal", p:createVector(40,0)}
    ]
}

function draw() {
    deltaTime /= 1000
    deltaTime = 1/60
    switch (wheel_mode) {
        case 0: drawWheel(); break
        case 1: drawHorses(); break
        case 2: drawList(); break
    }
}
function createBackground(name){
    
    var this_bkg_img
    if (backgrounds[name]==null) {
        var template
        if (colors[name][0] == "grid") {template = img_grid}
        if (colors[name][0] == "uwu") {template = img_uwu}
        template.loadPixels()
        var this_color_1 = colors[name][1]
        var this_color_2 = colors[name][2]
        var this_bkg_img = createImage(template.width, template.height)
        this_bkg_img.loadPixels()
        this_bkg_img.pixels.forEach((e,ind)=>{
            if (ind%4!=0) return;
            var this_color
            if (template.pixels[ind] == 0) {
                this_color = this_color_1
            } else {
                this_color = this_color_2
            }
            this_bkg_img.pixels[ind+0] = red(this_color)
            this_bkg_img.pixels[ind+1] = green(this_color)
            this_bkg_img.pixels[ind+2] = blue(this_color)
            this_bkg_img.pixels[ind+3] = alpha(this_color)*255
        })
        this_bkg_img.updatePixels()
        this_bkg_img.resizeNN(width, height)
        backgrounds[name] = this_bkg_img;
    } else {
        this_bkg_img = backgrounds[name]
    }
    return this_bkg_img
}
function drawWheel() {
    var rotated = 0
    if (starting) {
        wheel.v=wheel.launch_speed
        wheel.a=Math.random()*PI*2
        starting = false;
    }
    translate(width/2, height/2)
    scale(min(width,height),min(width,height))
    scale(1/100,1/100)
    clear()
    rotated+=wheel.a;
    rotate(wheel.a)
    for(var i=0;i<names.length;i++){
        push()
        beginClip()
        arc(0,0,95,95,(1/names.length)*PI*-1,(1/names.length)*PI,PIE)
        endClip()
        

        var this_grid_img = createBackground(names[i])
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
    rotated=0
    rotated+=wheel.a;
    rotate(wheel.a)

    for(var i=0;i<names.length;i++){
        stroke(0)
        strokeWeight(1)
        line(0,0,cos((1/names.length)*PI)*47.5,sin((1/names.length)*PI)*47.5)
        line(0,0,cos((1/names.length)*PI)*47.5,sin((1/names.length)*PI)*47.5)

        rotated+=(1/names.length)*PI*2
        rotate((1/names.length)*PI*2)
    }
    for(var i=0;i<names.length;i++){
        stroke(255)
        strokeWeight(0.5)
        line(0,0,cos((1/names.length)*PI)*47.5,sin((1/names.length)*PI)*47.5)
        line(0,0,cos((1/names.length)*PI)*47.5,sin((1/names.length)*PI)*47.5)

        rotated+=(1/names.length)*PI*2
        rotate((1/names.length)*PI*2)
    }
    
    rotate(-rotated)
    rotated=0
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
        var ratio = wheel.a/(PI*2)
        var actialratio = ratio - (1/names.length/2)
        actialratio = ((actialratio % 1 ) + 1) % 1
        var index = names.length - 1 - Math.floor(actialratio*names.length)
        winner(names[index])
    }
}
function drawHorses() {
    translate(width/2, height/2)
    scale(min(width,height),min(width,height))
    scale(1/100,1/100)
    clear()
    
    names.forEach(e=>{
        if (horses.horses[e] == null)
            horses.horses[e] = {p:createVector(random()*2-1,random()*2-1),v:createVector(0,0), owner:e}
    })

    if (starting) {
        for (var horse of Object.values(horses.horses)){
            horse.v.x=0
            horse.v.y=17
            horse.v.setHeading(random()*2*PI)
        }
        starting = false;
    }

    for(var e of horses.geometry) {
        if(e.type == "border") {
            stroke(255)
            fill(25)
            strokeWeight(border_stroke)
            circle(e.p.x,e.p.y,e.r)
            stroke(0)
            noFill()
            strokeWeight(border_stroke/2)
            circle(e.p.x,e.p.y,e.r)
            for(var horse of Object.values(horses.horses)){
                if (horse.p.dist(e.p) > e.r/2 - horse_size/2 - border_stroke) {
                    
                    reflectHorse(horse, p5.Vector.sub(e.p,horse.p))
                }
            }
        }
        if(e.type == "line") {
            stroke(255)
            strokeWeight(line_stroke)
            noFill()
            line(e.p1.x,e.p1.y,e.p2.x,e.p2.y)
            strokeWeight(line_stroke/2)
            stroke(0)
            line(e.p1.x,e.p1.y,e.p2.x,e.p2.y)

            
            for(var horse of Object.values(horses.horses)){
                var result = pDistance(horse.p.x,horse.p.y, e.p1.x,e.p1.y, e.p2.x,e.p2.y)
                if (result.v < horse_size/2+line_stroke/2)
                {
                    if (result.p == "1"){
                        reflectHorse(horse, p5.Vector.sub(e.p1,horse.p))
                    } else if (result.p == "2"){
                        reflectHorse(horse, p5.Vector.sub(e.p2,horse.p))
                    } else {
                        reflectHorse(horse, p5.Vector.sub(e.p1,e.p2).rotate(PI/2))
                    }
                }
            }
        }
        if(e.type == "goal"){
            noStroke()
            fill(255,200,0)
            circle(e.p.x,e.p.y,goal_stroke)
            for(var horse of Object.values(horses.horses)){
                if (horse.p.dist(e.p) < horse_size/2 + goal_stroke/2) {
                    winner(horse.owner)
                    isRunning = false
                    for(var horse of Object.values(horses.horses)){
                        horse.p=createVector(random()*2-1,random()*2-1)
                        horse.v=createVector(0,0)
                    }
                }
            }
        }
    }

    for(var i=0;i<names.length;i++){
        this_horse = horses.horses[names[i]]
        push()
        beginClip()
        translate(this_horse.p.x, this_horse.p.y)
        drawHorse()
        translate(-this_horse.p.x, -this_horse.p.y)
        endClip()

        var this_bkg_img = createBackground(names[i])
        image(this_bkg_img,-50,-50,100,100)

        translate(this_horse.p.x, this_horse.p.y)
        noFill()
        strokeWeight(0.4)
        stroke(255)
        drawHorse()

        strokeWeight(0.2)
        stroke(0)
        drawHorse()

        translate(-this_horse.p.x, -this_horse.p.y)
        
        pop()
        this_horse.p.x+=this_horse.v.x*deltaTime
        this_horse.p.y+=this_horse.v.y*deltaTime
    }
}
function drawList() {
    translate(width/2, height/2)
    scale(min(width,height),min(width,height))
    scale(1/100,1/100)
    clear()

    for(var i=0;i<names.length;i++){
        push()
        strokeJoin(ROUND)
        textAlign(RIGHT, CENTER)
        textSize(20)
        
        //beginClip()
        fill(255)
        //rect(0,0,20,20)
        text(names[i],0,0)
        //endClip()
        
        var this_grid_img = createBackground(names[i])
        //image(this_grid_img,-50,-50,100,100)

        
        pop()
    }



}
function reflectHorse(horse, normal) {
    horse.v.reflect(normal)
    horse.v.rotate((random()*2-1)*0.1)
}
function drawHorse()
{
    beginShape()
    vertex(1,0)
    vertex(0,-1)
    vertex(-2,-1)
    vertex(-1,0)
    vertex(-1,2)
    vertex(0,1)
    vertex(1,2)
    endShape(CLOSE)
}

function pDistance(x, y, x1, y1, x2, y2) {

    var A = x - x1;
    var B = y - y1;
    var C = x2 - x1;
    var D = y2 - y1;
    var p;
    var dot = A * C + B * D;
    var len_sq = C * C + D * D;
    var param = -1;
    if (len_sq != 0) //in case of 0 length line
        param = dot / len_sq;

    var xx, yy;

    if (param < 0) {
    xx = x1;
    yy = y1;
    var p = "1"
    }
    else if (param > 1) {
    xx = x2;
    yy = y2;
    var p = "2"
    }
    else {
    xx = x1 + param * C;
    yy = y1 + param * D;
    var p = "0"
    }

    var dx = x - xx;
    var dy = y - yy;
    return {v:Math.sqrt(dx * dx + dy * dy),p:p};
}