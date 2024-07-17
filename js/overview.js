const window_margin = { LEFT: 100, RIGHT: 50, TOP: 50, BOTTOM: 100 };
const window_width = 800 - window_margin.LEFT - window_margin.RIGHT;
const window_height = 400 - window_margin.TOP - window_margin.BOTTOM;

const svg = d3.select("#overview-chart-area").append("svg")
  .attr("width", window_width + window_margin.LEFT + window_margin.RIGHT)
  .attr("height", window_height + window_margin.TOP + window_margin.BOTTOM);

const g1 = svg.append("g")
  .attr("transform", `translate(${window_margin.LEFT}, ${window_margin.TOP})`);

let time = 0;
let interval;
let dataset;
let dateList = [];

let population = {
	"california": "38,965,193",
	"texas": "30,503,301",
	"florida": "22,610,726",
	"new_york": "19,571,216",
	"pennsylvania": "12,961,683"
}

// Tooltip
const tip = d3.tip()
  .attr('class', 'd3-tip')
  .html(d => {
    let text = `<strong>State:</strong> <span style='color:red;text-transform:capitalize'>${d.state}</span><br>`;
    text += `<strong>Accumulated Cases:</strong> <span style='color:red'>${d3.format(".0f")(d.accumulated_cases)}</span><br>`;
    text += `<strong>Accumulated Deaths:</strong> <span style='color:red'>${d3.format(".0f")(d.accumulated_deaths)}</span><br>`;
    text += `<strong>Cases:</strong> <span style='color:red'>${d3.format(",.0f")(d.cases)}</span><br>`;
	text += `<strong>Population:</strong> <span style='color:red'>${population[d.state]}</span><br>`;
    return text;
  });
g1.call(tip);

// Scales
const x1 = d3.scaleLinear()
  .range([0, window_width])
  .domain([1, 150000]);
const y1 = d3.scaleLinear()
  .range([window_height, 0])
  .domain([0, 13000000]);
const area = d3.scaleLinear()
  .range([25 * Math.PI, 1500 * Math.PI])
  .domain([1, 10000]);
const stateColor = d3.scaleOrdinal(d3.schemePastel1);

// Labels
g1.append("text")
  .attr("y", window_height + 50)
  .attr("x", window_width / 2)
  .attr("font-size", "20px")
  .attr("text-anchor", "middle")
  .text("Accumulated Deaths");

g1.append("text")
  .attr("transform", "rotate(-90)")
  .attr("y", -40)
  .attr("x", -170)
  .attr("font-size", "20px")
  .attr("text-anchor", "middle")
  .text("Accumulated Cases");

const timeLabel = g1.append("text")
  .attr("y", window_height - 10)
  .attr("x", window_width - 40)
  .attr("font-size", "15px")
  .attr("opacity", "0.4")
  .attr("text-anchor", "middle")
  .text("2020-01-01");

// X Axis
const xAxisCall1 = d3.axisBottom(x1)
  .tickValues([1000, 50000, 150000])
  .tickFormat(d3.format(""));
g1.append("g")
  .attr("class", "x axis")
  .attr("transform", `translate(0, ${window_height})`)
  .call(xAxisCall1);

// Y Axis
const yAxisCall1 = d3.axisLeft(y1)
  .tickValues([10000, 2000000, 4000000, 7500000,10000000, 13000000])
  .tickFormat(d3.format(""));
g1.append("g")
  .attr("class", "y axis")
  .call(yAxisCall1);

const states = ["california", "florida", "new_york", "pennsylvania", "texas"];

const legend = g1.append("g")
  .attr("transform", `translate(${window_width - 10}, ${window_height - 125})`);

states.forEach((state, i) => {
  const legendRow = legend.append("g")
    .attr("transform", `translate(0, ${i * 20})`);

  legendRow.append("rect")
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", stateColor(state));

  legendRow.append("text")
    .attr("x", -10)
    .attr("y", 10)
    .attr("text-anchor", "end")
    .style("text-transform", "capitalize")
    .text(state);
});

d3.json("data_processing/processed_data_overview.json").then(function (data) {
  dataset = data.map(day => {
    dateList.push(day.date);
    return day["states"].map(state => {
      state.accumulated_cases = Number(state.accumulated_cases);
      state.accumulated_deaths = Number(state.accumulated_deaths);
      state.cases = Number(state.cases);
      return state;
    });
  });

  updateGraph(dataset[0]);

  $("#date-slider").slider("option", "max", dateList.length - 1);
});

applyAnnotationOverview();

function applyAnnotationOverview() {
	var annotationOverview = svg.append('g');
	annotationOverview.append('text')
	  .attr('x', 150)
	  .attr('y', 100)
	  .classed('annotation', true)
	  .text('States with more population have more deaths and cases.');
  }

function moveStep() {
  time = (time < dataset.length - 1) ? time + 1 : 0;
  updateGraph(dataset[time]);
}

$("#play-button")
  .on("click", function () {
    const button = $(this);
    if (button.text() === "Play") {
      button.text("Pause");
      interval = setInterval(moveStep, 100);
    } else {
      button.text("Play");
      clearInterval(interval);
    }
  });

$("#reset-button")
  .on("click", () => {
    time = 0;
    updateGraph(dataset[0]);
  });

$("#state-select")
  .on("change", () => {
    updateGraph(dataset[time]);
  });

$("#date-slider").slider({
  min: 0,
  max: dateList.length - 1,
  step: 1,
  slide: (event, ui) => {
    time = ui.value;
    updateGraph(dataset[time]);
  }
});

function updateGraph(data) {
  // standard transition time for the visualization
  const t = d3.transition()
    .duration(100);

  const state = $("#state-select").val();

  const filteredData = data.filter(d => {
    if (state === "all") return true;
    else {
      return d.state === state;
    }
  });

  // JOIN new data with old elements.
  const circles = g1.selectAll("circle")
    .data(filteredData, d => d.state);

  // EXIT old elements not present in new data.
  circles.exit().remove();

  // ENTER new elements present in new data.
  circles.enter().append("circle")
    .attr("fill", d => stateColor(d.state))
    .on("mouseover", tip.show)
    .on("mouseout", tip.hide)
    .merge(circles)
    .transition(t)
    .attr("cx", d => x1(d.accumulated_deaths + 1))
    .attr("cy", d => y1(d.accumulated_cases))
    .attr("r", d => Math.sqrt(area(Math.max(d.deaths, 0) * 10 + 1) / Math.PI));

  // update the time label
  timeLabel.text(dateList[time]);

  $("#overview-date")[0].innerHTML = dateList[time];
  $("#date-slider").slider("value", time);
}
