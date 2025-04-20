import React, { Component } from "react";
import * as d3 from "d3";
import FileUpload from "./FileUpload";

class StackComp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data:[],
    };
  }

  componentDidMount() {
    this.renderChart()
  }

  componentDidUpdate(){
    this.renderChart()
  }

  renderChart=()=>{
    const data = this.state.data;    
    const margin = { top: 20, right: 20, bottom: 50, left: 50 },
      width = 570 - margin.left - margin.right,
      height = 470 - margin.top - margin.bottom;

    const maxSum = d3.sum([
      d3.max(data, d => d["GPT-4"]),
      d3.max(data, d => d["Gemini"]),
      d3.max(data, d => d["PaLM-2"]),
      d3.max(data, d => d["Claude"]),
      d3.max(data, d => d["LLaMA-3.1"])
    ]);

    const tooltip = d3.select("body").selectAll(".tooltip").data([0]).join("div").attr("class", "tooltip")
      .style("opacity", 0).style("background-color", "white").style("position", "absolute")
      .style("border", "1px solid gray").style("border-radius", "5px").style("padding", "5px")
    
    var xScale = d3.scaleTime().domain(d3.extent(data, d => d.Date)).range([0, 300]);
    var yScale = d3.scaleLinear().domain([0, maxSum]).range([height, 0]);
    var colors = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', "#ff7f00"];
    var keys=['GPT-4', 'Gemini', 'PaLM-2', 'Claude', 'LLaMA-3.1'];
    var stack = d3.stack().keys(keys).offset(d3.stackOffsetWiggle);
    var stackedSeries = stack(data);
    var areaGenerator = d3.area()
      .x(d => xScale(d.data.Date))
      .y0(d => yScale(d[0]))
      .y1(d => yScale(d[1]))
      .curve(d3.curveCardinal);

    const svg = d3.select(".container")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);
      
    const chartGroup = svg.selectAll("g")
      .attr("transform", `translate(${margin.left}, 0)`)
    
    chartGroup.selectAll(".areas")
      .data(stackedSeries)
      .join("path")
      .attr("transform", `translate(0, -70)`)
      .attr("class", "areas")
      .attr("d", d => areaGenerator(d))
      .style('fill', (d, i) => colors[i])
      .on("mouseover", () => tooltip.style("opacity", 1))
      .on("mousemove", (event, d) => {

        tooltip
          .style("left", `${event.pageX}px`)
          .style("top", `${event.pageY - 35}px`)
          .style("pointer-events", "none");

        // Clear previous tooltip-- causes errors with animation
        //tooltip.html(""); 

        // smallBar svg creation for dynamic bar chart

        const dates = []; 
        for (var i = 0; i < d.length; i++) {
           dates.push(d[i].data.Date); 
        }

        const values = []; 
        for (i = 0; i < d.length; i++) {
          values.push(d[i][1]-d[i][0]); 
        }

        //console.log(`Dates: ${dates}, Values: ${values}`)
        const barData = dates.map((date, i) => ({date, value: values[i]}));
        const barMargin = { top: 20, right: 20, bottom: 20, left: 30 }
        const tooltipWidth = 370 - barMargin.left - barMargin.right;
        const tooltipHeight = 190 - barMargin.top - barMargin.bottom;

        const xScale = d3.scaleBand()
          .domain(barData.map(d => d.date)) 
          .range([0, tooltipWidth])
          .padding(0.1);

        const yScale = d3.scaleLinear()
          .domain([0, d3.max(barData, d => d.value)]) 
          .range([tooltipHeight, 0]);
        
        const smallBar = tooltip.selectAll("svg")
          .data([0])
          .join("svg")
          .attr("width", tooltipWidth + barMargin.left + barMargin.right)
          .attr("height", tooltipHeight + barMargin.top + barMargin.bottom);
        
        smallBar.selectAll("rect")
          .data(barData)
          .join("rect")
          .attr("x", d => xScale(d.date)) 
          .attr("y", d => yScale(d.value)) 
          .attr("width", xScale.bandwidth())
          .attr("height", d => tooltipHeight - yScale(d.value)) 
          .attr("transform", `translate(${barMargin.left}, ${barMargin.top})`)
          
        smallBar.selectAll("rect")
          .data(barData)
          .join("rect")
          .transition()
          .duration(1000)
          .ease(d3.easeLinear)
          .style('fill', () =>colors[d.index]);
        //console.log(barData)

        // X-axis
        smallBar.selectAll(".x-axis").data([null]).join("g")
          .attr("class", "x-axis")
          .attr("transform", `translate(${barMargin.left}, ${tooltipHeight+barMargin.top})`)
          .call(d3.axisBottom(xScale).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b")));
        // Y-axis
        smallBar.selectAll(".y-axis").data([null]).join("g")
          .attr("class", "y-axis").call(d3.axisLeft(yScale).ticks(5))
          .attr("transform", `translate(${barMargin.left}, ${barMargin.top})`);
        
      })      
      .on("mouseleave", () => tooltip.style("opacity", 0));
    

    if (data.length !== 0){
      // Main chart X-axis
      chartGroup.selectAll(".x-axis").data([null]).join("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale)
        .ticks(d3.timeMonth.every(1))
        .tickFormat(d3.timeFormat("%b")));

      // Main chart Legend
      const legend = d3.select(".container").append("g")
        .attr("transform", `translate(${width-margin.left-margin.right + margin.left - 100}, ${margin.top+150})`);
    
      const legendData = keys.map((key,i)=>[key, colors[i]]).reverse();
    
      legend.selectAll("rect")
        .data(legendData)
        .join("rect")
        .attr("width", 25)
        .attr("height", 25)
        .attr("x", 0)
        .attr("y", (d, i) => i * 30)
        .attr("fill", d => d[1])
        
      legend.selectAll("text")
        .data(legendData)
        .enter()
        .append("text")
        .attr("x", 30)
        .attr("y", (d, i) => i * 30 + 17.5)
        .text(d => d[0])
    }
  }
  
  set_data = (csv_data) => {
    this.setState({ data: csv_data });
  }

  render() {
    return (
      <div>
        <FileUpload set_data={this.set_data}></FileUpload>
        <svg className="container">
            <g></g>
        </svg>
      </div>
    );
  }
}
export default StackComp;