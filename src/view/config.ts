
import * as L from "leaflet"
import { MinecraftCRS, MinecraftCRSOptions } from "./AKM/MinecraftCRS"

export interface MapLayerConfig {
    name: string
    default: boolean
    crs: MinecraftCRSOptions
    baseLayer: L.GridLayer
    overlays: { [name: string]: L.Layer }
}

export interface KeyValue {
    [key:string]:string
}

export function getQuery() {
    let query: KeyValue = {};
    let s = location.search;
    if(s[0] == '?') {
        s.slice(1, s.length).split('&').forEach((part)=>{
            let kv = part.split('=');
            query[kv[0]] = kv[1];
        })
    }
    return query;
}

export function bindLayer(layerCtrl: L.Control.Layers, cfgs: Array<MapLayerConfig>) {
    let map = <L.Map>((<any>layerCtrl)._map);   // layer control has propriety `_map`
    let defaultLayer:L.GridLayer;
    let defaultName = getQuery()["world"];
    cfgs.forEach(function(cfg) {
        cfg.baseLayer.on("add", function (event) {
            let overlays = cfg.overlays;
            setTimeout(() => {
                for(let name in overlays) {
                    let overlay = overlays[name];
                    layerCtrl.addOverlay(overlay, name)
                    map.addLayer(overlay);
                }
            }, 1);
            map.options.crs = new MinecraftCRS(cfg.crs);
        });
        cfg.baseLayer.on("remove", function (event) {
            let overlays = cfg.overlays;
            setTimeout(() => {
                for(let name in overlays) {
                    let overlay = overlays[name];
                    layerCtrl.removeLayer(overlay);
                    map.removeLayer(overlay);
                } 
            }, 1);
        });
        if(defaultName) {
            if(cfg.name == defaultName) {
                defaultLayer = cfg.baseLayer;
            }
        } else {
            if(cfg.default) {
                defaultLayer = cfg.baseLayer;
            }
        }
        layerCtrl.addBaseLayer(cfg.baseLayer, cfg.name);
    });
    if(!defaultLayer) {
        defaultLayer = cfgs[cfgs.length - 1].baseLayer;
    }
    setTimeout(() => {
        map.addLayer(defaultLayer);
    }, 10);
}
