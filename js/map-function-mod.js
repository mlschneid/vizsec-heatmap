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
var heatmap;
var parent_node;
var layer;
var data = [];

var ZOOM_LEVELS = 4;

var heatmap_scaling_factor = 25;

var delay = 0;
var delta_delay = 500;

function get_node(text) {
    return $(".node").filter(function() {
            //return $(this).children('text').text() == text;
            return $(this).children('title').text() == text;
    });
}

function get_all_labels(parent_node){
    var labels = [];
    
    parent_node.find('.node').each(function(index){
        labels.push($(this).children('text').text());
        //console.debug($(this).children('text').text());
    });

    return labels;
}

function highlight_node(name, radius, intensity) {
    var ctm;

    var svg = $('svg')[0];
    var pt = svg.createSVGPoint();

    var node = get_node(name);
    if (node.length > 0) {
        var text_element = node.children('text').first();
        var x = text_element.attr('x');
        var y = text_element.attr('y');
        pt.x = x;
        pt.y = y;
        if (ctm == null) {
            var txt = text_element[0];
            ctm = txt.getTransformToElement(svg);
        }
        var transformed_point = pt.matrixTransform(ctm);
        data.push({lonlat: new OpenLayers.LonLat(transformed_point.x, -1*transformed_point.y),
                    count: intensity});
    }
    else {
        //console.debug('node not found:');
        //console.debug(name);
    }
}


function display_heatmap(csvContent, max){
    var transformedTestData = { max: max, data:[] };


    layer = new OpenLayers.Layer.OSM();
    heatmap = new OpenLayers.Layer.Heatmap("Heatmap",
            map, layer,
            {visible: true, radius:20},
            {isBaseLayer: false, opacity: 0.8}
    );

    csvNormalized = normalize(csvContent, 100);

    for(var i = 0; i < csvNormalized.length; i++){
        nodeId = csvNormalized[i][0];
        intensityValue = csvNormalized[i][1];
        highlight_node(nodeId, heatmap.defaultRadius, intensityValue);
    }

    map.addLayers([layer, heatmap]);
    map.zoomToMaxExtent();

    transformedTestData.data = data;
    heatmap.setDataSet(transformedTestData);

    //rescale_heatmap();
}

function normalize(csvContent, upperlimit = 1){
    max = -1000.0;
    min = 1000.0;
    for(var i = 0; i < csvContent.length; i++){
        if (max < csvContent[i][1]){
            max = csvContent[i][1];
        }
        if (min > csvContent[i][1]){
            min = csvContent[i][1];
        }
    }

    console.log(max);
    console.log(min);

    normalized = [];
    for(var i = 0; i < csvContent.length; i++){
        normalized.push([csvContent[i][0], ((csvContent[i][1] - min)/(max - min))*upperlimit]);
        //normalized[i][0] = csvContent[i][0];
        //normalized[i][1] = (csvContent[i][1] - min)/(max - min);
    }

    return normalized;
}

/*
function display_heatmap(url, width, height){
    // avoid race condition: check if svg has been initialized yet before trying to draw terms
    var svg = $('svg');
    if (svg.length == 0) {
        delay += delta_delay;
        setTimeout(function() {display_heatmap(url, width, height);}, delay);
    }
    heatmap = new Heatmap.Layer("Heatmap");
    heatmap.defaultRadius = 20;
    heatmap.defaultIntensity = 0.1;
    heatmap.setOpacity(0.8);

    $.ajax({ url: url, success: function(heatmap_data) 
        { 
            parent_node = $('<output>').append($.parseHTML(heatmap_data)).find('svg');
            //svg = $('<output> svg')[0];
            var list = get_all_labels(parent_node);
            
            for(var i in list){
                highlight_node(list[i], heatmap.defaultRadius, heatmap.intensity);
            }

            map.addLayers([heatmap]);
            map.zoomToExtent(bounds);

        } 
    });
}
*/

function display_map(map_url, width, height) {
    bounds = new OpenLayers.Bounds(0, (-1 * height), width, 0);
    map_options = {
        controls:[
            new OpenLayers.Control.Navigation(),
            new OpenLayers.Control.PanZoomBar(),
                ],
        maxExtent: bounds,
        numZoomLevels: 6,
        fractionalZoom: false,
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

function display_map_with_zoom(map_urls, width, height) {
    var bounds = new OpenLayers.Bounds(0, -1 * height, width, 0);
    map_options = {
        controls:[
            new OpenLayers.Control.Navigation(),
            new OpenLayers.Control.PanZoomBar(),
                ],
        maxExtent: bounds,
        numZoomLevels: 6,
        fractionalZoom: true,
    }
    map = new OpenLayers.Map ("map", map_options);

    var gmaps = new Array();
    for (var i = 0; i < ZOOM_LEVELS; i++)
    {
        var gmap = new OpenLayers.Layer.ScalableInlineXhtml(
            "GMap",
            map_urls[i],
            bounds,
            null,
            {isBaseLayer: true, opacity: '1.0'});
	    gmap.adjustBounds(bounds);

	    gmaps.push(gmap);
    }

    var svg = $('svg');
    map.addLayers(gmaps);
	for (var i = 0; i < gmaps.length; i++)
		gmaps[i].setVisibility(false);
    map.zoomToExtent(bounds);

    var curZoom = getZoomSafe(0, gmaps.length - 1, map.getZoom());
    gmaps[curZoom].setVisibility(true);

	map.events.register("zoomend", map, function() {
		zoom = map.getZoom();
	    for (var i = 0; i < gmaps.length; i++)
	    	gmaps[i].setVisibility(false);

	    zoom = getZoomSafe(0, gmaps.length - 1, map.getZoom());
		gmaps[zoom].setVisibility(true);
        rescale_heatmap();
	});

}

function rescale_heatmap() {
    if (heatmap) {
        heatmap.defaultRadius = heatmap_scaling_factor * map.zoom;
        heatmap.redraw();
    }
}

function getZoomSafe(lower, upper, value)
{
    var zoom = value.toFixed();
    zoom = Math.max(lower, zoom);
    zoom = Math.min(upper, zoom);
    return zoom;
}

