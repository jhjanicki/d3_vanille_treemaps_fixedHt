// all variables related to dimensions
const height = 650;
const paddingOuter = 3;
const marginTop = 50;

//scale to map original width to pixel width
const widthScale = d3.scaleLinear().domain([0,d3.max(summary,d=>d.total)/height]).range([0,700]);

//add extra width variable to summary stats
summary  = summary.map(d=>{
    return {
        ...d,
        width: widthScale(d.total/height)
    }
})

// sort data
summary = summary.sort((a,b)=>b.total-a.total)
data = data.sort((a,b) => b.total-a.total);

const orders = [...new Set(summary.map(d=>d.order))];
const colorScale = d3.scaleOrdinal()
    .domain(orders)
    .range(["#7fc97f", "#beaed4","#fdc086","#ffff99","#80b1d3","#fccde5","#8dd3c7","#fc9272"])

//convert data to hierarchical format
const convertDataHierarchy = (data)=>{
    const groupingFn = [d => d.category]; 
    const rollupData = d3.rollup(data, v => d3.sum(v, d => d.total), ...groupingFn);
    const childrenAccessorFn = ([key, value]) => value.size && Array.from(value);
    return d3.hierarchy(rollupData, childrenAccessorFn)
        .sum(([key, value]) => value);
}

// Layout + data prep
const setupTreemap = (w,h) =>{
    return d3.treemap()
        .paddingInner(2)
        .paddingOuter(paddingOuter)
        .paddingTop(1)
        .round(true)
        .size([w, h])
        .tile(d3.treemapSquarify.ratio(1));
}

const drawTree = (shape,svg,fill) =>{
    const dataFiltered = data.filter(d=>d.order ===shape.order);
    const hierarchyData = convertDataHierarchy(dataFiltered);
    const treemap = setupTreemap(shape.width, height);
    const root = treemap(hierarchyData);
    const leaves = root.leaves();
    const g = svg.append("g").attr("transform",`translate(0,${marginTop})`);
    g.selectAll(`rect.${shape.order}`)
        .data(leaves)
        .join("rect")
        .attr("class", shape.order)
        .attr("transform", d => "translate(" + d.x0 + "," + d.y0 + ")")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("rx",2)
        .attr("ry",2)
        .attr("stroke-width", 0.5)
        .attr("stroke", "white")
        .attr("fill", colorScale(shape.order))
        .attr("opacity", 1);

    g.selectAll(`text.text${shape.order}`)
        .data(root.leaves())
        .join("text")
        .attr("class", `text${shape.order}`)
        .attr("x", d => d.x0 + 3)
        .attr("y", d => d.y0 + 15)
        .attr("font-size", 12.5)
        .attr("fill", "black")
        .attr("font-weight", 700)
        .text(d => d.value>1?`${d.data[0]}: ${d.value}`:"");
    
    svg.append("text").attr("x",0).attr("y",marginTop-10).attr("fill","black").text(`${shape.order}: ${shape.total}`);
}
//loop over each summary object, each will either become a treemap or a rect
summary.forEach(shape=>{

    const svg = d3.select("#chart").append("svg")
        .attr("width", shape.width)
        .attr("height", height+marginTop);
        
    drawTree(shape,svg,"#a8ddb5")
    
})