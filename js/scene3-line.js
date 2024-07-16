const window3_margin = { LEFT: 50, RIGHT: 50, TOP: 50, BOTTOM: 100 };
const window3_width = 800 - window3_margin.LEFT - window3_margin.RIGHT;
const window3_height = 400 - window3_margin.TOP - window3_margin.BOTTOM;

const svg3 = d3.select("#line-chart-area").append("svg")
  .attr("width", window3_width + window3_margin.LEFT + window3_margin.RIGHT)
  .attr("height", window3_height + window3_margin.TOP + window3_margin.BOTTOM);

const g = svg3.append("g")
  .attr("transform", `translate(${window3_margin.LEFT}, ${window3_margin.TOP})`);

// time parsers/formatters
const parseTime = d3.timeParse("%Y-%m-%d");
const formatTime = d3.timeFormat("%Y-%m-%d");
// for tooltip
const bisectDate = d3.bisector(d => d.date).left;
filteredData = {};

// add the line for the first time
g.append("path")
  .attr("class", "line")
  .attr("fill", "none")
  .attr("stroke", "grey")
  .attr("stroke-width", "3px");

// axis labels
const xLabel = g.append("text")
  .attr("class", "x axisLabel")
  .attr("y", window3_height + 50)
  .attr("x", window3_width / 2)
  .attr("font-size", "20px")
  .attr("text-anchor", "middle")
  .text("Time");
const yLabel = g.append("text")
  .attr("class", "y axisLabel")
  .attr("transform", "rotate(-90)")
  .attr("y", -75)
  .attr("x", -150)
  .attr("font-size", "20px")
  .attr("text-anchor", "middle")
  .text("Cases");

// scales
const x = d3.scaleTime().range([0, window3_width]);
const y = d3.scaleLinear().range([window3_height, 0]);

// axis generators
const xAxisCall = d3.axisBottom();
const yAxisCall = d3.axisLeft()
  .ticks(6);

// axis groups
const xAxis = g.append("g")
  .attr("class", "x axis")
  .attr("transform", `translate(0, ${window3_height})`);
const yAxis = g.append("g")
  .attr("class", "y axis");

// event listeners
$("#data-option-select").on("change", updateLineGraph);
$("#submit-button").on("click", () => updateLineGraph());

$("#date-line").slider({
  range: true,
  max: parseTime("2023-12-31").getTime(),
  min: parseTime("2020-01-01").getTime(),
  step: 86400000, // one day
  values: [
    parseTime("2020-01-01").getTime(),
    parseTime("2023-12-31").getTime()
  ],
  slide: (event, ui) => {
    $("#date-range-0").text(formatTime(new Date(ui.values[0])));
    $("#date-range-1").text(formatTime(new Date(ui.values[1])));
    updateLineGraph();
  }
});

d3.json("data_processing/processed_data_states_cases.json").then(data => {
  filteredData = {};
  Object.keys(data).forEach(state => {
    filteredData[state] = data[state]
      .map(d => {
        d["cases"] = Number(d["cases"]);
        d["deaths"] = Number(d["deaths"]);
        d["accumulated_cases"] = Number(d["accumulated_cases"]);
        d["accumulated_deaths"] = Number(d["accumulated_deaths"]);
        d["date"] = parseTime(d["date"]);
        return d;
      });
  });
  updateLineGraph();
});

function updateLineGraph() {
  const t = d3.transition().duration(900);

  // filter data based on selections
  const state = $("#state-input").val();
  if (filteredData[state] === undefined) {
    alert("Please Enter a Valid State Name");
    return;
  }
  const yValue = $("#data-option-select").val();
  const sliderValues = $("#date-line").slider("values");
  const dataTimeFiltered = filteredData[state].filter(d => {
    return ((d.date >= sliderValues[0]) && (d.date <= sliderValues[1]));
  });

  // update scales
  x.domain(d3.extent(dataTimeFiltered, d => d.date));
  y.domain([
    d3.min(dataTimeFiltered, d => d[yValue]), 
    d3.max(dataTimeFiltered, d => d[yValue])
  ]);

  // update axes
  xAxisCall.scale(x);
  xAxis.transition(t).call(xAxisCall);
  yAxisCall.scale(y);
  yAxis.transition(t).call(yAxisCall);

  // clear old tooltips
  d3.select(".focus").remove();
  d3.select(".overlay").remove();

  const focus = g.append("g")
    .attr("class", "focus")
    .style("display", "none");

  focus.append("line")
    .attr("class", "x-hover-line hover-line")
    .attr("y1", 0)
    .attr("y2", window3_height);

  focus.append("line")
    .attr("class", "y-hover-line hover-line")
    .attr("x1", 0)
    .attr("x2", window3_width);

  focus.append("circle")
    .attr("r", 7.5);

  focus.append("text")
    .attr("x", 15)
    .attr("dy", ".31em");

  g.append("rect")
    .attr("class", "overlay")
    .attr("width", window3_width)
    .attr("height", window3_height)
    .on("mouseover", () => focus.style("display", null))
    .on("mouseout", () => focus.style("display", "none"))
    .on("mousemove", mousemove);

  function mousemove() {
    const x0 = x.invert(d3.mouse(this)[0]);
    const i = bisectDate(dataTimeFiltered, x0, 1);
    const d0 = dataTimeFiltered[i - 1];
    const d1 = dataTimeFiltered[i];
    const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
    focus.attr("transform", `translate(${x(d.date)}, ${y(d[yValue])})`);
    focus.select("text").text(d[yValue]);
    focus.select(".x-hover-line").attr("y2", window3_height - y(d[yValue]));
    focus.select(".y-hover-line").attr("x2", -x(d.date));
  }

  // Path generator
  const line = d3.line()
    .x(d => x(d.date))
    .y(d => y(d[yValue]));

  // Update our line path
  g.select(".line")
    .transition(t)
    .attr("d", line(dataTimeFiltered));

  // Update y-axis label
  const newText = (yValue === "cases") ? "Cases(" + state + ")"
    : (yValue === "deaths") ? "Deaths(" + state + ")"
    : (yValue === "accumulated_cases") ? "Accumulated Cases(" + state + ")"
    : "Accumulated Deaths(" + state + ")";
  yLabel.text(newText);
}
