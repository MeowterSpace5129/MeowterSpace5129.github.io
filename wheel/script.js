var names = []
var canvas
var wheel_section
var colors = {}
var isRunning = false;
var wheel = {a:0,v:0}
var oldnames = []
var able_to_restore = false
var has_token = false
var access_token
function appendName(name) {
    if (document.getElementById("name_" + name) != null) {
        return;
    }
    if (colors[name] == null) {
        colors[name] = Math.random()*255
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
    if (document.getElementById("add_name_input")=="") return;
    appendName(document.getElementById("add_name_input").value)
    document.getElementById("add_name_input").value = ""
}
function start() {
    if (isRunning) return;
    isRunning = true;
    wheel.v=0.02
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
function websocket() {
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
                        "broadcaster_user_id": 772777589,
                        "user_id": 0,
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
    if (event.message.text="1")
    {
        appendName(event.chatter_user_name)
    }
}

function preload()
{

}
function setup() {
    wheel_section = document.getElementById("wheel_section")
    canvas = createCanvas(wheel_section.clientWidth, wheel_section.clientHeight + 100);
    canvas.parent(wheel_section)
}
function winner()
{
    var ratio = wheel.a/(PI*2)
    var actialratio = (ratio+0.25)%1
    var index = Math.floor(actialratio*names.length)
    document.getElementById("winner_name").innerHTML = names[index]
}

function draw() {
    var rotated = 0
    translate(width/2, height/2)
    scale(width, height)
    clear()
    textAlign(CENTER)
    textSize(1/width*50)
    rotated+=wheel.a;
    rotate(wheel.a)
    for(var i=0;i<names.length;i++){
        fill(colors[names[i]])
        strokeWeight(1/width*5)
        arc(0,0,0.95,0.95,(1/names.length)*PI*-1,(1/names.length)*PI,PIE)
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
    wheel.v *= 1 - (0.001 * deltaTime)
    if (wheel.a > PI*2) {
        wheel.a-=PI*2
    }
    if(wheel.v < 0.001) {
        wheel.v *= 1 - (0.001 * deltaTime)
    }
    if (wheel.v < 0.00001 && isRunning) {
        wheel.v = 0
        isRunning = false
        winner()
    }
    
}
