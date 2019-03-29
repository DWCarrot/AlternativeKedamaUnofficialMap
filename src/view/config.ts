
import * as L from "leaflet"
import { MinecraftCRS, MinecraftCRSOptions } from "./AKM/MinecraftCRS"

export interface MapLayerConfig {
    name: string
    default: boolean
    crs: MinecraftCRSOptions
    baseLayer: L.GridLayer
    overlays: { [name: string]: L.Layer }
}

export function bindLayer(layerCtrl: L.Control.Layers, cfgs: Array<MapLayerConfig>) {
    let map = <L.Map>((<any>layerCtrl)._map);   // layer control has propriety `_map`
    let defaultLayer:L.GridLayer;
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
        if(cfg.default) {
            defaultLayer = cfg.baseLayer;
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
