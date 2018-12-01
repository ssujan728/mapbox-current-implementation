//JavaScript for MapBox
var map;

function initializeMapbox(accessToken, containerId, styleUrl, zoomLevel) {
    mapboxgl.accessToken = accessToken;

    map = new mapboxgl.Map({
        container: containerId,
        style: styleUrl,
        zoom: zoomLevel
    });

    var navigationControl = new mapboxgl.NavigationControl();

    $('#' + containerId).on('mouseenter', function () {
        map.addControl(navigationControl);
        //addCartoCopyWrite();
    });

    $('#' + containerId).on('mouseleave', function () {
        map.removeControl(navigationControl);
    });
}

function addLayerToMapbox(layerId, coordinates, geometryType, color, opacity, lineDashArray, lineDashColor) {

    var layers = map.getStyle().layers;
    var firstSymbolId;

    for (var i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol') {
            firstSymbolId = layers[i].id;
            break;
        }
    }

    map.addLayer({
        id: layerId,
        type: 'fill',
        source: {
            type: 'geojson',
            data: {
                'type': 'Feature',
                'geometry': {
                    'type': geometryType,
                    'coordinates': coordinates
                }
            }
        },
        'layout': {},
        'paint': {
            'fill-color': color,
            'fill-opacity': opacity
        }
    }, firstSymbolId);

    if (lineDashArray != [0, 0]) {
        map.addLayer({
            id: layerId + lineDashArray[0] + lineDashArray[1],
            type: 'line',
            source: {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: geometryType,
                        coordinates: coordinates
                    }
                }
            },
            layout: {},
            paint: {
                'line-color': lineDashColor,
                'line-width': 1,
                'line-dasharray': lineDashArray,
            }
        });
    }
}

function locationGetCoordinatesAndBounds(polygon) {

    var auxilary = {
        maxLat: null,
        minLat: null,
        maxLon: null,
        minLon: null
    }

    var polygonString = JSON.stringify(polygon);

    polygonString = polygonString.replace(/\[\[\[/g, '[');
    polygonString = polygonString.replace(/\[\[/g, "[");

    polygonString = polygonString.replace(/\]\]\]/g, "]");
    polygonString = polygonString.replace(/\]\]/g, "]");

    polygonString = polygonString.replace(/\[/g, "{\"Lat\":");
    polygonString = polygonString.replace(/\]\,/g, "#");

    polygonString = polygonString.replace(/\,/g, ",\"Lon\":")
    polygonString = polygonString.replace(/\#/g, "},")
    polygonString = polygonString.replace(/\]/g, "}")

    polygonString = "[" + polygonString + "]";
    //console.log(polygonString)
    var polygonString = JSON.parse(JSON.stringify(polygonString));

    var polygonObject = JSON.parse(polygonString);
    polygonObject.sort(sortLatitude);

    auxilary.minLat = polygonObject[0].Lat;
    auxilary.maxLat = polygonObject[polygonObject.length - 1].Lat

    polygonObject.sort(sortLongitude);

    auxilary.minLon = polygonObject[0].Lon;
    auxilary.maxLon = polygonObject[polygonObject.length - 1].Lon;

    return auxilary;
}

function expandBounds(mainBounds, newBounds, defaultBounds) {
    var expandedBounds = {
        maxLat: null,
        minLat: null,
        maxLon: null,
        minLon: null
    }

    if (defaultBounds === true) {
        expandedBounds = newBounds;
    } else {
        if (mainBounds.maxLat >= newBounds.maxLat) {
            expandedBounds.maxLat = mainBounds.maxLat;
        } else {
            expandedBounds.maxLat = newBounds.maxLat;
        }

        if (mainBounds.maxLon >= newBounds.maxLon) {
            expandedBounds.maxLon = mainBounds.maxLon;
        } else {
            expandedBounds.maxLon = newBounds.maxLon;
        }

        if (mainBounds.minLat >= newBounds.minLat) {
            expandedBounds.minLat = mainBounds.minLat;
        } else {
            expandedBounds.minLat = newBounds.minLat;
        }

        if (mainBounds.minLon >= newBounds.minLon) {
            expandedBounds.minLon = mainBounds.minLon;
        } else {
            expandedBounds.minLon = newBounds.minLon;
        }

    }
    return expandedBounds;
}

