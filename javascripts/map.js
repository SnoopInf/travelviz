/**
 * Created by kdavydenko on 3/23/2015.
 */
var colors = {
    "Visa required": '#F08080',
    "Visa not required": '#32CD32',
    "Visa on arrival": '#FFE590',
    "eVisa": '#E8C2CF',
    "Tourist card required": '#FBCE7B',
    "Electronic Travel Authorization": '#F3E292',
    "Entry Permit on arrival": '#ACE5A1',
    "Ukraine": '#AC85C8',
    "Nature": 'green',
    "Architecture": 'purple',
    "History": 'brown'
};

var colorsVisa = [
    {'name': "Visa required",
        'color': '#F08080'},
    {'name': "Visa not required",
        'color': '#32CD32'},
    {'name': "Visa on arrival",
        'color': '#FFE590'},
    {'name': "eVisa",
        'color': '#E8C2CF'},
    {'name': "Tourist card required",
        'color': '#FBCE7B'},
    {'name': "Electronic Travel Authorization",
        'color': '#F3E292'},
    {'name': "Entry Permit on arrival",
        'color': '#ACE5A1'},
    {'name': "Ukraine",
        'color': '#AC85C8'}
];

var colorsPlaces = [
    {'name': "Nature",
        'color': 'green'},
    {'name': "Architecture",
        'color': 'purple'},
    {'name': "History",
        'color': 'brown'}];


var map = new Datamap({
    element: document.getElementById('map'),
    fills: colors,
    dataType: 'json',
    dataUrl: '/travelviz/data/countries.json',
    data: {},
    geographyConfig: {
        popupTemplate: function(geography, data) {
            return '<div class="hoverinfo"><strong>' + geography.properties.name + '</strong> <br />Visa info: ' +  data.fillKey +  ((data.anotherProperty)?' ('+ data.anotherProperty + ')': '') + ' </div>';
        }
    }
});


var placesDiv = d3.select("div.images");
var width = placesDiv.property("offsetWidth"),
    height = 600,// placesDiv.property("offsetHeight"),
    radius = 60,
    hex_width = 120,
    hex_height = 120;
var svg = placesDiv.append("svg")
    .attr("width", width)
    .attr("height", height);
var defs = svg.append("defs");
function buildVisaInfoLegend(container, x, y) {
    var legend = d3.select(container)
        .select("svg")
        .append("g")
        .attr("class", "legend");


    legend.selectAll("circle.legend-bullet")
        .data(colorsVisa)
        .enter()
        .append('rect')
        .attr('class', 'legend-bullet')
        .attr('x', x)
        .attr('y', function (data, index) {
            return y + index * 15;
        })
        .attr("width", 10).attr("height", 10)
        .attr("fill", function (data) {
            return data.color;
        })
        .attr("stroke", "black");

    legend.selectAll("text.legend-text")
        .data(colorsVisa)
        .enter()
        .append('text')
        .attr('class', 'legend-text')
        .attr('x', x + 20)
        .attr('y', function (data, index) {
            return y + 10 + index * 15;
        })
        .text(function (d) {
            return d.name
        });
}

buildVisaInfoLegend(".map-container", 20, 455);

var legendPlaces = d3.select(".map-container")
    .select("svg")
    .append("g")
    .attr("class", "legend-places");


legendPlaces.selectAll("circle.legend-bullet")
    .data(colorsPlaces)
    .enter()
    .append('circle')
    .attr('class', 'legend-bullet')
    .attr('cx', '600')
    .attr('cy', function(data, index) {
        return 505 + index * 22;
    })
    .attr('r', 10)
    .attr("width", 10).attr("height", 10)
    .attr("fill", function(data){
        return data.color;})
    .attr("stroke","white")
    .attr("stroke-width","2px");

legendPlaces.selectAll("text.legend-text")
    .data(colorsPlaces)
    .enter()
    .append('text')
    .attr('class', 'legend-text')
    .attr('x', '615')
    .attr('y', function(data, index) {
        return 510 + index * 22;
    })
    .text(function(d) { return d.name });

