var tickInterval = 20;
var saveInterval = 30*1000;
var tickIntervalID;
var saveIntervalID;
var resources = {};
var caps = {};


var robotCounts;
var robotsInUse = 0
var robotProgress = {};
var tierRefence = ["basic", "advanced"]

var playerSelected = ""
var resourceReference = {
    basic:["Material", "Metal", "Polymer", "Robot", "Compound"], 
    advanced:["Station", "Core", "Part", "Interconnect", "Enhancement", "Upgrade", "Pylon"]};

var recipeReference = [
    "produce",
    "automate", "differentiate", "synergize",
    "build station", "refine robot", "assemble parts", 
    "connect stations", "enhance productivity", "upgrade robots",
    "construct pylon"]

var recipeButtons = {
    "0.0" : "produce",

    "1.0" : "automate",
    "1.1" : "differentiate",
    "1.2" : "synergize",

    "2.0" : "build station",
    "2.1" : "refine robot",
    "2.2" : "assemble parts",

    "3.0" : "connect stations",
    "3.1" : "enhance productivity",
    "3.2" : "upgrade robots",

    "4.0" : "construct pylon"
}
var recipes = {
    "produce" : {cost:[{name:"none", amt:0}], make:[{name:"material", amt:1}], time:1},
    "automate" : {cost:[{name:"metal", amt:10}], make:[{name:"robot", amt:1}], time:15},
    "differentiate" : {cost:[{name:"material", amt:5}], make:[{name:"metal", amt:1},{name:"polymer",amt:1}], time:5},
    "synergize" : {cost:[{name:"metal", amt:5},{name:"polymer", amt:10}], make:[{name:"compound", amt:1}], time:10},
    "build station": {cost:[{name:"compound", amt:5}, {name:"core", amt:1}], make:[{name:"station", amt:1}], time: 30},
    "refine robot" : {cost:[{name:"robot", amt:3}], make:[{name:"core", amt:1}], time: 10},
    "assemble parts" : {cost:[{name:"core", amt:5}, {name:"compound", amt:30}], make:[{name:"part", amt:1}], time:20},
    "connect stations" : {cost:[{name:"part", amt:2}, {name:"station", amt:2}], make:[{name:"interconnect", amt:1}], time: 60},
    "enhance productivity" : {cost:[{name:"core", amt:1}], make:[{name:"enhancement", amt:1}], time:30},
    "upgrade robots": {cost:[{name:"enhancement", amt:5},{name:"part", amt:5}], make:[{name:"upgrade", amt:1}], time:15},
    "construct pylon" : {cost:[{name:"part", amt:500}], make:[{name:"pylon", amt:1}], time: 30}
}
var capBuffers = 
{
    "station" : [{name:"robot", amt:1}],
    "interconnect" : [{name:"station", amt:1}]
}
window.addEventListener("load", (event) => {
    start()
  });
window.addEventListener("beforeunload", (event) => {
    document.getElementById("action_panel").scrollTo(0,0)
});
  
function start()
{
    setupResList()
    calculateCaps()
    initializeRobots()
    gameLoad()
    verifyRobotCounts()
    tickIntervalID = setInterval(tick, tickInterval);
    saveIntervalID = setInterval(save, saveInterval);
}
function setupResList()
{
    resListElement = document.getElementById("res_list_basic");
    for(i=0;i<resourceReference.basic.length;i++)
    {
        node = document.createElement("div");
        node.setAttribute("class", "res_label");
        node.setAttribute("id", "res_"+resourceReference.basic[i].toLowerCase());
        resListElement.appendChild(node)
    }
    resListElement = document.getElementById("res_list_advanced");
    for(i=0;i<resourceReference.advanced.length;i++)
    {
        node = document.createElement("div");
        node.setAttribute("class", "res_label");
        node.setAttribute("id", "res_"+resourceReference.advanced[i].toLowerCase());
        resListElement.appendChild(node);
    }

}
function calculateCaps()
{
    caps["material"] = 100;
    caps["metal"] = 50;
    caps["polymer"] = 50;
    caps["robot"] = 5;
    caps["compound"] = 50;
    caps["station"] = 10;
    caps["core"] = 50;
    caps["part"] = 500;
    caps["interconnect"] = 20;
    caps["enhancement"] = 20;
    caps["upgrade"] = 20
    caps["pylon"] = 1;
    for( const [key,value] of Object.entries(capBuffers))
    {
        for(i=0;i<value.length;i++)
        {
            caps[value[i].name] += value[i].amt * getResource(key);
        }
    }

}