//coordinates => array
//coordinates => string        
function addImageLayerToMapbox(layerId, coordinates, imageUrl) {

    var tempCoordinatesList = [];

    coordinates.forEach(function(coordinate) {
        tempCoordinatesList.push(coordinate.Latitude);
        tempCoordinatesList.push(coordinate.Longitude);
    })

    map.loadImage(imageUrl, function (error, image) {
        map.addImage(layerId, image);
        map.addLayer({
            id: layerId,
            type: 'symbol',

            source: {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: tempCoordinatesList
                        }
                    }]
                }
            },
            layout: {
                'icon-image': layerId,
                'icon-size': 0.40
            }
        });
    });
}

function addRadiusLayerToMapbox(layerId, imageUrl, radius, long, lat, color, opacity) {
    var center = [];

    center.push(lat);
    center.push(long);

    console.log('radius layer start');
    console.log('createGeoJsonCircle');
    console.log(center[0]);
    console.log(center[1]);
    console.log(radius);
    console.log(createGeoJSONCircle(center, radius));

    //map.on('load', function () {
    map.addSource(layerId, createGeoJSONCircle(center, radius));
    var layers = map.getStyle().layers;
    var firstSymbolId;
    for (var i = 0; i < layers.length; i++) {
        console.log(layers[i].type);
        if (layers[i].type === 'symbol') {
            firstSymbolId = layers[i].id;
            break;
        }
    }

    console.log(firstSymbolId);
    console.log(layerId);

    map.addLayer({
        id: layerId,
        type: 'fill',
        source: layerId,
        layout: {},
        paint: {
            'fill-color': color,
            'fill-opacity': opacity
        }
    });
    //});
}

function addPopupOnClick(layerId, longitude, latitude, titleLink, title, otherText) {
    var layersArrary = [];
    layersArrary.push(layerId);

    var coordianteArray = [];
    
    coordianteArray.push(latitude)
    coordianteArray.push(longitude)
    
    map.on('click', function (e) {
        var features = map.queryRenderedFeatures(e.point, {
            layers: layersArrary
        });

        if (!features.length) {
            return;
        }

        var feature = features[0];

        // for the style
        var style = ""
        if (otherText == "") {
            style = "display:none";
        } else {
            style = "";
        }

        var popup = new mapboxgl.Popup({ className: 'mapbox-bg-High' })
            .setLngLat(coordianteArray)
            .setHTML("<div>")
            .setHTML("<a href=" + titleLink + ">")
            .setHTML("<p><b>" + title + "</b></p>")
            .setHTML("</a>")
            .setHTML("<p style=" + style + ">" + otherText + '</p>')
            .setHTML("</div>")
            .setLngLat(coordianteArray)
            .addTo(map);

    });
}


var createGeoJSONCircle = function (center, radiusInKm, points) {
    if (!points) points = 64;

    var coords = {
        latitude: center[1],
        longitude: center[0]
    };

    var km = radiusInKm;

    var ret = [];
    var temp = [];
    var distanceX = km / (111.320 * Math.cos(coords.latitude * Math.PI / 180));
    var distanceY = km / 110.574;

    var theta, x, y;
    for (var i = 0; i < points; i++) {
        theta = (i / points) * (2 * Math.PI);
        x = distanceX * Math.cos(theta);
        y = distanceY * Math.sin(theta);

        ret.push([coords.longitude + x, coords.latitude + y]);
    }
    ret.push(ret[0]);
    temp.push(ret); // array inside an array otherwise it wont show on the map
    //console.log(ret);   

    return {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: temp
                }
            }]
        }
    };
};

function sortLatitude(a, b) {
    if (a.Lat < b.Lat)
        return -1;
    if (a.Lat > b.Lat)
        return 1;
    return 0;
}

function sortLongitude(a, b) {
    if (a.Lon < b.Lon)
        return -1;
    if (a.Lon > b.Lon)
        return 1;
    return 0;
}

function calculateBounds(coordinateSet, impactRadiusText) {
    var distY = 0;
    var distX = 0;
    var radius = parseFloat(impactRadiusText);
    if (radius != 0) {
        var cos = Math.cos(coordinateSet.Latitude * 3.141592654 / 180);
        distY = Math.abs(radius / (111.320 * cos));
        distX = radius / 110.574;
    }
    return {
        MaxLat: coordinateSet.Latitude + distX,
        MaxLong: coordinateSet.Longtitude + distY,
        MinLat: coordinateSet.Latitude - distX,
        MinLong: coordinateSet.Longtitude - distY
    };
}
