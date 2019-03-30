const xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function () {
  if (xhttp.readyState == 4 && xhttp.status == 200) {
    renderSvg(JSON.parse(xhttp.responseText))
  }
}
xhttp.open("GET", "./global-temperature.json")
xhttp.send()

function renderSvg(data) {
  data.monthlyVariance.forEach(d => d.month = d.month - 1)
  const width = 1100;
  const height = 500;
  const padding = 150;
  const minYear = d3.min(data.monthlyVariance, d => d.year)
  const maxYear = d3.max(data.monthlyVariance, d => d.year)
  const monthIndex = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,]
  const colorsLegend = ['#a50026',
    '#d73027',
    '#f46d43',
    '#fdae61',
    '#fee090',
    '#ffffbf',
    '#e0f3f8',
    '#abd9e9',
    '#74add1',
    '#4575b4',
    '#313695'].reverse()
  const baseTemp = data.baseTemperature
  const minTemp = d3.min(data.monthlyVariance, d => d.variance + baseTemp)
  const maxTemp = d3.max(data.monthlyVariance, d => d.variance + baseTemp)

  const body = d3.select('body')
    .append('div')
    .attr('id', 'container')

  // Color Scale
  const thresholdLegend = d3.scaleThreshold()
    .domain((function (min, max, count) {
      var array = [];
      var step = (max - min) / count;
      var base = min;
      for (var i = 1; i < count; i++) {
        array.push(base + i * step);
      }
      return array;
    })(minTemp, maxTemp, 12))
    .range(colorsLegend)

  body.append('h1')
    .attr('id', 'title')
    .html('Monthly Global Land-Surface Temperature')

  body.append('h3')
    .attr('id', 'description')
    .html(`${minYear}-${maxYear}: base temperature ${baseTemp}&degC`)

  body.append('svg')
    .attr('width', width + padding)
    .attr('height', height + padding)

  body.append('div')
    .attr('id', 'tooltip')

  //position the rects on the xScale
  const xScale = d3.scaleLinear()
    .domain([minYear, maxYear])
    .range([0, width])

  const yScale = d3.scaleLinear()
    .domain([0, 11])
    .range([0, height])

  const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(20)
  const yAxis = d3.axisLeft(yScale).tickFormat(d => {
    var date = new Date(0);
    date.setUTCMonth(d);
    return d3.timeFormat("%B")(date);
  })

  // const xScaleLegend = d3.scaleLinear()
  //   .domain([minTemp - baseTemp, maxTemp - baseTemp])
  //   .range([0, 120])
  // const xAxisLegend = d3.axisBottom(xScaleLegend).tickValues(thresholdLegend.domain()).tickFormat(d3.format(".1f"));

  const svg = d3.select('svg')

  svg.append('g')
    .attr('id', 'x-axis')
    .call(xAxis)
    .attr('transform', `translate(${padding - 50}, ${height + (height / 11)})`)

  svg.append('g')
    .attr('id', 'y-axis')
    .call(yAxis)
    .attr('transform', `translate(${padding - 51},${(height / 11) / 2})`)


  svg.append('g')
    .attr('transform', `translate(${padding - 50},0)`)
    .selectAll('rect')
    .data(data.monthlyVariance)
    .enter()
    .append('rect')
    .attr('class', 'cell')
    .attr('data-year', d => d.year)
    .attr('data-month', d => d.month)
    .attr('data-temp', d => d.variance)
    .attr('fill', d => thresholdLegend(d.variance + baseTemp))
    .attr('x', d => xScale(d.year))
    .attr('y', d => yScale(d.month))
    .attr('width', width / (maxYear - minYear))
    .attr('height', height / 11)
    .on('mouseover', function () {
      d3.select('#tooltip').style('display', 'block')
    })
    .on('mouseout', function () {
      d3.select('#tooltip').style('display', 'none')
    })
    .on('mousemove', function (d) {
      let x = d3.mouse(this)[0] + 120
      let y = d3.mouse(this)[1] + 85
      d3.select('#tooltip')
        .attr('data-year', d.year)
        .style('top', y + 'px')
        .style('left', x + 'px')
        .html(`Year: ${d.year} <br/>
              Month: ${d.month} <br/>
              TempVariance: ${d.variance}
        `)
    })

  svg.append('g')
    .attr('transform', `translate(${width / 2},${height + 100})`)
    .attr('id', 'legend')
    .selectAll('rect')
    .data(monthIndex)
    .enter()
    .append('rect')
    .attr('width', 10)
    .attr('height', 10)
    .attr('fill', (d, i) => thresholdLegend((maxTemp / 13) * d))
    .attr('x', (d, i) => i * 10)
    .exit()

  // this part needs a redo
  svg.append('g')
    .append('text')
    .text(`min ${1.684} - max ${maxTemp}`)
    .attr('transform', `translate(${width / 2},${height + 130})`)

}