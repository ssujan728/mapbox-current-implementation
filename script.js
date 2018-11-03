mapboxgl.accessToken = "pk.eyJ1IjoiaW50ZXJuYXRpb25hbHNvcyIsImEiOiJjamo1cDNpOWsxdnB2M3BzMjAzNWk1b2FoIn0.49i92ZK8WKifgkSEKtDB7Q";

var map;

function initMap() {
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v9',
        zoom: 2
    });
}

function addLayerToMapbox(layerId, coordinates, coordinatesString,
    geometryType, color, opacity, lineDashArray, lineDashColor) {

    var layers = map.getStyle().layers;
    var firstSymbolId;

    for (var i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol') {
            firstSymbolId = layers[i].id;
            break;
        }
    }


    var calculatedCoordinatesString = "";
    var tempCoordinatesList = []
    var calculatedCoordinates = [];

    if (coordinates.length > 0) {
        coordinates.forEach(coordinate => {
            //calculatedCoordinatesString += calculatedCoordinatesString + "[" + coordinate.Latitude + "," + coordinate.Longitude + "],"
            tempCoordinatesList.push(coordinate.Latitude);
            tempCoordinatesList.push(coordinate.Longitude);
        });
        calculatedCoordinates = tempCoordinatesList;
    } else {
        calculatedCoordinatesString = coordinatesString;
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
            id: layerId + lineDashArray,
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

    var Auxilary = {
        MaxLat: null,
        MinLat: null,
        MaxLon: null,
        MinLon: null
    }

    var polygonString = JSON.stringify(polygon);

    //console.log(polygonString);

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

    Auxilary.MinLat = polygonObject[0].Lat;
    Auxilary.MaxLat = polygonObject[polygonObject.length - 1].Lat

    polygonObject.sort(sortLongitude);

    Auxilary.MinLon = polygonObject[0].Lon;
    Auxilary.MaxLon = polygonObject[polygonObject.length - 1].Lon;

    return Auxilary;
}

function expandBounds(mainBounds, newBounds, defaultBounds) {
    var expandedBounds = {
        MaxLat: null,
        MinLat: null,
        MaxLon: null,
        MinLon: null
    }

    if (defaultBounds === true) {
        expandedBounds = newBounds;
    } else {
        if (mainBounds.MaxLat >= newBounds.MaxLat) {
            expandedBounds.MaxLat = mainBounds.MaxLat;
        } else {
            expandedBounds.MaxLat = newBounds.MaxLat;
        }

        if (mainBounds.MaxLon >= newBounds.MaxLon) {
            expandedBounds.MaxLon = mainBounds.MaxLon;
        } else {
            expandedBounds.MaxLon = newBounds.MaxLon;
        }

        if (mainBounds.MinLat >= newBounds.MinLat) {
            expandedBounds.MinLat = mainBounds.MinLat;
        } else {
            expandedBounds.MinLat = newBounds.MinLat;
        }

        if (mainBounds.MinLon >= newBounds.MinLon) {
            expandedBounds.MinLon = mainBounds.MinLon;
        } else {
            expandedBounds.MinLon = newBounds.MinLon;
        }

    }
    return expandedBounds;
}

//coordinates => array
//coordinates => string        
function addImageLayerToMapbox(layerId, coordinates, coordinatesString, imageUrl) {

    var calculatedCoordinatesString = "";
    var tempCoordinatesList = []

    if (coordinates.length > 0) {
        coordinates.forEach(coordinate => {
            calculatedCoordinatesString += calculatedCoordinatesString + "[" + coordinate.Latitude + "," + coordinate.Longitude + "],"
            tempCoordinatesList.push(coordinate.Latitude);
            tempCoordinatesList.push(coordinate.Longitude);

        })
    } else {
        calculatedCoordinatesString = coordinatesString;
    }

    console.log(tempCoordinatesList);
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
            'layout': {
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

    map.addSource(layerId, createGeoJSONCircle(center, radius));
    var layers = map.getStyle().layers;
    var firstSymbolId;
    for (var i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol') {
            firstSymbolId = layers[i].id;
            break;
        }
    }

    map.addLayer({
        'id': layerId,
        'type': 'fill',
        'source': layerId,
        'layout': {},
        'paint': {
            'fill-color': 'red',
            'fill-opacity': opacity
        }
    }, firstSymbolId);

}

function addPopupOnClick(layerId, longitude, latitude, titleLink, title, otherText) {
    var layersArrary = [];
    layersArrary.push(layerId);

    var coordianteArray = [];
    coordianteArray.push(longitude)
    coordianteArray.push(latitude)

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

    return {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: ret
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