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
    var MarkersControl = /** @class */ (function (_super) {
        __extends(MarkersControl, _super);
        function MarkersControl(builder, panel, options) {
            var _this = _super.call(this, options) || this;
            _this.options = {
                position: "topright",
            };
            L.Util.setOptions(_this, options);
            _this._builder = builder;
            _this._panels = panel;
            _this._step = [];
            _this._addSet = new Set();
            _this._rmvSet = new Set();
            _this._tDM = new Map();
            return _this;
        }
        MarkersControl.prototype.setBuilder = function (builder) {
            var list = this.clearAll();
            this._builder = builder;
            if (list.length > 0) {
                this.loadAll(list);
            }
        };
        /**
         *
         * @param name <string> name of panel to modify; <MarkersControlPanel> the whole panel to replace
         * @param panel panelItem of the specific panel `name`; ignored when `name` is a whole panel
         */
        MarkersControl.prototype.setPanel = function (name, panel) {
            if (this._map)
                this._removePanel(this._map, this._container);
            if (typeof (name) === "string") {
                if (panel === undefined)
                    delete this._panels[name];
                else
                    this._panels[name] = panel;
            }
            else {
                this._panels = name;
            }
            if (this._map)
                this._addPanel(this._map, this._container);
        };
        MarkersControl.prototype.onAdd = function (map) {
            var container = L.DomUtil.create("div", "leaflet-bar leaflet-control leaflet-control-markers");
            this._addPanel(map, container);
            this._handleView(map);
            return this._container = container;
        };
        MarkersControl.prototype.onRemove = function (map) {
            this.clearAll();
            this._removePanel(map, this._container);
        };
        /**
         * reset the specific panel button (without call panel `MarkersControlPanelItem<T>.stop()`)
         * @param panel panel name ; panel itself; default is the current one
         */
        MarkersControl.prototype.complete = function (panel) {
            if (this._sel && (panel === undefined || panel === this._sel.name || panel === this._panels[this._sel.name])) {
                this._sel.classList.remove("leaflet-control-markers-panel-on");
                this._sel = undefined;
            }
        };
        MarkersControl.prototype.loadAll = function (list) {
            if (this._tDM.size > 0)
                this.clearAll();
            list.forEach(function (record) {
                var marker = this._builder.build(record);
                marker._akm_data = record;
                this._tDM.set(record, marker);
                if (this._map) {
                    this._map.addLayer(marker);
                }
                else {
                    this._rmvSet.delete(marker);
                    this._addSet.add(marker);
                }
            }, this);
        };
        /**
         *
         *  @returns Array<T> | undefined
         */
        MarkersControl.prototype.clearAll = function () {
            var rest = new Array();
            this._tDM.forEach(function (marker, record) {
                if (this._map) {
                    this._map.removeLayer(marker);
                }
                else {
                    if (!this._addSet.delete(marker)) {
                        this._rmvSet.add(marker);
                    }
                }
                rest.push(record);
            }, this);
            this._tDM.clear();
            this._step.splice(0, this._step.length);
            return rest;
        };
        /**
         *
         * @returns {toAdd: Array<T>, toRemove: Array<T>} | undefined
         */
        MarkersControl.prototype.saveAll = function () {
            var dataSet = new Map();
            this._step.forEach(function (s) {
                var operation = s.o;
                var record = s.d;
                if ((operation & 2 /* rmv */) > 0) {
                    if (!dataSet.delete(record)) {
                        dataSet.set(record, 2 /* rmv */);
                    }
                }
                else {
                    if ((operation & 1 /* add */) > 0) {
                        dataSet.set(record, 1 /* add */);
                    }
                }
            }, this);
            var toAdd = new Array();
            var toRemove = new Array();
            dataSet.forEach(function (operation, data) {
                if (operation === 1 /* add */) {
                    toAdd.push(data);
                }
                else {
                    toRemove.push(data);
                }
            }, this);
            dataSet.clear();
            this._step.splice(0, this._step.length);
            return { toAdd: toAdd, toRemove: toRemove };
        };
        MarkersControl.prototype.revokeLast = function () {
            for (var s = this._step.pop(); s !== undefined; s = this._step.pop()) {
                var operation = s.o;
                var record = s.d;
                if ((operation & 2 /* rmv */) > 0) {
                    var m = this._builder.build(record);
                    this._addToMap(m, record);
                }
                else {
                    if ((operation & 1 /* add */) > 0) {
                        var m = this._tDM.get(record);
                        this._rmvFromMap(m);
                    }
                }
                if ((operation & 16 /* edit */) === 0)
                    break;
            }
        };
        /**
         *
         * @returns L.Marker [marker of `record`] | undefined
         */
        MarkersControl.prototype.addOne = function (record) {
            var m = this._builder.build(record);
            this._addToMap(m, record, 1 /* add */);
            return m;
        };
        /**
         *
         * @returns L.Marker [marker itself] | undefined
         */
        MarkersControl.prototype.removeOne = function (layer) {
            this._rmvFromMap(layer, 2 /* rmv */);
            return layer;
        };
        /**
         *
         * @returns L.Marker [marker of new `record`] | undefined
         */
        MarkersControl.prototype.editOne = function (layer, record) {
            this._rmvFromMap(layer, 18 /* edit_rmv */);
            var m = this._builder.build(record);
            this._addToMap(m, record, 17 /* edit_add */);
            return m;
        };
        MarkersControl.prototype.getData = function (layer) {
            return layer._akm_data;
        };
        MarkersControl.prototype.getAllData = function () {
            var list = new Array();
            this._tDM.forEach(function (marker, record) {
                list.push(record);
            }, this);
            return list;
        };
        MarkersControl.prototype.getMarker = function (record) {
            return this._tDM.get(record);
        };
        MarkersControl.prototype.getAllMarkers = function () {
            var list = new Array();
            this._tDM.forEach(function (marker, record) {
                list.push(marker);
            }, this);
            return list;
        };
        MarkersControl.prototype._handleView = function (map) {
            this._rmvSet.forEach(function (m) {
                map.removeLayer(m);
            }, this);
            this._rmvSet.clear();
            this._addSet.forEach(function (m) {
                map.addLayer(m);
            }, this);
            this._addSet.clear();
        };
        MarkersControl.prototype._addToMap = function (marker, record, operation) {
            if (this._tDM.has(record))
                throw new Util_1.Exception("InvalidArgumentException", "record has existed", { record: record });
            marker._akm_data = record;
            this._tDM.set(record, marker);
            if (this._map) {
                this._map.addLayer(marker);
            }
            else {
                this._rmvSet.delete(marker);
                this._addSet.add(marker);
            }
            if (operation !== undefined) {
                this._step.push({ o: operation, d: record });
            }
        };
        MarkersControl.prototype._rmvFromMap = function (marker, operation) {
            var record = marker._akm_data;
            if (record === undefined)
                return;
            if (this._tDM.get(record) !== marker)
                return;
            this._tDM.delete(record);
            if (this._map) {
                this._map.removeLayer(marker);
            }
            else {
                if (!this._addSet.delete(marker))
                    this._rmvSet.add(marker);
            }
            if (operation !== undefined) {
                this._step.push({ o: operation, d: record });
            }
            return;
        };
        MarkersControl.prototype._panelCallback = function (ev) {
            L.DomEvent.stopPropagation(ev);
            var a = ev.target;
            var cancel = (this._sel === a);
            if (this._sel) {
                this._sel.classList.remove("leaflet-control-markers-panel-on");
                var op = this._panels[this._sel.name];
                this._sel = undefined;
                op.stop(this, this._map);
            }
            if (!cancel) {
                a.classList.add("leaflet-control-markers-panel-on");
                this._sel = a;
                var p = this._panels[this._sel.name];
                p.start(this, this._map);
            }
        };
        MarkersControl.prototype._addPanel = function (map, container) {
            for (var name_1 in this._panels) {
                var item = this._panels[name_1];
                var a = L.DomUtil.create("a", "leaflet-control-markers-panel leaflet-control-markers-" + name_1, container);
                a.href = "#";
                a.name = name_1;
                if (item.tip !== undefined)
                    a.title = item.tip;
                else
                    a.title = name_1;
                if (item.icon !== undefined)
                    a.style.backgroundImage = "url(" + Util_1.getAbsoluteUrl(item.icon) + ")";
                L.DomEvent.on(a, "click", this._panelCallback, this);
            }
        };
        MarkersControl.prototype._removePanel = function (map, container) {
            if (this._sel) {
                var p = this._panels[this._sel.name];
                this._sel = undefined;
                p.stop(this, this._map);
            }
            for (var i = 0, ls = container.children; i < ls.length; ++i) {
                var a = ls[i];
                L.DomEvent.off(a, "click", this._panelCallback, this);
            }
        };
        return MarkersControl;
    }(L.Control));
    exports.MarkersControl = MarkersControl;
    var MarkersControlLayer = /** @class */ (function (_super) {
        __extends(MarkersControlLayer, _super);
        function MarkersControlLayer(ctrl) {
            var _this = _super.call(this) || this;
            _this._ctrl = ctrl;
            return _this;
        }
        MarkersControlLayer.prototype.onAdd = function (map) {
            this.initControl(this._ctrl, map);
            this._ctrl.addTo(map);
            // map.on("markers-control:+load", this.loadAll, this);
            // map.on("markers-control:+save", this.saveAll, this);
            // map.on("markers-control:+clear", this.clearAll, this);
            return this;
        };
        MarkersControlLayer.prototype.onRemove = function (map) {
            // map.off("markers-control:+load", this.loadAll, this);
            // map.off("markers-control:+save", this.saveAll, this);
            // map.off("markers-control:+clear", this.clearAll, this);
            this._ctrl.remove();
            this.release(this._ctrl, map);
            return this;
        };
        return MarkersControlLayer;
    }(L.Layer));
    exports.MarkersControlLayer = MarkersControlLayer;
    /** panel examples */
    var MarkersControlPanelAdd = /** @class */ (function () {
        function MarkersControlPanelAdd() {
        }
        /**
         * @interface createMarker(latlng: L.LatLng) create empty marker data with Latlng
         */
        MarkersControlPanelAdd.prototype.createMarker = function (latlng) {
            return {};
        };
        MarkersControlPanelAdd.prototype.start = function (ctrl, map) {
            this._callback = function (_ev) {
                var ev = _ev;
                this.stop(ctrl, map);
                ctrl.complete();
                var record = this.createMarker(ev.latlng);
                ctrl.addOne(record);
                map.setView(ev.latlng, map.getMaxZoom());
            };
            map.on("click", this._callback, this);
        };
        MarkersControlPanelAdd.prototype.stop = function (ctrl, map) {
            map.off("click", this._callback, this);
            this._callback = undefined;
        };
        return MarkersControlPanelAdd;
    }());
    var MarkersControlPanelRmv = /** @class */ (function () {
        function MarkersControlPanelRmv() {
        }
        MarkersControlPanelRmv.prototype.start = function (ctrl, map) {
            var _this = this;
            this._callback = function (_ev) {
                var ev = _ev;
                _this.stop(ctrl, map);
                ctrl.complete();
                var marker = ev.target;
                ctrl.removeOne(marker);
            };
            ctrl.getAllMarkers().forEach(function (marker) {
                marker.on("click", this._callback, this);
            }, this);
        };
        MarkersControlPanelRmv.prototype.stop = function (ctrl, map) {
            ctrl.getAllMarkers().forEach(function (marker) {
                marker.off("click", this._callback, this);
            }, this);
            this._callback = undefined;
        };
        return MarkersControlPanelRmv;
    }());
    var MarkersControlPanelEdit = /** @class */ (function () {
        function MarkersControlPanelEdit() {
        }
        MarkersControlPanelEdit.prototype.editDataUI = function (oldData, callback) {
            return;
        };
        MarkersControlPanelEdit.prototype.start = function (ctrl, map) {
            this._callback = function (ev) {
                this.stop(ctrl, map);
                ctrl.complete();
                var marker = ev.target;
                var data = ctrl.getData(marker);
                this.editDataUI(data, function (newData) {
                    if (newData) {
                        ctrl.editOne(marker, newData);
                    }
                });
            };
            ctrl.getAllMarkers().forEach(function (marker) {
                marker.on("click", this._callback, this);
            }, this);
        };
        MarkersControlPanelEdit.prototype.stop = function (ctrl, map) {
            ctrl.getAllMarkers().forEach(function (marker) {
                marker.off("click", this._callback, this);
            }, this);
            this._callback = undefined;
        };
        return MarkersControlPanelEdit;
    }());
    var MarkersControlPanelRvk = /** @class */ (function () {
        function MarkersControlPanelRvk() {
        }
        MarkersControlPanelRvk.prototype.start = function (ctrl, map) {
            ctrl.complete();
            ctrl.revokeLast();
        };
        MarkersControlPanelRvk.prototype.stop = function (ctrl, map) {
        };
        return MarkersControlPanelRvk;
    }());
    var MarkersControlPanelSave = /** @class */ (function () {
        function MarkersControlPanelSave() {
        }
        MarkersControlPanelSave.prototype.start = function (ctrl, map) {
            ctrl.complete();
            ctrl.saveAll();
        };
        MarkersControlPanelSave.prototype.stop = function (ctrl, map) {
        };
        return MarkersControlPanelSave;
    }());
    var MarkersControlPanelLoad = /** @class */ (function () {
        function MarkersControlPanelLoad() {
        }
        MarkersControlPanelLoad.prototype.start = function (ctrl, map) {
            ctrl.complete();
            ctrl.loadAll(this.mgr.getRecords());
        };
        MarkersControlPanelLoad.prototype.stop = function (ctrl, map) {
        };
        return MarkersControlPanelLoad;
    }());
    var MarkersControlPanelSearch = /** @class */ (function () {
        function MarkersControlPanelSearch() {
        }
        MarkersControlPanelSearch.prototype.start = function (ctrl, map) {
            ctrl.complete();
        };
        MarkersControlPanelSearch.prototype.stop = function (ctrl, map) {
        };
        return MarkersControlPanelSearch;
    }());
});
//# sourceMappingURL=MarkersControl.js.map