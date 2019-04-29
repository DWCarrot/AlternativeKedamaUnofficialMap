define(["require", "exports", "./AKM/MinecraftCRS"], function (require, exports, MinecraftCRS_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getQuery() {
        var query = {};
        var s = location.search;
        if (s[0] == '?') {
            s.slice(1, s.length).split('&').forEach(function (part) {
                var kv = part.split('=');
                query[kv[0]] = kv[1];
            });
        }
        return query;
    }
    exports.getQuery = getQuery;
    function bindLayer(layerCtrl, cfgs) {
        var map = (layerCtrl._map); // layer control has propriety `_map`
        var defaultLayer;
        var defaultName = getQuery()["world"];
        cfgs.forEach(function (cfg) {
            cfg.baseLayer.on("add", function (event) {
                var overlays = cfg.overlays;
                setTimeout(function () {
                    for (var name_1 in overlays) {
                        var overlay = overlays[name_1];
                        layerCtrl.addOverlay(overlay, name_1);
                        map.addLayer(overlay);
                    }
                }, 1);
                map.options.crs = new MinecraftCRS_1.MinecraftCRS(cfg.crs);
            });
            cfg.baseLayer.on("remove", function (event) {
                var overlays = cfg.overlays;
                setTimeout(function () {
                    for (var name_2 in overlays) {
                        var overlay = overlays[name_2];
                        layerCtrl.removeLayer(overlay);
                        map.removeLayer(overlay);
                    }
                }, 1);
            });
            if (defaultName) {
                if (cfg.name == defaultName) {
                    defaultLayer = cfg.baseLayer;
                }
            }
            else {
                if (cfg.default) {
                    defaultLayer = cfg.baseLayer;
                }
            }
            layerCtrl.addBaseLayer(cfg.baseLayer, cfg.name);
        });
        if (!defaultLayer) {
            defaultLayer = cfgs[cfgs.length - 1].baseLayer;
        }
        setTimeout(function () {
            map.addLayer(defaultLayer);
        }, 10);
    }
    exports.bindLayer = bindLayer;
});
//# sourceMappingURL=config.js.map