d3.json("/travelviz/data/places.json", function(error, latest_data) {
    if (error) {
        console.log(error);
    } else {
        console.log(latest_data);
        map.bubbles(latest_data, {
            popupTemplate: function(geo, data) {
                return "<div class='hoverinfo tooltip-container'><div class=\"tooltip-caption\">" + data.name + "(" + data.country + ")" + "</div><div class=\"tooltip-body\">" + data.description + "</div></div>";
            }
        });

        latest_data.forEach(function(d, idx) {
            d.id = idx;
            defs.append("pattern")
                .attr("width", 1)
                .attr("height", 1)
                .attr("patternUnits", "objectBoundingBox")
                .attr("patternContentUnits", "objectBoundingBox")
                .attr("id", "img" + (idx))
                .append("image")
                .attr("xlink:href", d.image)
                .attr("width", 2)
                .attr("height", 2)
                .attr("y", -0.5);
        });

    }
});

var topology = hexTopology(radius, width, height);

var projection = hexProjection(radius);

var path = d3.geo.path()
    .projection(projection);

svg.append("g")
    .attr("class", "hexagon")
    .selectAll("path")
    .data(topology.objects.hexagons.geometries)
    .enter().append("path")
    .attr("d", function(d) { return path(topojson.feature(topology, d)); })
    .attr("fill", function(d) {
        return d.fill;
    })
    .attr("pos", function(d) {
        return "i :" + d.i + " j: " + d.j + " isActive: " + d.active;
    })
    //.attr("class", function(d) { return d.fill ? "fill" : null; })

    .on("mouseover", function(d) {
        var $this = this;
        mouseover(d, $this);
    } )
    .on("mouseout", function(d) {
        var $this = this;
        mouseout(d, $this);
    });


svg.append("path")
    .datum(topojson.mesh(topology, topology.objects.hexagons))
    .attr("class", "mesh")
    .attr("d", path);

var border = svg.append("path")
    .attr("class", "border")
    .call(redraw);

var mousing = 0;

function mouseover(d, hex) {
    d3.selectAll(".datamaps-bubble").attr("selected", function(data,i){
        if(i == d.idx) {
            var $this = d3.select(this);
            map.onMouseOver($this, data, true);
            if(d.active) {
                d3.select(hex)
                    .style('stroke', colors[data.fillKey]);
            }
        }
        return i == d.idx;
    });
}

var highlightHex = function(id, key) {
    d3.select(".hexagon").selectAll("path").style('stroke', function(hex) {
        if(id && hex.idx == id) {
            return colors[key];
        } else {
            return "none";
        }
    }).style('stroke-width', function(hex) {
        if(id && hex.idx == id) {
            return "3px";
        } else {
            return "1px";
        }
    })
};

map.hexSelect = highlightHex;


function mouseout(d, hex) {
    d3.selectAll(".datamaps-bubble").attr("selected", function(data,i){
        if(i == d.idx) {
            var $this = d3.select(this);
            map.onMouseOut($this);
            if(d.active) {
                d3.select(hex)
                    .style('stroke', "none");
            }
        }
        return i == d.idx;
    });
}

function mousedown(d) {
    mousing = d.fill ? -1 : +1;
    mousemove.apply(this, arguments);
    d3.selectAll(".datamaps-bubble").attr("selected", function(data,i){
        if(i == d.idx) {
            var $this = d3.select(this);
            map.onMouseOver($this, data);
        }
        return i == d.idx;
    });
}

function mousemove(d) {
    if (mousing) {
        d3.select(this).classed("fill", d.fill = mousing > 0);
        border.call(redraw);
    }
}

function mouseup() {
    mousemove.apply(this, arguments);
    mousing = 0;
}

function redraw(border) {
    border.attr("d", path(topojson.mesh(topology, topology.objects.hexagons, function(a, b) { return a.fill ^ b.fill; })));
}

