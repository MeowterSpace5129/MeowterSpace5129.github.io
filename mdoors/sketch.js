var player = {x:50, y:0, dx:0, dy:0, speed:0.5, decel: 0.8}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function setup() {
  canvas = createCanvas(windowWidth, windowHeight)
}

function draw() {
  tick()
  draws()
}
function tick(){
  var xn = 0;
  var yn = 0;
  if(keyIsDown(87))
    yn -= 1
  if(keyIsDown(83))
    yn += 1
  if(keyIsDown(65))
    xn -= 1
  if(keyIsDown(68))
    xn += 1

  var a = atan2(yn,xn)
  var d = yn!=0||xn!=0?1:0

  player.dx += cos(a)*d * player.speed
  player.dy += sin(a)*d * player.speed

  player.dx *=player.decel
  player.dy *=player.decel

  player.x+=player.dx;
  player.y+=player.dy;


}
function draws(){

  background(200)
  fill(255,255,0)
  stroke(0)
  strokeWeight(3)
  circle(player.x,player.y, 20);
}