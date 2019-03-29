define(["require", "exports", "leaflet", "./AKM/Util", "./AKM/MarkersControl", "./config", "./AKM/MeasureControl", "./AKM/YAKMMarkers", "./AKM/BasicMarkers"], function (require, exports, L, Util_1, MarkersControl_1, config_1, MeasureControl_1, YAKMMarkers_1, BasicMarkers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function init(container) {
        // init base url (url path of the javascript folder)
        // work with require.js
        var scripts = document.querySelectorAll("script[data-main]");
        var script = scripts[scripts.length - 1];
        var dataMain = script.getAttribute("data-main");
        Util_1.setBase(dataMain.slice(0, dataMain.lastIndexOf("/")));
        var mapDiv = L.DomUtil.create("div", "map", container);
        mapDiv.id = "map";
        //auto resize the map
        function adjust() {
            var w, h;
            var container = mapDiv;
            if ("innerWidth" in window) {
                w = window.innerWidth;
                h = window.innerHeight;
            }
            else {
                var doc = document.documentElement || document.body;
                w = doc.clientWidth;
                h = doc.clientHeight;
            }
            container.style.width = "";
            container.style.height = String(Math.max(h * 0.95, h - 20)) + "px";
        }
        window.addEventListener("resize", adjust);
        adjust();
        var map = new L.Map(container);
        var layersControl = new L.Control.Layers();
        layersControl.addTo(map);
        var measureControl = new MeasureControl_1.MeasureControl({
            showCoord: function (latlng) {
                var x = Math.round(latlng.lng * 10) / 10;
                var z = Math.round(latlng.lat * 10) / 10;
                var cx = Math.floor(x / 16);
                var cz = Math.floor(z / 16);
                return "<span>x:" + x + "</span><span>z:" + z + "</span><span>chunk:(" + cx + "," + cz + ")</span>";
            },
            showMeasure: function (start, end, map) {
                var dst = Math.round(map.distance(start, end) * 10) / 10;
                var ang = Math.round(Math.atan2(start.lng - end.lng, end.lat - start.lat) / Math.PI * 180 * 10) / 10;
                return "<span>distance:" + dst + "</span><span>angle:" + ang + "\u00B0</span>";
            }
        });
        measureControl.addTo(map);
        var markersControl = new MarkersControl_1.MarkersControl(null, null);
        var groups = [
            {
                name: "v1",
                default: false,
                crs: {
                    datumZoom: 5
                },
                baseLayer: new L.TileLayer("../data/v1/{z}/{x},{y}.png", {
                    minNativeZoom: 0,
                    maxNativeZoom: 5,
                    minZoom: 0,
                    maxZoom: 6,
                    tileSize: 512,
                    bounds: [[-4800, -4800], [4800, 4800]],
                    attribution: "&copy; 2018-2019 Kedama"
                }),
                overlays: {}
            },
            {
                name: "v2",
                default: false,
                crs: {
                    datumZoom: 5
                },
                baseLayer: new L.TileLayer("../data/v2/{z}/{x},{y}.png", {
                    minNativeZoom: 0,
                    maxNativeZoom: 5,
                    minZoom: 0,
                    maxZoom: 6,
                    tileSize: 512,
                    bounds: [[-4800, -4800], [4800, 4800]],
                    attribution: "&copy; 2018-2019 Kedama"
                }),
                overlays: {
                    marker: new BasicMarkers_1.BasicMarkersManager(markersControl, {
                        url: "../data/v2/v2-markers.json",
                        icon: "../data/icons/icon-configuration.json",
                    }),
                }
            },
            {
                name: "v3",
                default: true,
                crs: {
                    datumZoom: 5
                },
                baseLayer: new L.TileLayer("https://kedama-map-tiles.jsw3286.eu.org/v3/z{z}/voxelmap/{x},{y}.png", {
                    bounds: [[-4096, -4096], [4096, 4096]],
                    tileSize: 256,
                    minNativeZoom: 1,
                    maxNativeZoom: 5,
                    minZoom: 1,
                    maxZoom: 6,
                }),
                overlays: {
                    marker: new YAKMMarkers_1.YAKMMarkersManager(markersControl, {
                        url: "https://kedama-map-markers.jsw3286.eu.org/getMarkers?map=v3"
                    }),
                }
            }
        ];
        config_1.bindLayer(layersControl, groups);
        map.setView([0, 0], 0);
        console.debug(map);
    }
    init(document.getElementById("map-container"));
});
//# sourceMappingURL=akm.js.map