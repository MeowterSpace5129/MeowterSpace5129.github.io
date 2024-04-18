var canvas
var img_panel
var t = 0
var esor = {}


var inputField 

function setup()
{
    InitSim()

    img_panel = document.getElementById("Panel_Image")
    canvas = createCanvas(img_panel.offsetWidth, img_panel.offsetHeight);
    canvas.parent('Panel_Image')
    inputField = document.getElementById("Input")
    inputField.value = ""
    inputField.addEventListener("keyup", ({key}) => 
    {
        
        if (key === "Enter")
        {
            runTerminalCommand(inputField.value)
            inputField.value = ""
        }
    }
)
}
function windowResized()
{
    resizeCanvas(img_panel.offsetWidth, img_panel.offsetHeight)

}
function draw()
{
    UpdateSim()
    UpdateDisplays()
    t++

    var totalVolume = esor.composition.values.fuel + esor.composition.values.spent + esor.composition.values.coolant
    var radius = Math.cbrt(totalVolume*100) + 5

    background(0)
    fill(120,5,5)
    stroke(0)
    strokeWeight(0)
    circle(width/2, height/2, radius)


}
function InitSim()
{
    esor.coolant = {values:{amount:0, reserve:0}, settings:{injectionRate:0, energyRate:0}}
    esor.core = {values:{heat:0, spin:0, pressure:0}, settings:{spin:0, vent:0}}
    esor.shield = {values:{strength:0, energy:0, stress:0, cost:0}, settings:{energyRate:0}}
    esor.lasers = {values:{heat:0, rate:0, efficiency: 0}, settings:{energyRate:0}}
    esor.composition = {values:{fuel:0, spent:0, coolant:0, burnRate: 0}, settings:{injectionRate:0}}
    esor.saturation = {values:{energy:0}, settings:{energyRate:0}}

    CalculateDependentVariables()
    
}

function CalculateDependentVariables()
{
    totalVolume = esor.composition.values.fuel + esor.composition.values.spent + esor.composition.values.coolant

    coreHeatFromPressure = esor.core.values.pressure * 1.9
    corePressureFromGravity = totalVolume
    corePressureFromSpin = -Math.pow(abs(esor.core.values.spin), 2)

   


}

