class BarChart {
    constructor(_parentElement, _data, _dataType) {
        this.parentElement = _parentElement;
        this.data = _data;
		this.dataType = _dataType;
        this.initVis();
    }

    initVis() {
        const vis = this;
        vis.window2_margin = { LEFT: 100, RIGHT: 10, TOP: 10, BOTTOM: 100 };
        vis.window2_width = 700 - vis.window2_margin.LEFT - vis.window2_margin.RIGHT;
        vis.window2_height = 250 - vis.window2_margin.TOP - vis.window2_margin.BOTTOM;

        vis.svg = d3.select(vis.parentElement).append("svg")
            .attr("width", vis.window2_width + vis.window2_margin.LEFT + vis.window2_margin.RIGHT)
            .attr("height", vis.window2_height + vis.window2_margin.TOP + vis.window2_margin.BOTTOM);

        vis.g = vis.svg.append("g")
            .attr("transform", `translate(${vis.window2_margin.LEFT}, ${vis.window2_margin.TOP})`);


        vis.g.append("text")
            .attr("class", "x axis-label")
            .attr("x", vis.window2_width / 2)
            .attr("y", vis.window2_height + 60)
            .attr("font-size", "20px")
            .attr("text-anchor", "middle")
            .text("Country");

        // Y label
        vis.yLabel = vis.g.append("text")
            .attr("class", "y axis-label")
            .attr("x", - (vis.window2_height / 2))
            .attr("y", -60)
            .attr("font-size", "20px")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .text(this.dataType ? "Excess Deaths (%)" : "Excess Deaths");

        vis.x = d3.scaleBand()
            .range([0, vis.window2_width])
            .paddingInner(0.3)
            .paddingOuter(0.2);

        vis.y = d3.scaleLinear()
            .range([vis.window2_height, 0]);

        vis.xAxisGroup = vis.g.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0, ${vis.window2_height})`);

        vis.yAxisGroup = vis.g.append("g")
            .attr("class", "y axis");

		if(this.dataType === 0){
			vis.updateExcessDeaths(vis.data);
		} else {
			vis.updateExcessDeathPercentage(vis.data);
		}
		applyAnnotationBarChart();
		function applyAnnotationBarChart() {
			let annotationText = (vis.parentElement === "#bar-chart-1") ? "The U.S. has the most excess deaths as it has a larger population than the others."
			: "However, surprisingly Turkey has the highest percentage of excess deaths in total deaths.";
			var annotation = vis.svg.append('g');
			annotation.append('text')
				.attr('x', 20)
				.attr('y', 230)
				.classed('annotation', true)
				.text(annotationText);
			}
    }

    updateExcessDeaths(data) {
        const vis = this;

        vis.x.domain(data.map(d => d.country));
        vis.y.domain([0, d3.max(data, d => d.excess_deaths)]);

        // X Axis
        const xAxisCall = d3.axisBottom(vis.x);
        vis.xAxisGroup.call(xAxisCall)
            .selectAll("text")
            .attr("y", "10")
            .attr("x", "-5")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-40)");

        // Y Axis
        const yAxisCall = d3.axisLeft(vis.y)
            .ticks(6)
            .tickFormat(d => d);
        vis.yAxisGroup.call(yAxisCall);

        const rects = vis.g.selectAll("rect")
            .data(data);

        rects.exit().remove();

        rects
            .attr("y", d => vis.y(d.excess_deaths))
            .attr("x", (d) => vis.x(d.country))
            .attr("width", vis.x.bandwidth)
            .attr("height", d => vis.window2_height - vis.y(d.excess_deaths));

        rects.enter().append("rect")
            .attr("y", d => vis.y(d.excess_deaths))
            .attr("x", (d) => vis.x(d.country))
            .attr("width", vis.x.bandwidth)
            .attr("height", d => vis.window2_height - vis.y(d.excess_deaths))
            .attr("fill", "grey");
    }

	updateExcessDeathPercentage(data) {
        const vis = this;

        vis.x.domain(data.map(d => d.country));
        vis.y.domain([0, d3.max(data, d => d.excess_deaths_percentage)]);

        // X Axis
        const xAxisCall = d3.axisBottom(vis.x);
        vis.xAxisGroup.call(xAxisCall)
            .selectAll("text")
            .attr("y", "10")
            .attr("x", "-5")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-40)");

        // Y Axis
        const yAxisCall = d3.axisLeft(vis.y)
            .ticks(6)
            .tickFormat(d => `${d.toFixed(2)}%`);
        vis.yAxisGroup.call(yAxisCall);

        const rects = vis.g.selectAll("rect")
            .data(data);

        rects.exit().remove();

        rects
            .attr("y", d => vis.y(d.excess_deaths_percentage))
            .attr("x", (d) => vis.x(d.country))
            .attr("width", vis.x.bandwidth)
            .attr("height", d => vis.window2_height - vis.y(d.excess_deaths_percentage));

        rects.enter().append("rect")
            .attr("y", d => vis.y(d.excess_deaths_percentage))
            .attr("x", (d) => vis.x(d.country))
            .attr("width", vis.x.bandwidth)
            .attr("height", d => vis.window2_height - vis.y(d.excess_deaths_percentage))
            .attr("fill", "grey");
    }
}

d3.json("data_processing/summed_deaths_2020.json").then(data => {
    const filteredData = data.map(d => ({
        country: d.country,
		excess_deaths: d.excess_deaths
    }));
	
    new BarChart("#bar-chart-1", filteredData, 0);
	const filteredData2 = data.map(d => ({
		country: d.country,
		excess_deaths_percentage: d.excess_deaths_percentage
    }));

	new BarChart("#bar-chart-2", filteredData2, 1);
});