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
define(["require", "exports", "leaflet", "./Util", "./MarkersControl"], function (require, exports, L, Util_1, MarkersControl_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var BasicMarkersManager = /** @class */ (function (_super) {
        __extends(BasicMarkersManager, _super);
        function BasicMarkersManager(ctrl, options) {
            var _this = _super.call(this, ctrl) || this;
            _this.options = {
                url: "",
                icon: "",
                avatar: {
                    iconUrl: "https://minotar.net/helm/{user}",
                    iconSize: [24, 24],
                    iconAnchor: [11.5, 0],
                    popupAnchor: [0, 20],
                }
            };
            _this.icons = {};
            _this.markerData = [];
            _this.classId = null;
            _this._needRedraw = {};
            L.Util.setOptions(_this, options);
            _this.genPanel();
            return _this;
        }
        BasicMarkersManager.prototype.genPanel = function () {
            var mgr = this;
            this._panels = {
                add: new /** @class */ (function () {
                    function Add() {
                        this.id = 0;
                    }
                    Add.prototype.start = function (ctrl, map) {
                        this.callback = function (_ev) {
                            var ev = _ev;
                            this.stop(ctrl, map);
                            ctrl.complete();
                            var record = {
                                x: ev.latlng.lng,
                                z: ev.latlng.lat,
                                title: "point_" + String(this.id++),
                                icon: "",
                                description: ""
                            };
                            var marker = ctrl.addOne(record);
                            map.setView(ev.latlng, map.getMaxZoom());
                        };
                        map.on("click", this.callback, this);
                    };
                    Add.prototype.stop = function (ctrl, map) {
                        map.off("click", this.callback, this);
                        this.callback = undefined;
                    };
                    return Add;
                }()),
                remove: new /** @class */ (function () {
                    function Rmv() {
                    }
                    Rmv.prototype.start = function (ctrl, map) {
                        var _this = this;
                        this.callback = function (ev) {
                            _this.stop(ctrl, map);
                            ctrl.complete();
                            var marker = ev.target;
                            ctrl.removeOne(marker);
                        };
                        ctrl.getAllMarkers().forEach(function (marker) {
                            marker.on("click", this.callback, this);
                        }, this);
                    };
                    Rmv.prototype.stop = function (ctrl, map) {
                        ctrl.getAllMarkers().forEach(function (marker) {
                            marker.off("click", this.callback, this);
                        }, this);
                        this.callback = undefined;
                    };
                    return Rmv;
                }()),
                edit: new /** @class */ (function () {
                    function Edit() {
                    }
                    Edit.prototype.start = function (ctrl, map) {
                        this.callback = function (ev) {
                            this.stop(ctrl, map);
                            ctrl.complete();
                            var marker = ev.target;
                            this.editUI(ctrl.getData(marker), function (newData) {
                                ctrl.editOne(marker, newData);
                            });
                        };
                        ctrl.getAllMarkers().forEach(function (marker) {
                            marker.on("click", this.callback, this);
                        }, this);
                    };
                    Edit.prototype.stop = function (ctrl, map) {
                        ctrl.getAllMarkers().forEach(function (marker) {
                            marker.off("click", this.callback, this);
                        }, this);
                        this.callback = undefined;
                    };
                    /** @method */
                    Edit.prototype.editUI = function (oldData, callback) {
                        var v = JSON.stringify(oldData);
                        var s = prompt("marker-data", v);
                        try {
                            if (s === null || s === v)
                                return;
                            var d = JSON.parse(s);
                            setTimeout(callback, 200, d);
                        }
                        catch (e) {
                        }
                    };
                    return Edit;
                }()),
                revoke: new /** @class */ (function () {
                    function Rvk() {
                    }
                    Rvk.prototype.start = function (ctrl, map) {
                        ctrl.complete();
                        ctrl.revokeLast();
                    };
                    Rvk.prototype.stop = function (ctrl, map) {
                    };
                    return Rvk;
                }()),
                save: new /** @class */ (function () {
                    function Save() {
                    }
                    Save.prototype.start = function (ctrl, map) {
                        ctrl.complete();
                        var obj = ctrl.saveAll();
                        mgr.modifyRecords(obj.toAdd, obj.toRemove);
                    };
                    Save.prototype.stop = function (ctrl, map) {
                    };
                    return Save;
                }()),
                load: new /** @class */ (function () {
                    function Load() {
                    }
                    Load.prototype.start = function (ctrl, map) {
                        ctrl.complete();
                        ctrl.loadAll(mgr.getRecords());
                    };
                    Load.prototype.stop = function (ctrl, map) {
                    };
                    return Load;
                }()),
                search: new /** @class */ (function () {
                    function Search() {
                    }
                    Search.prototype.searchUI = function (list, ctrl) {
                        var h = setTimeout(function (list) {
                            var key = prompt("Search for (name):");
                            var res = new Array();
                            var show = "Result is:\n";
                            if (key) {
                                list.forEach(function (data) {
                                    if (data.title.indexOf(key) >= 0) {
                                        res.push(data);
                                        show += res.length + ".\t" + data.title + " (" + data.x + "," + data.z + ")\n";
                                    }
                                });
                            }
                            show += "=====================\n";
                            show += "Select index to jump to:";
                            var index = Number.parseInt(prompt(show));
                            if (index > 0 && index <= res.length) {
                                var data = res[index - 1];
                                var map = ctrl._map;
                                map.setView([data.z, data.x], map.getMaxZoom());
                            }
                        }, 10, list);
                        return function () {
                            clearTimeout(h);
                            console.debug('>> ', h);
                        };
                    };
                    Search.prototype.start = function (ctrl, map) {
                        ctrl.complete();
                        this._future = this.searchUI(ctrl.getAllData(), ctrl);
                    };
                    Search.prototype.stop = function (ctrl, map) {
                        if (this._future) {
                            this._future();
                            this._future = undefined;
                        }
                    };
                    return Search;
                }())
            };
        };
        BasicMarkersManager.prototype.initControl = function (ctrl, map) {
            var _this = this;
            ctrl.setPanel(this._panels);
            ctrl.setBuilder(this);
            map.on("markers-control:+load", this._loadCallback, this);
            setTimeout(function () { _this.load(_this.options.url, _this.options.icon, map); });
        };
        BasicMarkersManager.prototype.release = function (ctrl, map) {
            map.off("markers-control:+load", this._loadCallback, this);
            this.icons = {};
            this.markerData = [];
        };
        BasicMarkersManager.prototype._loadCallback = function () {
            setTimeout(function (that) {
                that._ctrl.loadAll(that.getRecords());
            }, 200, this);
        };
        BasicMarkersManager.prototype._setAvatar = function (uuid) {
            var options = {
                iconUrl: L.Util.template(this.options.avatar.iconUrl, { user: uuid }),
                iconSize: this.options.avatar.iconSize,
                iconAnchor: this.options.avatar.iconAnchor,
                popupAnchor: this.options.avatar.popupAnchor
            };
            return options;
        };
        BasicMarkersManager.prototype._setIcon = function (marker, iconName) {
            if (iconName) {
                if (iconName.startsWith("head:") && this.options.avatar) {
                    var uuid = iconName.slice("head:".length);
                    marker.setIcon(new L.Icon(this._setAvatar(uuid)));
                }
                else {
                    var icon = this.icons[iconName];
                    if (icon !== undefined) {
                        if (icon === null) { //when icon has not been loaded, record it for redrawing in load::$::$
                            if (!(iconName in this._needRedraw)) {
                                this._needRedraw[iconName] = new Array();
                            }
                            this._needRedraw[iconName].push(marker);
                        }
                        else {
                            marker.setIcon(icon);
                        }
                    }
                }
            }
        };
        BasicMarkersManager.prototype._getIcon = function (iconName, url) {
            var _this = this;
            Util_1.getJSON(url, function (data) {
                var ic = _this.icons[iconName] = new L.Icon(data);
                if (iconName in _this._needRedraw) { //redraw markers
                    _this._needRedraw[iconName].forEach(function (marker) {
                        marker.setIcon(ic);
                    });
                    console.debug("redraw markers[" + _this._needRedraw[iconName].length + "] with new icon \"" + iconName + "\"");
                    delete _this._needRedraw[iconName];
                }
            }, console.warn, 5000);
        };
        BasicMarkersManager.prototype.build = function (record) {
            var marker = new L.Marker(new L.LatLng(record.z, record.x)).bindPopup(Util_1.conditionalJoin("<div>", "<span class=\"yakm-marker-title\">" + record.title + "</span>", "</div>", "<div class=\"yakm-marker-coord\">" + record.x + "," + record.z + "</div>", Boolean(record.description), "<hr>", "<div class=\"yakm-marker-description\">" + record.description + "</div>", null));
            this._setIcon(marker, record.icon);
            return marker;
        };
        BasicMarkersManager.prototype.load = function (url, iconCfg, map) {
            var _this = this;
            this.icons = {};
            Util_1.getJSON(iconCfg, function (iconList) {
                for (var name_1 in iconList) {
                    _this.icons[name_1] = new L.Icon(iconList[name_1]);
                }
            }, console.warn, 2500);
            this.markerData = [];
            Util_1.getJSON(url, function (data) {
                _this.markerData = data;
                console.debug("load marker-data[" + _this.markerData.length + "] from \"" + url + "\"");
                setTimeout(function () { map.fire("markers-control:+load", null, false); }, 500);
            }, console.warn, 5000);
            return this;
        };
        BasicMarkersManager.prototype.getRecords = function () {
            return this.markerData;
        };
        BasicMarkersManager.prototype.modifyRecords = function (toAdd, toRemove, list) {
            //this._modifyRecords(this.markerData, toAdd, toRemove);
            console.table(toAdd);
            console.table(toRemove);
        };
        BasicMarkersManager.prototype._modifyRecords = function (data, toAdd, toRemove) {
            toAdd = toAdd.sort();
            toRemove = toRemove.sort();
            data = data.sort();
            this.markerData = new Array();
            var i, j, k;
            for (i = 0, j = 0, k = 0; i < data.length; ++i) {
                if (j < toRemove.length && data[i] == toRemove[j]) {
                    j++;
                    continue;
                }
                if (k < toAdd.length && data[i] == toAdd[k]) {
                    k++;
                }
                this.markerData.push(data[i]);
            }
            for (k; k < toAdd.length; ++k) {
                this.markerData.push(toAdd[k]);
            }
            return this.markerData;
        };
        BasicMarkersManager.prototype.getIcons = function () {
            var list = {};
            for (var name_2 in this.icons) {
                try {
                    var img = document.createElement("img");
                    img.src = this.icons[name_2].options.iconUrl;
                    list[name_2] = img;
                }
                catch (e) {
                    console.warn(e, this.icons[name_2]);
                }
            }
            return list;
        };
        return BasicMarkersManager;
    }(MarkersControl_1.MarkersControlLayer));
    exports.BasicMarkersManager = BasicMarkersManager;
});
//# sourceMappingURL=BasicMarkers.js.map