var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define(["require", "exports", "leaflet"], function (require, exports, L) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * @deprecated
     */
    var BoundedTileLayer = /** @class */ (function (_super) {
        __extends(BoundedTileLayer, _super);
        function BoundedTileLayer(urlTemplate, options) {
            var _this = _super.call(this, urlTemplate, options) || this;
            _this.options = {
                bound: [[-2048, -2048], [2048, 2048]]
            };
            L.Util.setOptions(_this, options);
            _this.setOptions(_this.options);
            return _this;
        }
        BoundedTileLayer.prototype.setOptions = function (options) {
            var _this = this;
            if (this.options.bound && this.options.bound instanceof Array) {
                this.options.bound = new L.LatLngBounds(this.options.bound[0], this.options.bound[1]);
            }
            if (typeof (this.options.judge) !== "function") {
                if (this.options.bound) {
                    this.options.judge = function (bound) {
                        var _bound = _this.options.bound;
                        var latIntersects = (bound.getNorth() > _bound.getSouth()) && (bound.getSouth() < _bound.getNorth()), lngIntersects = (bound.getEast() > _bound.getWest()) && (bound.getWest() < _bound.getEast());
                        return latIntersects && lngIntersects;
                    };
                }
                if (this.options.radius) {
                    this.options.judge = function (bound) {
                        var r = _this.options.radius;
                        var x = Math.max(Math.abs(bound.getEast()), Math.abs(bound.getWest()));
                        var y = Math.max(Math.abs(bound.getSouth()), Math.abs(bound.getNorth()));
                        return x * x + y + y < r * r;
                    };
                }
            }
        };
        BoundedTileLayer.prototype.createTile = function (coords, done) {
            var map = this._map;
            var tsz = this.getTileSize();
            var sw = new L.Point(tsz.x * coords.x, tsz.y * coords.y);
            var ne = new L.Point(tsz.x * (coords.x + 1), tsz.y * (coords.y + 1));
            var bound = new L.LatLngBounds(map.unproject(sw, coords.z), map.unproject(ne, coords.z));
            if (this.options.judge(bound)) {
                return _super.prototype.createTile.call(this, coords, done);
            }
            else {
                var c = document.createElement("div");
                done(undefined, c);
                return c;
            }
        };
        return BoundedTileLayer;
    }(L.TileLayer));
    exports.BoundedTileLayer = BoundedTileLayer;
});
//# sourceMappingURL=BoundedTileLayer.js.map