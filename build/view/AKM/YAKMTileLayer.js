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
define(["require", "exports", "leaflet", "./Util"], function (require, exports, L, Util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * from https://kedama-map.jsw3286.eu.org/v3/js/main.js
     */
    function B62decode(raw) {
        var res = 0, length = raw.length, i, char;
        for (i = 0; i < length; i++) {
            char = raw.charCodeAt(i);
            if (char < 58) { // 0-9
                char = char - 48;
            }
            else if (char < 91) { // A-Z
                char = char - 29;
            }
            else { // a-z
                char = char - 87;
            }
            res += char * Math.pow(62, length - i - 1);
        }
        return res;
    }
    ;
    var YAKMTileLayer = /** @class */ (function (_super) {
        __extends(YAKMTileLayer, _super);
        function YAKMTileLayer(urlTemplate, options) {
            var _this = _super.call(this, urlTemplate, options) || this;
            L.Util.setOptions(_this, options);
            return _this;
        }
        YAKMTileLayer.prototype.onAdd = function (map) {
            var _this = this;
            var url = this.options.metadata.url;
            var style = this.options.metadata.style;
            Util_1.getJSON(url, function (data) {
                var data0 = data.styles[style];
                var offset = data0.offset;
                data0.offset = new L.Point(offset[0], offset[1]);
                var tiles = data0.tiles;
                for (var name_1 in tiles) {
                    tiles[name_1] = new Date(B62decode(tiles[name_1]));
                }
                _this.metaData = data0;
            }, console.warn, 5000);
            return _super.prototype.onAdd.call(this, map);
        };
        YAKMTileLayer.prototype.onRemove = function (map) {
            this.metaData = undefined;
            return _super.prototype.onRemove.call(this, map);
        };
        YAKMTileLayer.prototype.createTile = function (coords, done) {
            var _this = this;
            if (this.metaData) {
                var id = coords.x + "," + coords.y;
                var t = this.metaData.tiles[id];
                if (t) {
                    var tile = document.createElement('img');
                    L.DomEvent.on(tile, 'load', L.Util.bind(this._tileOnLoad, this, done, tile));
                    L.DomEvent.on(tile, 'error', L.Util.bind(this, this, done, tile));
                    if (this.options.crossOrigin || this.options.crossOrigin === '') {
                        tile.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
                    }
                    tile.alt = '';
                    tile.setAttribute('role', 'presentation');
                    tile.src = this._addTime(this.getTileUrl(coords), t);
                    return tile;
                }
                else {
                    var tile_1 = document.createElement('div');
                    setTimeout(function () {
                        _this._tileOnLoad.call(_this, done, tile_1);
                    }, 20);
                    return tile_1;
                }
            }
            return _super.prototype.createTile.call(this, coords, done);
        };
        YAKMTileLayer.prototype._addTime = function (url, t) {
            var s = url.split("?");
            url = s[0] + "?t=" + t.getTime();
            if (s.length > 1) {
                url += ("&" + s[1]);
            }
            return url;
        };
        return YAKMTileLayer;
    }(L.TileLayer));
    exports.YAKMTileLayer = YAKMTileLayer;
});
//# sourceMappingURL=YAKMTileLayer.js.map