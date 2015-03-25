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
    "Nature": 'green'
};


var map = new Datamap({
    element: document.getElementById('map'),
    fills: colors,
    dataType: 'json',
    dataUrl: '/Dataviz/data/countries.json',
    data: {}
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

d3.json("/Dataviz/data/places.json", function(error, latest_data) {
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

var force = d3.layout.force()
    .gravity(.05)
    .distance(100)
    .charge(-100)
    .size([w, h]);

d3.json("/Dataviz/data/flights.json", function(error, json) {
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

        node.append("circle")
            .attr("fill", function(d) {
                return colors[d.visa];
            })
            .attr("x", -8)
            .attr("y", -8)
            .attr("r", function(d) {
                return (!d.value)?5:10+Math.log(d.value);
            })
            .attr("width", 16)
            .attr("height", 16);
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