function initializeRobots()
{
    for(i=0;i<recipeReference.length;i++)
    {
        robotProgress[recipeReference[i]] = 0
        var buttonid = getKeyByValue(recipeButtons, recipeReference[i])
        var buttonidcomma = buttonid.replace(".", ",")
        
        objectHTML = `<div class="robot_menu" id="robot.${buttonid}">
        <div class="robot_minus" id="robot.${buttonid}.0" onclick="robot(event, ${buttonidcomma},0)">
            &#45;
        </div>
        <div class="robot_label" id="robot.${buttonid}.1"> 
            <div class="robot_label_text" id="robot_label_text.${buttonid}"> 0 </div> 
            <div class="robot_label_bar" id="robot_label_bar.${buttonid}"></div> 
        </div>
        <div class="robot_plus" id="robot.${buttonid}.2" onclick="robot(event, ${buttonidcomma},1)">
            &#43;
        </div>
    </div>`
        document.getElementById("act." + buttonid).insertAdjacentHTML("beforeend", objectHTML)
    }
    

}
function verifyRobotCounts()
{
    for(const [name, amount] of Object.entries(robotCounts))
    {
        if(Number.isNaN(amount) || amount == undefined)
        {
            robotCounts[name] = 0
        }

    }

}
function gameLoad()
{
    var lsResources = localStorage.getItem("resources")
    if(lsResources == undefined || lsResources == null)
    {
        lsResources = "{}";
    }
    resources = JSON.parse(lsResources);

    var lsRobots = localStorage.getItem("robots")
    if(lsRobots == undefined || lsRobots == null)
    {
        robotCounts = {}
        for(i=0;i<recipeReference.length;i++)
        {
            robotCounts[recipeReference[i]] = 0
        }
    }
    else
    {
        robotCounts = JSON.parse(lsRobots);
    }
    
    var lsRobotsInUse = localStorage.getItem("robotsInUse")
    if(lsRobotsInUse == undefined || lsRobotsInUse == null)
    {
        robotsInUse = 0;
    }
    else
    {
        robotsInUse = JSON.parse(lsRobotsInUse);
    }
}
function save()
{
    localStorage.setItem("resources", JSON.stringify(resources))
    localStorage.setItem("robotsInUse", JSON.stringify(robotsInUse))
    localStorage.setItem("robots", JSON.stringify(robotCounts))
}

function tick()
{
    updateDisplay()
    for (const [key, value] of Object.entries(robotCounts)) {
        effValue = value + ( (playerSelected == key) ? 1 : 0 )
        perSecond = effValue * (1 + ( getResource("enhancement") * 0.25)) * Math.pow(1.15,getResource("upgrade"))
        robotProgress[key] += tickInterval/1000 * perSecond
        if(perSecond > 60 * recipes[key].time)
        {
            buttonid = getKeyByValue(recipeButtons, key)
            barmaxwidth = document.getElementById("robot." + buttonid + ".1").offsetWidth;
            document.getElementById("robot_label_bar." + buttonid).style.width = 1 * barmaxwidth + "px";
        }
        timesCompleted = Math.floor(robotProgress[key]/recipes[key].time)
        robotProgress[key]-=recipes[key].time*timesCompleted
        for(i=0;i<timesCompleted;i++){
            useRecipe(key)
        }
    }
    
    calculateCaps();
    for (const tier of tierRefence)
    {
        for(const name of resourceReference[tier])
        {
            id = name.toLowerCase()
            if(resources[id] > getCap(id))
            {
                resources[id] = getCap(id)
            }
        }

    }
}

