var nheight = 10; //number of rows
var nwidth = 10; //number of columns
var ndots = 30; //number of pre-colored dots
var sats = 1
var vals = 1
const BASE_COLOR = "rgb(220, 220, 220)"
window.addEventListener("load", (event) => {
    var table = document.createElement("table")
//    table.style.display = "flex"
    for (var i = 0; i < nheight; i++) {
        
        var table_row = document.createElement("table")
        for (var j = 0; j < nwidth; j++) {
            
            var table_data =document.createElement("td")
            table_data.id = "TD" + i + ":" + j
            table_row.appendChild(table_data)
        }
        table.appendChild(table_row)
    }

    document.body.appendChild(table)
    var dots_so_far = 0
    
    for (var i = 0; i < nheight; i++) {
        
        for (var j = 0; j < nwidth; j++) {
            var table_data = document.getElementById("TD" + i + ":" + j)
            var dot = document.createElement("div")
            dot.style.width = "20px"
            dot.style.height = "20px"
            dot.style.borderRadius = "100%"
            dot.style.border = "2px solid black"
            dot.style.backgroundColor = getColorCodeFromIndex(dots_so_far)
            table_data.appendChild(dot)

            dots_so_far++
        }
    }
            


});

function getColorCodeFromIndex(i) {
    if(i >= ndots) {
        return BASE_COLOR
    }
    
    var colorRows = 1 + vals + sats
    var ndots_per_alt = Math.floor(ndots/colorRows)
    var ndots_of_main = (ndots - ndots_per_alt * (colorRows-1))

    var hue = 0
    var sat = 100
    var val = 50
    var j = 0
    if (i<ndots_of_main) {
        j = i
    }
    else
    {
        j = (i-ndots_of_main)%ndots_per_alt
        var k = Math.floor((i-ndots_of_main)/ndots_per_alt)
        if(k<sats) {
            sat = 100 * ((1+k)/(sats+2))
        }
        else
        {
            val = 50 * ((1+k-sats)/(vals+1)) + 50
        }
    }
    hue = Math.round(j/ndots_of_main*360)
    return "hsl(" + Math.floor(hue) + ", " +Math.floor(sat)+"%, "+Math.floor(val)+"%)" 
}