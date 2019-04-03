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
define(["require", "exports", "leaflet", "marked", "./Util", "./MarkersControl", "./DialogUI"], function (require, exports, L, MD, Util_1, MarkersControl_1, DialogUI_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //initial marked
    MD.setOptions({
        renderer: new MD.Renderer(),
        gfm: true,
        tables: true,
        breaks: false,
        pedantic: false,
        sanitize: false,
        smartLists: true,
        smartypants: false
    });
    var YAKMMarkersManager = /** @class */ (function (_super) {
        __extends(YAKMMarkersManager, _super);
        function YAKMMarkersManager(ctrl, options) {
            var _this = _super.call(this, ctrl) || this;
            _this.options = {
                url: "",
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
        YAKMMarkersManager.prototype.genPanel = function () {
            var mgr = this;
            var editUI = new DialogUI_1.EditUI({
                "x": {
                    toDom: function (value) {
                        var e = document.createElement("input");
                        e.type = "number";
                        e.value = value;
                        return e;
                    },
                    fromDom: function (e) {
                        return Number(e.value);
                    }
                },
                "z": {
                    toDom: function (value) {
                        var e = document.createElement("input");
                        e.type = "number";
                        e.value = value;
                        return e;
                    },
                    fromDom: function (e) {
                        return Number(e.value);
                    }
                },
                "category": {
                    toDom: function (value) {
                        var categories = {};
                        mgr._ctrl.getAllData().forEach(function (data) {
                            categories[data.category] = true;
                        });
                        var e = DialogUI_1.editableSelect(Object.keys(categories), value);
                        return e;
                    },
                    fromDom: function (e) {
                        return e.value;
                    }
                },
                "name": {
                    toDom: function (value) {
                        var e = document.createElement("input");
                        e.type = "text";
                        e.value = value;
                        return e;
                    },
                    fromDom: function (e) {
                        return e.value;
                    }
                },
                "icon": {
                    toDom: function (value) {
                        var e = DialogUI_1.editableSelect(Object.keys(mgr.icons), value);
                        return e;
                    },
                    fromDom: function (e) {
                        return e.value;
                    }
                },
                "description": {
                    toDom: function (value) {
                        var e = document.createElement("textarea");
                        e.value = value;
                        return e;
                    },
                    fromDom: function (e) {
                        return e.value;
                    }
                },
            });
            var searchUI = new DialogUI_1.SingleSearchUI("name", function (data) {
                return "\n                <div class=\"yakm_data-bref\">\n                    <span>" + data.name + "</span>\n                    <span>" + data.category + "</span>\n                    <span>" + data.x + "," + data.z + "</span>\n                </div>";
            });
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
                                name: "point_" + String(this.id++),
                                icon: "",
                                description: "",
                                uploader: NaN,
                                category: "",
                                timestamp: new Date()
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
                            editUI.open(ctrl.getData(marker), function (newData) {
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
                        editUI.close();
                        this.callback = undefined;
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
                        mgr.modifyRecords(obj.toAdd, obj.toRemove, ctrl.getAllData());
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
                    // searchUI(list: Array<YAKMMarkerData>, ctrl: MarkersControl<YAKMMarkerData>) {
                    //     let h = setTimeout(function (list: Array<YAKMMarkerData>) {
                    //         let key = prompt("Search for (name):");
                    //         let res = new Array<YAKMMarkerData>();
                    //         let show = "Result is:\n";
                    //         if (key) {
                    //             list.forEach(function (data) {
                    //                 if (data.name.indexOf(key) >= 0) {
                    //                     res.push(data);
                    //                     show += `${res.length}.\t${data.name} [${data.category}]\n`;
                    //                 }
                    //             });
                    //         }
                    //         show += "=====================\n";
                    //         show += "Select index to jump to:"
                    //         let index = Number.parseInt(prompt(show));
                    //         if (index > 0 && index <= res.length) {
                    //             let data = res[index - 1];
                    //             let map = (<L.Map>(<any>ctrl)._map);
                    //             map.setView([data.z, data.x], map.getMaxZoom());
                    //         }
                    //     }, 10, list);
                    //     return function () {
                    //         clearTimeout(h);
                    //         console.debug('>> ', h);
                    //     };
                    // }
                    Search.prototype.start = function (ctrl, map) {
                        searchUI.open(ctrl.getAllData(), function (data) {
                            map.setView(new L.LatLng(data.z, data.x), map.getMaxZoom());
                        }, function (event) {
                            ctrl.complete();
                        });
                    };
                    Search.prototype.stop = function (ctrl, map) {
                        searchUI.close();
                    };
                    return Search;
                }())
            };
        };
        YAKMMarkersManager.prototype.initControl = function (ctrl, map) {
            var _this = this;
            ctrl.setPanel(this._panels);
            ctrl.setBuilder(this);
            map.on("markers-control:+load", this._loadCallback, this);
            setTimeout(function () { _this.load(_this.options.url, map); });
        };
        YAKMMarkersManager.prototype.release = function (ctrl, map) {
            map.off("markers-control:+load", this._loadCallback, this);
            this.icons = {};
            this.markerData = [];
        };
        YAKMMarkersManager.prototype._loadCallback = function () {
            setTimeout(function (that) {
                that._ctrl.loadAll(that.getRecords());
            }, 200, this);
        };
        YAKMMarkersManager.prototype._setAvatar = function (uuid) {
            var options = {
                iconUrl: L.Util.template(this.options.avatar.iconUrl, { user: uuid }),
                iconSize: this.options.avatar.iconSize,
                iconAnchor: this.options.avatar.iconAnchor,
                popupAnchor: this.options.avatar.popupAnchor
            };
            return options;
        };
        YAKMMarkersManager.prototype._setIcon = function (marker, iconName) {
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
        YAKMMarkersManager.prototype._getIcon = function (iconName, url) {
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
        YAKMMarkersManager.prototype.mdprase = function (s) {
            if (s) {
                return MD(s);
            }
            return "";
        };
        YAKMMarkersManager.prototype.build = function (record) {
            var marker = new L.Marker(new L.LatLng(record.z, record.x)).bindPopup(Util_1.conditionalJoin("<div>", "<span class=\"yakm-marker-title\">" + record.name + "</span>", "<span class=\"yakm-marker-category\">" + record.category + "</span>", "</div>", "<div class=\"yakm-marker-coord\">" + record.x + "," + record.z + "</div>", Boolean(record.description), "<hr>", "<div class=\"yakm-marker-description\">" + this.mdprase(record.description) + "</div>", null));
            this._setIcon(marker, record.icon);
            return marker;
        };
        YAKMMarkersManager.prototype._changeMarker = function (marker, category) {
            //notice that `YAKMMarkerData0` can be force-cast to `YAKMMarkerData`
            marker.category = category;
            marker.timestamp = new Date(marker.timestamp);
            //to...reduce memory consumption?
            return marker;
        };
        YAKMMarkersManager.prototype.load = function (url, map) {
            var _this = this;
            if (this.icons) {
                this.icons = {};
            }
            if (this.markerData.length > 0) {
                this.markerData = new Array();
            }
            Util_1.getJSON(url, function (data) {
                var iconCfgs = data.icons;
                var iconNum = 0;
                for (var iconName in iconCfgs) { //load icons
                    ++iconNum;
                    if (!(iconName in _this.icons)) { //exclude existed icons
                        _this.icons[iconName] = null;
                        _this._getIcon(iconName, iconCfgs[iconName]);
                    }
                }
                var markers = data.markers;
                var _loop_1 = function (category) {
                    markers[category].forEach(function (m) {
                        this.markerData.push(this._changeMarker(m, category));
                    }, _this);
                };
                for (var category in markers) {
                    _loop_1(category);
                }
                console.debug("load marker-data[" + _this.markerData.length + "] and prepare icons[" + iconNum + "] from \"" + url + "\"");
                setTimeout(function () { map.fire("markers-control:+load", null, false); }, 500);
            }, console.warn, 5000);
            return this;
        };
        YAKMMarkersManager.prototype.getRecords = function () {
            return this.markerData;
        };
        YAKMMarkersManager.prototype.modifyRecords = function (toAdd, toRemove, list) {
            //this._modifyRecords(this.markerData, toAdd, toRemove);
            console.table(toAdd);
            console.table(toRemove);
        };
        YAKMMarkersManager.prototype._modifyRecords = function (data, toAdd, toRemove) {
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
        YAKMMarkersManager.prototype.getIcons = function () {
            var list = {};
            for (var name_1 in this.icons) {
                try {
                    var img = document.createElement("img");
                    img.src = this.icons[name_1].options.iconUrl;
                    list[name_1] = img;
                }
                catch (e) {
                    console.warn(e, this.icons[name_1]);
                }
            }
            return list;
        };
        return YAKMMarkersManager;
    }(MarkersControl_1.MarkersControlLayer));
    exports.YAKMMarkersManager = YAKMMarkersManager;
});
//# sourceMappingURL=YAKMMarkers.js.map