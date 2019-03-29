import * as L from "leaflet"
import { setBase } from "./AKM/Util"
import { MarkerData, MarkersControl } from "./AKM/MarkersControl"
import { BoundedTileLayer } from "./AKM/BoundedTileLayer"
import { bindLayer, MapLayerConfig } from "./config"
import { MeasureControl } from "./AKM/MeasureControl"
import { YAKMMarkersManager } from "./AKM/YAKMMarkers"
import { BasicMarkersManager } from "./AKM/BasicMarkers"




function init(container: HTMLElement) {

    // init base url (url path of the javascript folder)
    // work with require.js
    let scripts = document.querySelectorAll("script[data-main]");
    const script = <HTMLScriptElement>scripts[scripts.length - 1];
    let dataMain = script.getAttribute("data-main");
    setBase(dataMain.slice(0, dataMain.lastIndexOf("/")));

    let mapDiv = L.DomUtil.create("div", "map", container);
    mapDiv.id = "map";

    //auto resize the map
    function adjust() {
        let w: number, h: number;
        let container = mapDiv;
        if ("innerWidth" in window) {
            w = window.innerWidth;
            h = window.innerHeight;
        } else {
            let doc = document.documentElement || document.body;
            w = doc.clientWidth;
            h = doc.clientHeight;
        }
        container.style.width = "";
        container.style.height = String(Math.max(h * 0.95, h - 20)) + "px";
    }
    window.addEventListener("resize", adjust);
    adjust();

    let map = new L.Map(container);

    let layersControl = new L.Control.Layers();
    layersControl.addTo(map);

    let measureControl = new MeasureControl({
        showCoord: function (latlng) {
            let x = Math.round(latlng.lng * 10) / 10;
            let z = Math.round(latlng.lat * 10) / 10;
            let cx = Math.floor(x / 16);
            let cz = Math.floor(z / 16);
            return `<span>x:${x}</span><span>z:${z}</span><span>chunk:(${cx},${cz})</span>`;
        },
        showMeasure: function (start: L.LatLng, end: L.LatLng, map: L.Map) {
            let dst = Math.round(map.distance(start, end) * 10) / 10;
            let ang = Math.round(Math.atan2(start.lng - end.lng, end.lat - start.lat) / Math.PI * 180 * 10) / 10;
            return `<span>distance:${dst}</span><span>angle:${ang}\u00B0</span>`;
        }
    });
    measureControl.addTo(map);

    let markersControl = new MarkersControl<any>(null, null);

    let groups: Array<MapLayerConfig> = [
        {
            name: "v1",
            default: false,
            crs: {
                datumZoom: 5
            },
            baseLayer: new L.TileLayer(
                "../data/v1/{z}/{x},{y}.png",
                {
                    minNativeZoom: 0,
                    maxNativeZoom: 5,
                    minZoom: 0,
                    maxZoom: 6,
                    tileSize: 512,
                    bounds: [[-4800, -4800], [4800, 4800]],
                    attribution: "&copy; 2018-2019 Kedama"
                }
            ),
            overlays: {
            }
        },
        {
            name: "v2",
            default: false,
            crs: {
                datumZoom: 5
            },
            baseLayer: new L.TileLayer(
                "../data/v2/{z}/{x},{y}.png",
                {
                    minNativeZoom: 0,
                    maxNativeZoom: 5,
                    minZoom: 0,
                    maxZoom: 6,
                    tileSize: 512,
                    bounds: [[-4800, -4800], [4800, 4800]],
                    attribution: "&copy; 2018-2019 Kedama"
                }
            ),
            overlays: {
                marker: new BasicMarkersManager(markersControl, {
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
            baseLayer: new L.TileLayer(
                "https://kedama-map-tiles.jsw3286.eu.org/v3/z{z}/voxelmap/{x},{y}.png",
                {
                    bounds: [[-4096, -4096], [4096, 4096]],
                    tileSize: 256,
                    minNativeZoom: 1,
                    maxNativeZoom: 5,
                    minZoom: 1,
                    maxZoom: 6,
                }
            ),
            overlays: {
                marker: new YAKMMarkersManager(markersControl, {
                    url: "https://kedama-map-markers.jsw3286.eu.org/getMarkers?map=v3"
                }),
            }
        }
    ];
    bindLayer(layersControl, groups);
    map.setView([0, 0], 0);
    console.debug(map);
}



init(document.getElementById("map-container"));