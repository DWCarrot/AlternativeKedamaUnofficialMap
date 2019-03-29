define(["require", "exports", "leaflet"], function (require, exports, L) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var MinecraftCRS = /** @class */ (function () {
        function MinecraftCRS(options) {
            this.options = {
                scale: 1,
                offsetX: 0,
                offsetZ: 0,
                datumZoom: 0
            };
            L.Util.setOptions(this, options);
            L.Util.extend(this, L.CRS);
            var r = Math.pow(2, this.options.datumZoom) * this.options.scale;
            this.infinite = true;
            this.projection = L.Projection.LonLat;
            this.transformation = new L.Transformation(1 / r, -this.options.offsetX / r, 1 / r, -this.options.offsetZ / r);
            this.scale = function (zoom) {
                return Math.pow(2, zoom);
            };
            this.zoom = function (scale) {
                return Math.log(scale) / Math.LN2;
            };
            this.distance = function (latlng1, latlng2) {
                if (latlng1 instanceof Array) {
                    latlng1 = new L.LatLng(latlng1[0], latlng1[1]);
                }
                if (latlng2 instanceof Array) {
                    latlng2 = new L.LatLng(latlng2[0], latlng2[1]);
                }
                var dx = latlng2.lng - latlng1.lng, dy = latlng2.lat - latlng1.lat;
                return Math.sqrt(dx * dx + dy * dy);
            };
        }
        return MinecraftCRS;
    }());
    exports.MinecraftCRS = MinecraftCRS;
});
//# sourceMappingURL=MinecraftCRS.js.map