function hexTopology(radius, width, height) {
    var dx = radius * 2 * Math.sin(Math.PI / 3),
        dy = radius * 1.5,
        m = Math.ceil((height + radius) / dy) + 1,
        n = Math.ceil(width / dx) + 1,
        geometries = [],
        arcs = [];

    for (var j = -1; j <= m; ++j) {
        for (var i = -1; i <= n; ++i) {
            var y = j * 2, x = (i + (j & 1) / 2) * 2;
            arcs.push([[x, y - 1], [1, 1]], [[x + 1, y], [0, 1]], [[x + 1, y + 1], [-1, 1]]);
        }
    }

    var cnt = 0;
    for (var j = 0, q = 3; j < m; ++j, q += 6) {
        for (var i = 0; i < n; ++i, q += 3) {
            var active = j > 1 && (j % 2 == 0 || j % 2 == 1 && i != 0 && i != n - 1);
            var idx = active?++cnt:-1;
            geometries.push({
                type: "Polygon",
                arcs: [[q, q + 1, q + 2, ~(q + (n + 2 - (j & 1)) * 3), ~(q - 2), ~(q - (n + 2 + (j & 1)) * 3 + 2)]],
                fill: active?"url(#img"+ idx +")":"",
                active: active,
                i: i,
                j: j,
                idx: idx
            });
        }
    }

    return {
        transform: {translate: [0, 0], scale: [1, 1]},
        objects: {hexagons: {type: "GeometryCollection", geometries: geometries}},
        arcs: arcs
    };
}

function hexProjection(radius) {
    var dx = radius * 2 * Math.sin(Math.PI / 3),
        dy = radius * 1.5;
    return {
        stream: function(stream) {
            return {
                point: function(x, y) { stream.point(x * dx / 2, (y - (2 - (y & 1)) / 3) * dy / 2); },
                lineStart: function() { stream.lineStart(); },
                lineEnd: function() { stream.lineEnd(); },
                polygonStart: function() { stream.polygonStart(); },
                polygonEnd: function() { stream.polygonEnd(); }
            };
        }
    };
}


var w = 1200,
    h = 1000;

var bubbles = d3.select(".bubble").append("svg")
    .attr("width", w)
    .attr("height", h);


buildVisaInfoLegend(".bubble", 20, 30);

var force = d3.layout.force()
    .gravity(.05)
    .distance(100)
    .charge(-100)
    .size([w, h]);

d3.json("/travelviz/data/flights.json", function(error, json) {
    if (error) {
        console.log(error);
    } else {
        force
            .nodes(json.nodes)
            .links(json.links)
            .linkDistance(function(link) {
                var scale = 20;
                var offset = 30;
                return offset + ((!link.duration)? 1 * scale: link.duration * scale/60.0);
            })
            .start();

        var link = bubbles.selectAll(".link")
            .data(json.links)
            .enter().append("line")
            .attr("class", "link");

        var node = bubbles.selectAll(".node")
            .data(json.nodes)
            .enter().append("g")
            .attr("class", "node")
            .call(force.drag);

        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
                return "<strong>Country:</strong> <span style='color:red'>" + d.name + "</span>" +
                    "<br/><strong>Price</strong> " + d.value + "$" +
                    "<br/><strong>Flight duration</strong> " + Math.round(d.duration/60) + "h";
            })

        node.call(tip);

        node.append("circle")
            .attr("fill", function(d) {
                return colors[d.visa];
            })
            .attr("x", -8)
            .attr("y", -8)
            .attr("r", function(d) {
                var value = d.value;
                if(!value) value = 2;
                else if( value < 50) value = 7;
                else if (value < 100) value = 10;
                else if (value < 500) value = 20;
                else if (value < 1000) value = 25;
                else value = 30;
                return value;
            })
            .attr("width", 16)
            .attr("height", 16)
            .attr("stroke", "black")
            .attr("stroke-width", "1px")
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide);

        node.append("text")
            .attr("dx", 12)
            .attr("dy", ".35em")
            .text(function(d) { return d.name });

        force.on("tick", function() {
            link.attr("x1", function (d) {
                return d.source.x;
            })
                .attr("y1", function (d) {
                    return d.source.y;
                })
                .attr("x2", function (d) {
                    return d.target.x;
                })
                .attr("y2", function (d) {
                    return d.target.y;
                });

            node.attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
        });


    }
});





