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
define(["require", "exports", "leaflet", "./Util"], function (require, exports, L, U) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var MeasureControl = /** @class */ (function (_super) {
        __extends(MeasureControl, _super);
        function MeasureControl(options) {
            var _this = this;
            options = U.setOptions({
                position: "bottomleft",
                controlTip: "measure",
                clearTip: "clear",
                showCoord: function (latlng) { return "<span>lat:" + latlng.lat + "</span><span>lng:" + latlng.lng + "</span>"; },
                showMeasure: function (start, end) { return "(" + start.lat + "," + start.lng + ")-(" + end.lat + "," + end.lng + ")"; },
                showPoint: function (latLng, map) { return "(" + latLng.lng + "," + latLng.lat + ")"; },
            }, options);
            _this = _super.call(this, options) || this;
            return _this;
        }
        MeasureControl.prototype.onAdd = function (map) {
            this._map = map;
            var container = L.DomUtil.create("div", "leaflet-control-measure leaflet-control");
            this._addpointer(map, container);
            this._addMeasure(map, container);
            this._addClickTip(map);
            return this._container = container;
        };
        MeasureControl.prototype.onRemove = function (map) {
            this._rmvClickTip(map);
            this._rmvMeasure(map);
            this._rmvPointer(map);
            this._map = undefined;
        };
        MeasureControl.prototype._addpointer = function (map, container) {
            var span = L.DomUtil.create("div", "leaflet-control-measure-pointer", container);
            this._cbPointer = function (_ev) {
                var ev = _ev;
                span.innerHTML = this.options.showCoord(ev.latlng, map);
            };
            map.on("mousemove", this._cbPointer, this);
            return span;
        };
        MeasureControl.prototype._rmvPointer = function (map) {
            if (this._cbPointer) {
                map.off("mousemove", this._cbPointer, this);
                this._cbPointer = undefined;
            }
        };
        MeasureControl.prototype._addMeasure = function (map, container) {
            var _this = this;
            var a = L.DomUtil.create("a", "leaflet-control-measure-control leaflet-control-measure-control-default", container);
            a.href = "#";
            a.title = this.options.controlTip;
            a.innerHTML = "\u25C8";
            L.DomUtil.toBack(a);
            var span = L.DomUtil.create("div", "leaflet-control-measure-measure", container);
            span.style.display = "none";
            this._cbMeasureCtrl = function (_ev) {
                var ev = _ev;
                L.DomEvent.stopPropagation(ev);
                if (_this._cbMeasureShow) {
                    map.off("mousemove", _this._cbMeasureShow, _this);
                    map.off("click", _this._cbMeasureShow, _this);
                    _this._cbMeasureShow = undefined;
                }
                span.innerHTML = "";
                for (var i = 1, ls = container.children; i < ls.length; ++i) {
                    var aClear = ls[i];
                    if (aClear.tagName.toLowerCase() === "a") {
                        aClear.remove();
                        map.removeLayer(_this._showRange);
                        _this._showRange = undefined;
                        map.removeLayer(_this._showDirection);
                        _this._showDirection = undefined;
                        break;
                    }
                }
                var a = ev.target;
                if (_this._cbMeasureSet) {
                    map.off("click", _this._cbMeasureSet, _this);
                    _this._cbMeasureSet = undefined;
                    a.classList.remove("leaflet-control-measure-control-down");
                }
                else {
                    a.classList.add("leaflet-control-measure-control-down");
                    _this._cbMeasureSet = function (_ev) {
                        var ev = _ev;
                        //TODO: stopPropagation ev 
                        a.classList.remove("leaflet-control-measure-control-down");
                        map.off("click", _this._cbMeasureSet, _this);
                        _this._cbMeasureSet = undefined;
                        var startP = ev.latlng;
                        _this._cbMeasureShow = function (_ev) {
                            var ev = _ev;
                            if (ev.type === "click") {
                                map.off("mousemove", _this._cbMeasureShow, _this);
                                map.off("click", _this._cbMeasureShow, _this);
                                _this._cbMeasureShow = undefined;
                                /// add clear button
                                var aClear_1 = L.DomUtil.create("a", "leaflet-control-measure-clean", container);
                                var _cbClear_1 = function (ev) {
                                    //TODO: stopPropagation ev 
                                    aClear_1.removeEventListener("click", _cbClear_1);
                                    aClear_1.remove();
                                    span.innerHTML = "";
                                    //TODO: remove
                                    map.removeLayer(_this._showRange);
                                    _this._showRange = undefined;
                                    map.removeLayer(_this._showDirection);
                                    _this._showDirection = undefined;
                                    span.style.display = "none";
                                };
                                aClear_1.href = "#";
                                aClear_1.title = _this.options.clearTip;
                                aClear_1.innerHTML = "\u2716";
                                aClear_1.addEventListener("click", _cbClear_1);
                            }
                            else {
                                var endP = ev.latlng;
                                span.innerHTML = _this.options.showMeasure(startP, endP, map);
                                //TODO: change graphic
                                _this._showRange.setRadius(map.distance(startP, endP));
                                _this._showDirection.setLatLngs([startP, endP]);
                            }
                        };
                        map.on("click", _this._cbMeasureShow, _this);
                        map.on("mousemove", _this._cbMeasureShow, _this);
                        //TODO: add graphic
                        _this._showRange = new L.Circle(startP);
                        map.addLayer(_this._showRange);
                        _this._showDirection = new L.Polyline([startP]);
                        map.addLayer(_this._showDirection);
                        span.style.display = "";
                    };
                    map.on("click", _this._cbMeasureSet, _this);
                }
            };
            a.addEventListener("click", this._cbMeasureCtrl);
            var b;
        };
        MeasureControl.prototype._rmvMeasure = function (map) {
            var a;
            for (var i = 0, ls = this._container.children; i < ls.length; ++i) {
                a = ls[i];
                if (a.tagName.toLowerCase() === "a") {
                    break;
                }
                else {
                    a = undefined;
                }
            }
            if (this._cbMeasureCtrl) {
                a.removeEventListener("click", this._cbMeasureCtrl);
                this._cbMeasureCtrl = undefined;
            }
            if (this._cbMeasureSet) {
                map.off("click", this._cbMeasureSet, this);
                this._cbMeasureSet = undefined;
            }
            if (this._cbMeasureShow) {
                map.off("mousemove", this._cbMeasureShow, this);
                this._cbMeasureShow = undefined;
            }
        };
        MeasureControl.prototype._addClickTip = function (map) {
            if (!this._cbTooltipShow) {
                this._tooltip = new L.Tooltip();
                this._cbTooltipShow = function (_ev) {
                    var ev = _ev;
                    if (ev.type === "dblclick") {
                        map.removeLayer(this._tooltip);
                    }
                    else {
                        var latlng = ev.latlng;
                        this._tooltip.setContent(this.options.showPoint(latlng)).setLatLng(latlng);
                        map.addLayer(this._tooltip);
                    }
                };
                map.on("click", this._cbTooltipShow, this);
                map.on("dblclick", this._cbTooltipShow, this);
            }
        };
        MeasureControl.prototype._rmvClickTip = function (map) {
            if (this._cbTooltipShow) {
                map.off("dblclick", this._cbTooltipShow, this);
                map.off("click", this._cbTooltipShow, this);
                this._cbTooltipShow = undefined;
                if (this._tooltip) {
                    map.removeLayer(this._tooltip);
                    this._tooltip = undefined;
                }
            }
        };
        return MeasureControl;
    }(L.Control));
    exports.MeasureControl = MeasureControl;
});
//# sourceMappingURL=MeasureControl.js.map