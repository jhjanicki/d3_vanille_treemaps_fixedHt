// all variables related to dimensions
const height = 650;
const marginTop = 50;

//scale to map original width to pixel width
const widthScale = d3.scaleLinear().domain([0,d3.max(summary,d=>d.total)/height]).range([0,710]);

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

// all related to scales and styles
const orders = [...new Set(summary.map(d=>d.order))];
const strokeColorScale = d3.scaleOrdinal()
    .domain(orders)
    .range(["#9f80d1","#f7a663","#7fc97f","#80b1d3","#f4a6d1","#72baac","#fc9272"])
const fillColorScale = d3.scaleOrdinal()
    .domain(orders)
    .range(["#e4d4fc","#f9dec7","#cbf4cb","#a9d3ea","#fce3f1","#aae5d9","#f7b1a1"])

const textureArray = orders.map(d => {
    return textures
        .lines()
        .size(6)
        .strokeWidth(2)
        .stroke(fillColorScale(d));
})
    
const textureScale = d3.scaleOrdinal().domain(orders).range(textureArray);

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
        .paddingInner(3.5)
        .paddingOuter(2)
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
    g.selectAll("rect")
        .data(leaves)
        .join("rect")
        .attr("transform", d => "translate(" + d.x0 + "," + d.y0 + ")")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("rx",2)
        .attr("ry",2)
        .attr("stroke-width", 2)
        .attr("stroke", strokeColorScale(shape.order))
        .attr("fill",  d=> d.data[0]==="EX" || d.data[0]==="EW" || d.data[0]==="CR" || d.data[0]==="EN" || d.data[0]==="VU"?textureScale(shape.order).url():fillColorScale(shape.order))

    g.selectAll("text")
        .data(root.leaves())
        .join("text")
        .attr("x", d => d.x0 + 2)
        .attr("y", d => d.y0 + 10)
        .attr("font-size", 12)
        .attr("fill", "black")
        .attr("font-weight", 700)
        .text(d => d.value>50?`${d.data[0]}: ${d.value}`:`${d.data[0]}`);
    
        svg.append("text").attr("x",0).attr("y",marginTop-5).attr("font-weight",700).attr("font-size", 15).text(`${shape.order}`);
    }
//loop over each summary object, each will either become a treemap or a rect
summary.forEach(shape=>{

    const svg = d3.select("#chart").append("svg")
        .attr("width", shape.width)
        .attr("height", height+marginTop);

    // call texture on svg
    for (let t of textureArray) {
        svg.call(t);
    }
 
    drawTree(shape,svg,"#a8ddb5")
    
})