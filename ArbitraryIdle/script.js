var tickInterval = 20;
var saveInterval = 30*1000;
var tickIntervalID;
var saveIntervalID;
var resources = {};
var recipes = {
    "produce_material":{cost:[{name:"none", amt:0}], make:[{name:"material", amt:1}]},
    "automate":{cost:[{name:"metal", amt:10}], make:[{name:"robot", amt:1}]},
    "differentiate":{cost:[{name:"material", amt:5}], make:[{name:"metal", amt:1},{name:"polymer",amt:1}]},
    "synergize":{cost:[{name:"metal", amt:5},{name:"polymer", amt:10}], make:[{name:"compound", amt:1}]}
}
var resourceReference = ["Material", "Metal", "Polymer", "Robot", "Compound"];
window.addEventListener("load", (event) => {
    start()
  });
function start()
{
    setupResList()
    gameLoad()

    tickIntervalID = setInterval(tick, tickInterval);
    saveIntervalID = setInterval(save, saveInterval);
}
function setupResList()
{
    resListElement = document.getElementById("res_list")
    for(i=0;i<resourceReference.length;i++)
    {
        node = document.createElement("div")
        node.setAttribute("class", "res_label")
        node.setAttribute("id", "res_"+resourceReference[i].toLowerCase())
        resListElement.appendChild(node)

    }

}
function gameLoad()
{
    var lsResources = localStorage.getItem("resources")
    console.log(lsResources)
    if(lsResources == undefined || lsResources == null)
    {
        lsResources = "{}";
    }
    console.log(lsResources)
    resources = JSON.parse(lsResources);
}
function tick()
{
    updateDisplay()
    incResource("material", getResource("robot")/(1000/(tickInterval)))
}
function save()
{
    console.log("saved")
    localStorage.setItem("resources", JSON.stringify(resources))
    lsResources = localStorage.getItem("resources")
    console.log(lsResources)
}
function resetGame()
{
    localStorage.clear();
    location.reload();
}
function updateDisplay()
{
    for(i=0;i<resourceReference.length;i++)
    {
        document.getElementById("res_"+ resourceReference[i].toLowerCase()).innerHTML = "" + resourceReference[i] + ": " + getResource(resourceReference[i].toLowerCase()).toFixed(2)
    }
}
function act(row, col)
{
    if(row==0&&col==0)
    {
        useRecipe("produce_material")
    }
    if(row==1&&col==0)
    {
        useRecipe("automate")
    }
    if(row==1&&col==1)
    {
        useRecipe("differentiate")
    }
    if(row==1&&col==2)
    {
        useRecipe("synergize")
    }
    updateDisplay();
}
function useRecipe(name)
{
    thisRecipe = recipes[name];
    canAfford = true
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
    if(canAfford)
    {
        for(i=0;i<thisRecipe.cost.length;i++)
        {
            thisResource = thisRecipe.cost[i]
            incResource(thisResource.name, -thisResource.amt)
        }
        for(i=0;i<thisRecipe.make.length;i++)
        {
            thisResource = thisRecipe.make[i]
            incResource(thisResource.name, thisResource.amt)
        }
    }

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
    return true;

}