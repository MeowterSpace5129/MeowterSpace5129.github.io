var names = []
var canvas
var wheel_section
var colors
var isRunning = false;
var wheel = {a:0,v:0,
    launch_speed:10,
    friction:0.5,
    friction_hard:0.9,
    hard_threshold:0.1,

}
var oldnames = []
var able_to_restore = false
var has_token = false
var access_token
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
    if (names.length == 0) return;
    isRunning = true;
    wheel.v=wheel.launch_speed
    wheel.a=Math.random()*PI*2
}
function reset() {
    oldnames = [...names]
    oldnames.forEach(e => removeName(e))
    able_to_restore = true
}
function restore() {
    oldnames.forEach(e => appendName(e))

}
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
    if (event.message.text=="1")
    {
        appendName(event.chatter_user_name)
    }
}
var grid_img
function preload()
{
    grid_img = loadImage("https://meowterspace5129.github.io/wheel/assets/grid.png")
}
function setup() {
    colorMode(RGB)
    colors = {
        "MeowterSpace5129" : ["grid", color(255,0,255), color(128,0,128)]
    }
    wheel_section = document.getElementById("wheel_section")
    canvas = createCanvas(wheel_section.clientWidth, wheel_section.clientHeight + 100);
    canvas.parent(wheel_section)
    grid_img.loadPixels()
}
function winner()
{
    if (names.length == 0) return;
    var ratio = wheel.a/(PI*2)
    var actialratio = ratio - (1/names.length/2)
    actialratio = ((actialratio % 1 ) + 1) % 1
    var index = names.length - 1 - Math.floor(actialratio*names.length)
    document.getElementById("winner_name").innerHTML = names[index]
}

function draw() {
    deltaTime /= 1000
    var rotated = 0
    translate(width/2, height/2)
    scale(width, height)
    clear()
    textAlign(CENTER)
    textSize(1/width*50)
    rotated+=wheel.a;
    rotate(wheel.a)
    for(var i=0;i<names.length;i++){
        strokeWeight(1/width*5)
        push()
        
        beginClip()
        arc(0,0,0.95,0.95,(1/names.length)*PI*-1,(1/names.length)*PI,PIE)
        endClip()


        this_grid_img = createImage(grid_img.width, grid_img.height)
        this_grid_img.loadPixels()
        this_grid_img.pixels = grid_img.pixels
        this_grid_img.pixels.forEach((e)=>{})
        console.log(this_grid_img.pixels[0])
        this_grid_img.updatePixels()


        pop()
        fill(0)
        strokeWeight(0)
        text(names[i],0.2,0)
        rotated+=(1/names.length)*PI*2
        rotate((1/names.length)*PI*2)
    }
    rotate(-rotated)
    fill(255)
    stroke(0)
    strokeWeight(0)
    beginShape()
    vertex(0.475,0)
    vertex(0.5,-0.1)
    vertex(0.5,0.1)
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
    }
    winner()
    if (keyIsDown(87)) {
        wheel.a+=0.001*deltaTime;
    }
}