var coreHeatFromPressure
var corePressureFromGravity
var corePressureFromSpin
var totalVolume 
function UpdateSim()
{
    //helper values
    

    //Calculate rates 
    esor.lasers.values.efficiency = (2/(1+Math.exp(esor.lasers.values.heat/1000))) 
    esor.lasers.values.rate = esor.lasers.settings.energyRate * esor.lasers.values.efficiency * (Number.isFinite(1/totalVolume)?1/totalVolume: 0 )
   

    
    //Update per second values
    esor.composition.values.fuel += esor.composition.settings.injectionRate * deltaTime/1000
    
    if(esor.coolant.values.amount >= esor.coolant.settings.injectionRate * deltaTime/1000)
    {
        esor.composition.values.coolant += esor.coolant.settings.injectionRate * deltaTime/1000
        esor.coolant.values.amount -= esor.coolant.settings.injectionRate * deltaTime/1000
        esor.core.values.heat = ((totalVolume * esor.core.values.heat) / totalVolume + esor.coolant.settings.injectionRate) || 0
    }
    
    esor.core.values.heat += esor.lasers.values.rate * deltaTime/1000
    esor.core.values.spin += esor.core.settings.spin * deltaTime/1000
    
    esor.lasers.values.heat += esor.lasers.values.rate * (deltaTime/1000) * (1/100)
    esor.lasers.values.heat -= esor.lasers.values.heat * 0.1 * deltaTime/1000

    esor.saturation.values.energy += esor.saturation.values.enregyRate

    //TODO: add energy storage / management
    esor.shield.values.energy += esor.shield.settings.energyRate *deltaTime/1000

    esor.shield.values.cost = esor.shield.values.energy * 0.01 * Math.pow(esor.shield.values.stress*100+1, 2)
    esor.shield.values.energy -=  esor.shield.values.cost * deltaTime/1000
    esor.shield.values.strength = Math.log10(Math.log10(esor.shield.values.cost+1)+1)

    //reation!
    if(esor.core.values.heat > 10000)
    {
        var energyToProduceTotal = 1 * (esor.core.values.heat / 10000) * (100/(100+Math.log(esor.saturation.values.energy+1)))
        var energyProducedToHeat = energyToProduceTotal * 0.01
        energyToProduceTotal -= energyProducedToHeat
        esor.core.values.heat += energyProducedToHeat
    }



    //dependent values
   
    var coreHeatNotFromPressure = esor.core.values.heat - coreHeatFromPressure
    var corePressureNotFromGravityOrSpin = esor.core.values.pressure - corePressureFromGravity - - corePressureFromSpin

    CalculateDependentVariables()

    esor.core.values.heat = coreHeatNotFromPressure + coreHeatFromPressure
    esor.core.values.pressure = corePressureNotFromGravityOrSpin + corePressureFromGravity + corePressureFromSpin



    //errors
    if(esor.core.values.pressure<0)
    {
        InitSim()
    }
}
function UpdateDisplays()
{
    document.getElementById("Panel_Coolant").innerText = 
    "Coolant \n " +
    "Amount: " + esor.coolant.values.amount.toFixed(2) + " L \n" + 
    "Reserve: " + esor.coolant.values.reserve.toFixed(2) + " L \n" +
    "Injection Rate: " +  esor.coolant.settings.injectionRate.toFixed(2) + " L/s \n" +
    "Energy Rate: " + esor.coolant.settings.energyRate.toFixed(2) + " W \n"

    document.getElementById("Panel_Core").innerText = 
    "Core \n " +
    "Temp: " + esor.core.values.heat.toFixed(2) + " K \n" + 
    "Spin: " + esor.core.values.spin.toFixed(2) + " rpm \n" +
    "Pressure: " +  esor.core.values.pressure.toFixed(2) + " kPa \n" +
    "Stabalizers: " + esor.core.settings.spin.toFixed(2) + " rpm/s \n" +
    "Venting: : " + esor.core.settings.spin.toFixed(2) + " kPa/s \n"

    document.getElementById("Panel_Shield").innerText = 
    "Shield \n" + 
    "Strength: " + (esor.shield.values.strength * 100).toFixed(2) + "% \n" + 
    "Stress: " + (esor.shield.values.stress * 100).toFixed(2) + "% \n" + 
    "Energy Cost: " + esor.shield.values.cost.toFixed(2) + " W \n" + 
    "Energy Rate: " + esor.shield.settings.energyRate.toFixed(2) + " W \n"

    document.getElementById("Panel_Lasers").innerText = 
    "Lasers \n" + 
    "Temp: " + esor.lasers.values.heat.toFixed(2) + " K \n" + 
    "Efficiency: " + (esor.lasers.values.efficiency * 100).toFixed(2) + "% \n" + 
    "Heating Rate: " + esor.lasers.values.rate.toFixed(2) + " K/s \n" +
    "Energy Rate: " + esor.lasers.settings.energyRate.toFixed(2) + " W \n"
    
    document.getElementById("Panel_Composition").innerText = 
    "Composition \n" +
    "Fuel: " + esor.composition.values.fuel.toFixed(2) + " L \n" +
    "Spent: " + esor.composition.values.spent.toFixed(2)  + " L \n" +
    "Used Coolant: " + esor.composition.values.coolant.toFixed(2) + " L \n" +
    "Burn Rate: " + esor.composition.values.burnRate.toFixed(2) + " L/s \n" +
    "Injection Rate: " + esor.composition.settings.injectionRate.toFixed(2) + " L/s \n"

    document.getElementById("Panel_Saturation").innerText = 
    "Saturation \n" + 
    "Energy: " + esor.saturation.values.energy.toFixed(2) + " J \n" +
    "Energy Rate: " + esor.saturation.settings.energyRate.toFixed(2) + " W \n"

}
var nonNegativeSettings = {
    "coolant" : {"injectionrate": true, "energyrate": true},
    "core" : {"vent" : true},
    "shield" : {"energyrate":true},
    "lasers" : {"energyrate":true},
    "composition" : {"injectionrate" : true}
}
function runTerminalCommand(message)
{
    message = message.toLowerCase()
    console.log(message)
    var command = message.split(" ")
    if(command[0] == "help")
    {
        outputTerminalText(message, "To change a setting, type the part name, then the setting, then the value")
        return
    }
    var validCommands = Object.keys(esor)
    console.log(validCommands)
    for (let checkCommand of validCommands){
        console.log( "" + command[0] + ", " + checkCommand.toLowerCase())
        if(command[0] == checkCommand.toLowerCase())
        {
            var validTargets = Object.keys(esor[checkCommand].settings)
            for(let checkTarget of validTargets){
                if(command[1] == checkTarget.toLowerCase())
                {
                    if(!Number.isNaN(Number(command[2])))
                    {
                        if(Number(command[2])<0 && command[0] in nonNegativeSettings && command[1] in nonNegativeSettings[command[0]])
                        {
                            outputTerminalText(message, "That setting does not accept negative values")
                            return
                        }
                        esor[checkCommand].settings[checkTarget] = Number(command[2])
                        outputTerminalText(message, "Setting " + command[1] + " of " + command[0] + " changed to " + Number(command[2]))
                        return
                    }
                }
            }
            outputTerminalText(message, "Setting " + command[1] + " does not exist in " + command[0] + "\n" + "valid settings are " + validTargets)
            return
        }
    }
    outputTerminalText(message, "" + command[0] + " does not match any command ")
}

function outputTerminalText(message, text)
{
    document.getElementById("Console").innerText = ">>> " + message + "\n" + text

}