function resetGame()
{
    localStorage.clear();
    location.reload();
}
function updateDisplay()
{
    for(i=0;i<resourceReference.basic.length;i++)
    {
        resName = resourceReference.basic[i]
        resID = resName.toLowerCase()
        element = document.getElementById("res_"+ resID)
        if(resourceReference.basic[i] == "Robot")
        {
            element.innerHTML = "" + resName + ": "+ (getResource(resID)-robotsInUse) + " / "+ getResource(resID) + " / " + getCap(resID)
        }
        else
        {
            element.innerHTML = "" + resName + ": " + getResource(resID) + " / " + getCap(resID)
        }
    }
    for(i=0;i<resourceReference.advanced.length;i++)
    {
        resName = resourceReference.advanced[i]
        resID = resName.toLowerCase()
        element = document.getElementById("res_"+ resID)

        element.innerHTML = "" + resName + ": " + getResource(resID) + " / " + getCap(resID)
    }
    for(i=0;i<recipeReference.length;i++)
    {
        var thisRecipe = recipeReference[i]
        var buttonid = getKeyByValue(recipeButtons, thisRecipe)
       
        document.getElementById("robot_label_text." + buttonid).innerHTML = robotCounts[recipeReference[i]];
        barmaxwidth = document.getElementById("robot." + buttonid + ".1").offsetWidth;
        document.getElementById("robot_label_bar." + buttonid).style.width = (robotProgress[thisRecipe]/recipes[thisRecipe].time) * barmaxwidth + "px";


    }

}
function act(row, col)
{
    var buttonid = row + "." + col;
    if(playerSelected == recipeButtons["" + row + "." + col])
    {
        lastButton = getKeyByValue(recipeButtons, playerSelected)
        document.getElementById("act." + lastButton).style.borderColor = ""
        playerSelected = ""
    }
    else
    {
        if(playerSelected != ""){
            lastButton = getKeyByValue(recipeButtons, playerSelected)
            document.getElementById("act." + lastButton).style.borderColor = ""
        }
        document.getElementById("act." + buttonid).style.borderColor = "orange"
        playerSelected = recipeButtons["" + row + "." + col]
    }
    updateDisplay();
}
function useRecipe(name)
{
    var thisRecipe = recipes[name];
    var canAfford = true;
    var canStore = false;
    for(i=0;i<thisRecipe.cost.length;i++)
    {
        thisResource = thisRecipe.cost[i]
        if(canBuyResource(thisResource.name, thisResource.amt))
        {
            continue;
        }
        canAfford = false;
        break;
    }
    for(i=0;i<thisRecipe.make.length;i++)
    {
        thisResource = thisRecipe.make[i]
        if(canStoreResource(thisResource.name, thisResource.amt))
        {
            canStore = true;
            break;
        }
    }
    if(canAfford && canStore)
    {
        for(i=0;i<thisRecipe.cost.length;i++)
        {
            thisResource = thisRecipe.cost[i];
            incResource(thisResource.name, -thisResource.amt);
        }
        for(i=0;i<thisRecipe.make.length;i++)
        {
            thisResource = thisRecipe.make[i];
            incResource(thisResource.name, thisResource.amt);
        }
    }
    else
    {
        calculateCaps();
        return false;
    }
    calculateCaps();
    return true;
}
function getResource(name)
{
    if(resources[name]==undefined)
    {
        resources[name] = 0;
    }
    if(resources[name] < 0)
    {
        resources[name] = 0;
    }
    return resources[name];
}
function getCap(name)
{
    if(caps[name]==undefined)
    {
        caps[name] = 0;
    }
    if(caps[name] < 0)
    {
        caps[name] = 0;
    }
    return caps[name];

}
function setResource(name, amt)
{
    resources[name] = amt;
    if(resources[name] < 0)
    {
        resources[name] = 0;
    }
    
}
function incResource(name, dif)
{
    setResource(name, getResource(name) + dif);

}
function canBuyResource(name, amt)
{
    if (getResource(name)<amt)
    {
        return false;
    }
    if(name=="robot"&&getResource(name)-robotsInUse<amt)
    {
        return false
    }
    if(name=="station"&&getCap("robot")-robotsInUse<amt)
    {
        return false
    }

    return true;

}
function canStoreResource(name, amt)
{
    if(getCap(name)-getResource(name) + amt >amt)
    {
        return true;
    }
    return false;
}
function robot(event, row, col, num)
{
    event.stopPropagation()
    recipeName = recipeButtons["" + row + "." + col]
    if(num==0&&robotCounts[recipeName] > 0){
        robotCounts[recipeName] -= 1;
        robotsInUse -=1;
    }
    if(num==1&&getResource("robot")>robotsInUse)
    {
        robotsInUse += 1
        robotCounts[recipeName] +=1

    }
}
function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}