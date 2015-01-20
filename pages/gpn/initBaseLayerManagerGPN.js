/*
 * initBaseLayers manager for GazPromN
 */
L.gmxBaseLayersManager.prototype.initDefaults = function (attr) {
    var blm = this,
        zIndexOffset = 2000000,
        mapID = attr && attr.mapID ? attr.mapID : '1D30C72D02914C5FB90D1D448159CAB6',
        //mapID = attr && attr.mapID ? attr.mapID : 'E248D9467A3F40F4833D382EB3A82A2D',
        lang = L.gmxLocale.getLanguage(),
        _gtxt = function (key) {
            return L.gmxLocale.getText(key) || key;
        },
        getURL = function(type) {
            return 'http://{s}.tile.cart.kosmosnimki.ru/' + type + '/{z}/{x}/{y}.png';
        },
        getOSMURL = function(type) {
            return 'http://{s}.tile.osm.kosmosnimki.ru/kosmo' + (lang === 'rus' ? '' : '-en') + '/{z}/{x}/{y}.png';
        };

    var prefix = 'maps.kosmosnimki.ru/';
    (function() {
        if (window.location.href.indexOf("testemis01.gazprom-neft.local") != -1) {
            prefix = "testemis01.gazprom-neft.local/kosmosnimki/";
        } else if (window.location.href.indexOf("spb99-emis01.gazprom-neft.local") != -1) {
            prefix = "spb99-emis01.gazprom-neft.local/kosmosnimki/";
        } else if (window.location.href.indexOf("gazprom-neft.local") != -1) {
            prefix = "spb99-emis01.gazprom-neft.local/kosmosnimki/";
        } else {
            return;
        }
        getURL = function(type) {
            return 'http://' + prefix + 'cart/{s}/'+type+'/{z}/{x}/{y}.png';
        };
        getOSMURL = function() {
            return 'http://' + prefix + 'osm/{s}{z}/{x}/{y}.png';
        };
    })();
    
    var copyrights = {
        collinsbartholomew: "&copy; <a href='http://www.collinsbartholomew.com/'>Collins Bartholomew Ltd.</a>"
        ,geocenter: "&copy; <a href='http://www.geocenter-consulting.ru/'>" + _gtxt('ЗАО «Геоцентр-Консалтинг»', 'Geocentre-Consulting') + "</a>"
        ,openStreetMap: "&copy; " + _gtxt('участники OpenStreetMap <a href="http://www.openstreetmap.org/copyright">ODbL</a>', 'OpenStreetMap contributers <a href="http://opendatacommons.org/licenses/odbl/">ODbL</a>')
        ,cgiar: "&copy; <a href='http://srtm.csi.cgiar.org/'>CGIAR-CSI</a>"
        ,'2gis': "&copy; <a href='http://help.2gis.ru/api-rules/#kart'>" + _gtxt('ООО «ДубльГИС»','2GIS') + "</a>"
        ,naturalearthdata: "&copy; <a href='http://www.naturalearthdata.com/'>Natural Earth</a>"
        ,nasa: "&copy; <a href='http://www.nasa.gov'>NASA</a>"
        ,earthstar: "&copy; <a href='http://www.es-geo.com'>Earthstar Geographics</a>"
        ,antrix: "&copy; <a href='http://www.antrix.gov.in/'>ANTRIX</a>"
        ,geoeye: "&copy; <a href='http://www.geoeye.com'>GeoEye Inc.</a>"
    };
    var getCopyright2 = function() {
        return [
            {minZoom: 1, maxZoom: 7, attribution: copyrights.collinsbartholomew + ', ' + _gtxt('2014', '2012')}
            ,{minZoom: 1, maxZoom: 7, attribution: copyrights.naturalearthdata + ', 2013'}
            ,{minZoom: 8, maxZoom: 17, attribution: copyrights.openStreetMap}
        ];
    }
    
    var iconPrefix = 'http://' + prefix + 'maps/api/img/baseLayers/';

    var baseLayers = {
        OSM: {
            icon: iconPrefix + 'basemap_osm_' + (lang === 'rus' ? 'ru' : '-eng') + '.png',
            layers:[
                L.tileLayer(getOSMURL(), {
                    maxZoom: 18,
                    gmxCopyright: getCopyright2()
                })
            ]
        }
    };

    var layersGMX = [{
        mapID: mapID,
        layerID: 'C9458F2DCB754CEEACC54216C7D1EB0A',  // satellite
        type: 'satellite',
        rus: 'Снимки',
        eng: 'Satellite',
        overlayColor: '#ffffff',
        icon: iconPrefix + 'basemap_satellite.png'
    }];

    if (lang === 'rus') {
        baseLayers.map = { rus: 'Карта', eng: 'Map',
            icon: iconPrefix + 'basemap_rumap.png',
            layers:[
                L.tileLayer.Mercator(getURL('m'), {
                    maxZoom: 19,
                    maxNativeZoom: 17,
                    gmxCopyright: [
                        { minZoom: 1, maxZoom: 9, attribution: copyrights.collinsbartholomew + _gtxt(", 2014",", 2012") }
                        ,{ minZoom: 1, maxZoom: 17, attribution: copyrights.geocenter + ", 2014", bounds: [[40, 29], [80, 180]] }
                    ]
                })
            ]
        };
    } else {
        layersGMX.push({mapID: mapID, layerID: '5269E524341E4E7DB9D447C968B20A2C', type: 'map', rus: 'Карта', eng: 'Map', icon: iconPrefix + 'basemap_rumap.png'});     // rumap
        layersGMX.push({mapID: mapID, layerID: 'BCCCE2BDC9BF417DACF27BB4D481FAD9', type: 'hybrid', rus: 'Гибрид', eng: 'Hybrid'});    // hybrid
    }
    var def = new L.gmx.Deferred();
    if (prefix !== 'maps.kosmosnimki.ru/') attr = {
        hostName: prefix + (prefix !== 'maps.kosmosnimki.ru/' ? 'maps' : ''),
        mapID: mapID,
        apiKey: 'J1M7SITY5X'
    };

    L.gmx.loadLayers(layersGMX, attr).then(function() {
        var layerByLayerID = {};
        for (var i = 0, len = arguments.length; i < len; i++) {
            var layer = arguments[i],
                gmx = layer._gmx,
                mapName = gmx.mapName,
                layerID = gmx.layerID;
            if (!(mapName in layerByLayerID)) layerByLayerID[mapName] = {};
            layerByLayerID[mapName][layerID] = layer;
        }
        for (var i = 0, len = layersGMX.length; i < len; i++) {
            var info = layersGMX[i],
                type = info.type;
            if (type === 'hybrid') continue;
            if (type === 'satellite') {
                var satellite = layerByLayerID[info.mapID][info.layerID];        // satellite
                baseLayers.hybrid = {
                    rus: 'Гибрид',
                    eng: 'Hybrid',
                    overlayColor: '#ffffff',
                    icon: iconPrefix + 'basemap_hybrid.png',
                    layers: [
                        satellite        // satellite
                        ,
                        (lang === 'rus' ?
                            L.tileLayer.Mercator(getURL('o'), {         // rus Overlay
                                maxZoom: 19,
                                maxNativeZoom: 17,
                                attribution: 'Scanex'
                            })
                            :
                            layerByLayerID[info.mapID]['BCCCE2BDC9BF417DACF27BB4D481FAD9']    // eng Overlay
                        )
                    ]
                };
                //baseLayers.hybrid.layers[1].setZIndex(zIndexOffset);
                //baseLayers.OSMHybrid.layers.unshift(satellite);
            }
            baseLayers[type] = {
                rus: info.rus,
                eng: info.eng,
                icon: info.icon,
                overlayColor: info.overlayColor || '#00',
                layers:[layerByLayerID[info.mapID][info.layerID]]
            };
        }
        for(var id in baseLayers) {
            var baseLayer = baseLayers[id];
            if (!baseLayer.rus) baseLayer.rus = id;
            if (!baseLayer.eng) baseLayer.eng = id;
            blm.add(id, baseLayer);
        }
        def.resolve();
    });
    return def;
};

