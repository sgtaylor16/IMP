var schedStart = new Date(2020,12,25), schedEnd = new Date(2024,6,1)
var margin = 100;
var axisheight = 50;
var schedScale


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

function putAccounts(svgid,dataarray){
    let svg = d3.select("svg" + svgid) //Select the svg element that all plotting will happen on.

    //Find the tasks with zero duration, they will be marked as diamond milestones
    let zerodur = dataarray.filter(checkforZeroDuration);
    //Find the tasks with > 0 duration, they will be marked as bars.
    let tasks = dataarray.filter(checkforTasks);
    //find the unique control accounts
    uniqueCAs = findAccounts(tasks);
        
    let barheight = 40;
    
    //Get the height of the svg element
    let height = document.getElementById(svgid.slice(1)).getAttribute("height");
    let width = document.getElementById(svgid.slice(1)).getAttribute("width");
    let margin = 20;

    let schedScale = d3.scaleTime()
                    .domain([schedStart,schedEnd])
                    .range([margin,width - margin]);

    let timeAxis = d3.axisBottom()
                    .scale(schedScale)
                    .tickFormat(d3.timeFormat("%b %Y"))
                    .ticks(d3.timeMonth.every(1));

    let rectHeight = d3.scaleBand()
                    .domain(uniqueCAs)
                    .range([0, height]);



    //Put in the Milestone Circles
    svg.selectAll("circle")
        .data(zerodur)
        .join("circle")
        .attr("cx",function(d,i){
            return schedScale(d.Start);
        })
        .attr("cy",height/2)
        .attr("r",5)

    //#region Put in Rectangles


    svg.selectAll("rect")
        .data(tasks)
        .join("rect")
        .attr("x",function(d,i){
            return schedScale(d.Start);
        })
        .attr("y",rectHeight)
        .attr("rx",barheight/4)
        .attr("width",function(d,i){
            return schedScale(d.Finish) - schedScale(d.Start);
        })
        .attr("height",barheight)


    //#endregion


    //#region Put in date Axis
    let temp1 = height - axisheight;
    dateax = svg.append("g").call(timeAxis).attr("class","axis")
                    .attr("transform","translate(0," + temp1 + ")" )
                    .selectAll("text")
                    .attr("transform", "translate(-10,10)rotate(-45)")
                    .style("text-anchor", "end");
    //#endregion

}
    
var alldata, mymilestones, mytasks

function makeIMP(filepath,svgid,CAfilter){
    //d3 read in file
    d3.csv(filepath,sched_access)
    .then(function(data){
        alldata = data; //puts the data in global scope
        
        //filter only on the accounts that are in CAfilter
        mymilestones = accountsFilter(alldata,['Milestones'])
        mytasks = accountsFilter(alldata,['DTF'])

        putAccounts("#Milestones",mymilestones)

        putAccounts("#Programs",mytasks)
    })
}