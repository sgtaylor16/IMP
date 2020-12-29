var schedStart = new Date(2020,10,25), schedEnd = new Date(2024,6,1)
var margin = 100;
var rectHeight;

var schedScale
var svg


function sched_access({Index,Name,Start,Finish,Account}){
    return ({Index:Index, Name:Name , Start: new Date(Start) , Finish:new Date(Finish) , Account: Account});
}

function checkforMilestones(object){
    if(object.Account == 'Milestones'){
        return true;
    }else{
        return false;
    }
}

function checkforZeroDuration(object){
    if(object.Start.toDateString() == object.Finish.toDateString()){
        return true;
    }else{
        return false;
    }
}

function checkforTasks(object){
    if(object.Start.toDateString() != object.Finish.toDateString()){
        return true;
    }else{
        return false;
    }
}

function findAccounts(object){
    let flags = [], l = object.length, i,uniqueAccounts = [];
    for(i=0; i<l; i++){
        if( flags[object[i].Account]){
            continue;
        }else{
        flags[object[i].Account] = true;
        uniqueAccounts.push(object[i].Account);
        }
    }
    return uniqueAccounts
}

function filterOnOneAccount(Account,task){
    if(Account == task.Account){
        return true
    }else{
        return false
    }
}

function accountsFilter(data,AccountFilter){
    let outputarray = [];
    AccountFilter.forEach((Account) => {
        let temp = data.filter((task) => {
            return filterOnOneAccount(Account,task);
        })
        outputarray = outputarray.concat(temp);
    })
    return outputarray;
}

function putAccounts(svgid,dataarray,yaxis){
    svg = d3.select("svg" + svgid) //Select the svg element that all plotting will happen on.

    //Find the tasks with zero duration, they will be marked as diamond milestones
    let zerodur = dataarray.filter(checkforZeroDuration);
    //Find the tasks with > 0 duration, they will be marked as bars.
    let tasks = dataarray.filter(checkforTasks);
    //find the unique control accounts
    uniqueCAs = findAccounts(dataarray);
        

    
    //Get the height of the svg element
    let height = document.getElementById(svgid.slice(1)).getAttribute("height");
    let width = document.getElementById(svgid.slice(1)).getAttribute("width");
    let margin = 100;
    let topProtection = 80;
    let axisheight = 70;
    let barheight = 30;
    let fontsize = 14;

    newheight = uniqueCAs.length * (barheight + 10) + axisheight + topProtection;

    document.getElementById(svgid.slice(1)).setAttribute("height",newheight);

//#region Scales

    let schedScale = d3.scaleTime()
                    .domain([schedStart,schedEnd])
                    .range([margin,width - margin]);

    let timeAxis = d3.axisBottom()
                    .scale(schedScale)
                    .tickFormat(d3.timeFormat("%b %Y"))
                    .ticks(d3.timeMonth.every(1));

    let rectHeight = d3.scaleBand()
                    .domain(uniqueCAs)
                    .range([topProtection, newheight - axisheight]);

    let colorScale = d3.scaleOrdinal()
                        .domain(uniqueCAs)
                        .range(d3.schemePastel1);

    var accountAxis = d3.axisLeft()
                    .scale(rectHeight)
                    .ticks(uniqueCAs)

//#endregion Scales

//#region Milestone Circles
    //Put in the Milestone Circles
    svg.selectAll("circle")
        .data(zerodur)
        .join("circle")
        .attr("cx",function(d,i){
            return schedScale(d.Start);
        })
        .attr("cy",function(d,i){
        return (rectHeight(d.Account) + barheight * 0.5)
        })
        .attr("r",5)

    svg.selectAll("text")
    .data(zerodur)
    .join("text")
    .text(function(d,i){
        return d.Name
    })
    .attr("x",function(d,i){
        return schedScale(d.Start) + 10;
    })
    .attr("y",function(d,i){
        return (rectHeight(d.Account) + barheight * 0.5);
    })
    .attr("transform",function(d,i){
        let cx = schedScale(d.Start);
        let cy = rectHeight(d.Account) + barheight * 0.5;
        return ('rotate(-25,'+ cx + ',' + cy + ')')
    })
    .style("text-anchor", "start")
    .attr("font-size",fontsize);

//#endregion

//#region Put in Rectangles

    svg.selectAll("rect")
        .data(tasks)
        .join("rect")
        .attr("x",function(d,i){
            return schedScale(d.Start);
        })
        .attr("y",function(d,i){
            return rectHeight(d.Account)
        })
        .attr("rx",barheight/4)
        .attr("width",function(d,i){
            return schedScale(d.Finish) - schedScale(d.Start);
        })
        .attr("height",barheight)
        .attr("fill",function(d,i){
            return colorScale(d.Account);
        })
        .attr("fill-opacity",0.7)

     svg.selectAll("text.tasks")
        .data(tasks)
        .join("text")
        .attr("class","tasks")
        .text(function(d,i){
            return d.Name
        })
        .attr("x",function(d,i){
            return (schedScale(d.Start)+5)
        })
        .attr("y",function(d,i){
            return (rectHeight(d.Account) + 0.5 * barheight + 0.4 * fontsize)
        })
        .attr("font-size",fontsize);
 

//#endregion


//#region Put in date Axis
    let temp1 = newheight - axisheight;
    svg.append("g").call(timeAxis).attr("class","axis")
                    .attr("transform","translate(0," + temp1 + ")" )
                    .selectAll("text")
                    .attr("transform", "translate(-10,10)rotate(-45)")
                    .style("text-anchor", "end");
//#endregion

//#region labels on y axis
console.log(yaxis)
    if(yaxis){
    svg.append("g").call(accountAxis)
                    .attr("transform","translate(" + margin + ",0)")
    }
//#endregion
}

var alldata, mymilestones, mytasks

function makeIMP(filepath,svgid,CAfilter,yaxis = false){
    //d3 read in file
    d3.csv(filepath,sched_access)
    .then(function(data){
        alldata = data; //puts the data in global scope
        
        //filter only on the accounts that are in CAfilter

        mytasks = accountsFilter(alldata,CAfilter);

        putAccounts(svgid,mytasks,yaxis)

    })
}