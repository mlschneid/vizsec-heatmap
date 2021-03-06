$(document).ready(function() {
    $('#opacity-slider').slider({
         max:100,
         min:0,
         value:100,
         animate: true,
         change: opacity_slider_change,
    });

});

function opacity_slider_change(event, ui) {
    var opacity =  ui.value / 100.0;
    $('.edge').children('path').attr('opacity', opacity);
}

var bounds;
var gmapLayer;
var osm_layer;
var heatmap_layer;
var parent_node;
var data = {};
var nodes = {};
var minHeat = 0.05;
var maxHeat = 1.0;
//var unknown_value = 0; //keeps track of greatest heatmap value that belongs to "Unknown" country.

var ZOOM_LEVELS = 4;

var heatmap_scaling_factor = 25;

var delay = 0;
var delta_delay = 500;

function get_all_nodes(){
    $('svg').find('.node').each(function(index){
        var title = $(this).children('title').text();
        nodes[title] = $(this);
    });
}

function get_node(text) {
    return nodes[text];
}

function get_all_labels(parent_node){
    var labels = [];

    parent_node.find('.node').each(function(index){
        labels.push($(this).children('text').text());
    });

    return labels;
}

function create_svg_point(node){
    var ctm;
    var svg = $('svg')[0];
    var pt = svg.createSVGPoint();
    var my_node = get_node(node);
    if (my_node){
        var text_element = my_node.children('text').first();
        var x = text_element.attr('x');
        var y = text_element.attr('y');
        pt.x = x;
        pt.y = y;
        if (ctm == null){
            var txt = text_element[0];
            ctm = txt.getTransformToElement(svg);
        }
        
        return pt.matrixTransform(ctm);
    }
    return null;
}

function highlight_node(name, radius, intensity) {
    if (unknown_value < minHeat && unknown_value > maxHeat){
        return;
    }

    var transformed_point = create_svg_point(name);

    if (transformed_point != null){
        data[[transformed_point.x, -1*transformed_point.y]] = intensity;
    }
    else {
        if (unknown_value < intensity) {
            unknown_value = intensity;
        }
    }
}

function add_heatmap(){
    osm_layer = new OpenLayers.Layer.OSM("heatmap-layer");
    heatmap_layer = new OpenLayers.Layer.Heatmap("heatmap",
            map, osm_layer,
            {visible: true, radius: 15, 
                gradient: {
                    '.8': 'white',
                    '.95' : 'red'                  
                }
            },
            {isBaseLayer: false, opacity: 0.7}
    );

    map.addLayers([osm_layer, heatmap_layer]);
    map.zoomToMaxExtent();
}

function standard(csvContent){
    data = {};
    
    for(var i = 0; i < csvContent.length; i++){
        var nodeId = csvContent[i][0];
        var intensityValue = csvContent[i][1];

        highlight_node(nodeId, heatmap_layer.defaultRadius, 
                        intensityValue);
    }

    highlight_node("Unknown", heatmap_layer.defaultRadius, 
                        unknown_value);
}

function decay(csvContent){
    for(item in data){
        if (data[item] <= 0.05){
            data[item] = 0;
        }
        else{
            data[item] = data[item] * 0.5;
        }
    }

    for(var i = 0; i < csvContent.length; i++){
        var nodeId = csvContent[i][0];
        var intensityValue = csvContent[i][1];

        highlight_node(nodeId, heatmap_layer.defaultRadius, 
                        intensityValue);
    }

    highlight_node("Unknown", heatmap_layer.defaultRadius, 
                        unknown_value);
}

function decay_linear(csvContent){
    for(var item in data){
        if (data[item] <= 0.05){
            data[item] = 0;
        }
        else{
            data[item] = data[item] - 0.15;
        }
    }

    for(var i = 0; i < csvContent.length; i++){
        var nodeId = csvContent[i][0];
        var intensityValue = csvContent[i][1];

        highlight_node(nodeId, heatmap_layer.defaultRadius, 
                        intensityValue);
    }

    highlight_node("Unknown", heatmap_layer.defaultRadius, 
                        unknown_value);
}

function cumulative(csvContent){
    for(var i = 0; i < csvContent.length; i++){
        var nodeId = csvContent[i][0];
        var intensityValue = csvContent[i][1];
        
        highlight_node(nodeId, heatmap_layer.defaultRadius, 
                        intensityValue);
    }

    highlight_node("Unknown", heatmap_layer.defaultRadius, 
                        unknown_value);
}

function populate_heatmap(csvContent, minHeat, maxHeat, fp_HeatmapType){
    minHeat = minHeat;
    maxHeat = maxHeat;
    unknown_value = 0;
    get_all_nodes();

    fp_HeatmapType(csvContent);

    var accumulated_data = [];
    for(var item in data){
        var coordinates = item.split(",");
        var x = parseFloat(coordinates[0]);
        var y = parseFloat(coordinates[1]);

        accumulated_data.push({
                lonlat: new OpenLayers.LonLat(x, y),
                count: data[item]
        });
    }

    var transformedData = { max: 1, data:[] };
    transformedData.data = accumulated_data;
    heatmap_layer.setDataSet(transformedData);
    rescale_heatmap();
}

function display_map(map_url, width, height) {

    bounds = new OpenLayers.Bounds(0, (-1 * height), width, 0);
    map_options = {
        controls:[
            new OpenLayers.Control.Navigation(),
            new OpenLayers.Control.PanZoomBar(),
                ],
        maxExtent: bounds,
        numZoomLevels: 10,
        fractionalZoom: true,
    }
    map = new OpenLayers.Map ("map", map_options);

    gmapLayer = new OpenLayers.Layer.ScalableInlineXhtml(
        "GMap",
        map_url,
        bounds,
        null,
        {isBaseLayer: true, opacity: '1.0'});

    var svg = $('svg');
    gmapLayer.adjustBounds(bounds);

    map.addLayers([gmapLayer]);
    map.zoomToExtent(bounds);
}

function rescale_heatmap() {
    if (heatmap_layer) {
        //heatmap_layer.defaultRadius = heatmap_scaling_factor * map.zoom;
        //heatmap_layer.repaint();
    }
}

function getZoomSafe(lower, upper, value)
{
    var zoom = value.toFixed();
    zoom = Math.max(lower, zoom);
    zoom = Math.min(upper, zoom);
    return zoom;
}

