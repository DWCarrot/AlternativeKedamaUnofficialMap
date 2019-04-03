import * as L from "leaflet"
import * as MD from "marked"
import * as $ from "jquery"
import { setOptions, loadStyle, conditionalJoin, getJSON } from "./Util"
import { MarkerData, MarkersControl, MarkersControlLayer, MarkersControlLayerOptions, MarkersControlPanel, MarkerDataManager } from "./MarkersControl"
import { EditUI, SingleSearchUI, editableSelect } from "./DialogUI"

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

export interface YAKMMarkerData extends YAKMMarkerData0 {
    category: string,
    timestamp: Date
}

export interface YAKMMarkersManagerOptions extends MarkersControlLayerOptions {
    url: string,
    avatar?: L.IconOptions;
}

interface YAKMMarkerData0 extends MarkerData {
    x: number,
    z: number,
    name: string,
    icon: string,
    description: string,
    uploader: number,
    timestamp: string | Date
}

interface YAKMMarkerDataFull {
    icons: {
        [icon: string]: string
    },
    markers: {
        [category: string]: Array<YAKMMarkerData0>
    }
}



export class YAKMMarkersManager extends MarkersControlLayer<YAKMMarkerData> {

    options: YAKMMarkersManagerOptions = {
        url: "",
        avatar: {
            iconUrl: "https://minotar.net/helm/{user}",
            iconSize: [24, 24],
            iconAnchor: [11.5, 0],
            popupAnchor: [0, 20],
        }
    }

    icons: { [name: string]: L.Icon } = {};

    markerData: Array<YAKMMarkerData> = [];

    classId: string = null;

    protected _needRedraw: { [icon: string]: Array<L.Marker> } = {};

    protected _panels: MarkersControlPanel<YAKMMarkerData>;

    constructor(ctrl: MarkersControl<YAKMMarkerData>, options?: YAKMMarkersManagerOptions) {
        super(ctrl);
        L.Util.setOptions(this, options);
        this.genPanel();
    }

    protected genPanel() {
        let mgr = <YAKMMarkersManager>this;
        let editUI = new EditUI<YAKMMarkerData>({
            "x": {
                toDom(value) {
                    let e = document.createElement("input");
                    e.type = "number";
                    e.value = value;
                    return e;
                },
                fromDom(e) {
                    return Number((<HTMLInputElement>e).value);
                }
            },
            "z": {
                toDom(value) {
                    let e = document.createElement("input");
                    e.type = "number";
                    e.value = value;
                    return e;
                },
                fromDom(e) {
                    return Number((<HTMLInputElement>e).value);
                }
            },
            "category": {
                toDom(value) {
                    let categories: { [name: string]: boolean } = {};
                    mgr._ctrl.getAllData().forEach(function (data) {
                        categories[data.category] = true;
                    });
                    let e = editableSelect(Object.keys(categories), value);
                    return e;
                },
                fromDom(e) {
                    return (<HTMLSelectElement>e).value;
                }
            },
            "name": {
                toDom(value) {
                    let e = document.createElement("input");
                    e.type = "text";
                    e.value = value;
                    return e;
                },
                fromDom(e) {
                    return (<HTMLInputElement>e).value;
                }
            },
            "icon": {
                toDom(value) {
                    let e = editableSelect(Object.keys(mgr.icons), value);
                    return e;
                },
                fromDom(e) {
                    return (<HTMLSelectElement>e).value;
                }
            },
            "description": {
                toDom(value) {
                    let e = document.createElement("textarea");
                    e.value = value;
                    return e;
                },
                fromDom(e) {
                    return (<HTMLTextAreaElement>e).value;
                }
            },
        });
        let searchUI = new SingleSearchUI<YAKMMarkerData>("name", function(data) {
            return `
                <div class="yakm_data-bref">
                    <span>${data.name}</span>
                    <span>${data.category}</span>
                    <span>${data.x},${data.z}</span>
                </div>`;
        })
        this._panels = {
            add: new class Add {
                id: number = 0;
                callback: (this: this, ev: L.LeafletEvent) => void;
                start(ctrl: MarkersControl<YAKMMarkerData>, map: L.Map) {
                    this.callback = function (_ev) {
                        let ev = <L.LeafletMouseEvent>_ev;
                        this.stop(ctrl, map);
                        ctrl.complete();
                        let record: YAKMMarkerData = {
                            x: ev.latlng.lng,
                            z: ev.latlng.lat,
                            name: "point_" + String(this.id++),
                            icon: "",
                            description: "",
                            uploader: NaN,
                            category: "",
                            timestamp: new Date()
                        }
                        let marker = ctrl.addOne(record);
                        map.setView(ev.latlng, map.getMaxZoom());
                    }
                    map.on("click", this.callback, this);
                }
                stop(ctrl: MarkersControl<YAKMMarkerData>, map: L.Map) {
                    map.off("click", this.callback, this);
                    this.callback = undefined;
                }
            },

            remove: new class Rmv {
                callback: (this: Rmv, ev: L.LeafletEvent) => void
                start(ctrl: MarkersControl<YAKMMarkerData>, map: L.Map) {
                    this.callback = (ev) => {
                        this.stop(ctrl, map);
                        ctrl.complete();
                        let marker = <L.Marker>ev.target;
                        ctrl.removeOne(marker);
                    }
                    ctrl.getAllMarkers().forEach(function (this: Rmv, marker) {
                        marker.on("click", this.callback, this);
                    }, this);
                }
                stop(ctrl: MarkersControl<YAKMMarkerData>, map: L.Map) {
                    ctrl.getAllMarkers().forEach(function (this: Rmv, marker) {
                        marker.off("click", this.callback, this);
                    }, this);
                    this.callback = undefined;
                }
            },

            edit: new class Edit {
                callback: (this: Edit, ev: L.LeafletEvent) => void
                start(ctrl: MarkersControl<YAKMMarkerData>, map: L.Map) {
                    this.callback = function (this: Edit, ev) {
                        this.stop(ctrl, map);
                        ctrl.complete();
                        let marker = <L.Marker>ev.target;
                        editUI.open(ctrl.getData(marker), (newData) => {
                            ctrl.editOne(marker, newData);
                        });
                    }
                    ctrl.getAllMarkers().forEach(function (this: Edit, marker) {
                        marker.on("click", this.callback, this);
                    }, this);
                }
                stop(ctrl: MarkersControl<YAKMMarkerData>, map: L.Map) {
                    ctrl.getAllMarkers().forEach(function (this: Edit, marker) {
                        marker.off("click", this.callback, this);
                    }, this);
                    editUI.close();
                    this.callback = undefined;
                }
                // /** @method */
                // editUI(oldData: YAKMMarkerData, callback: (newData: YAKMMarkerData) => void) {
                //     let v = JSON.stringify(oldData);
                //     let s = prompt("marker-data", v);
                //     try {
                //         if (s === null || s === v)
                //             return;
                //         let d = <YAKMMarkerData0>JSON.parse(s);
                //         (<YAKMMarkerData>d).timestamp = new Date(d.timestamp);
                //         setTimeout(callback, 200, d);
                //     } catch (e) {

                //     }
                // }
            },

            revoke: new class Rvk {
                start(ctrl: MarkersControl<YAKMMarkerData>, map: L.Map) {
                    ctrl.complete();
                    ctrl.revokeLast();
                }

                stop(ctrl: MarkersControl<YAKMMarkerData>, map: L.Map) {

                }
            },

            save: new class Save {
                start(ctrl: MarkersControl<YAKMMarkerData>, map: L.Map) {
                    ctrl.complete();
                    let obj = ctrl.saveAll();
                    mgr.modifyRecords(obj.toAdd, obj.toRemove, ctrl.getAllData());
                }
                stop(ctrl: MarkersControl<YAKMMarkerData>, map: L.Map) {

                }
            },

            load: new class Load {
                start(ctrl: MarkersControl<YAKMMarkerData>, map: L.Map) {
                    ctrl.complete();
                    ctrl.loadAll(mgr.getRecords());
                }
                stop(ctrl: MarkersControl<YAKMMarkerData>, map: L.Map) {

                }
            },

            search: new class Search {
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
                
                start(ctrl: MarkersControl<YAKMMarkerData>, map: L.Map) {
                    searchUI.open(
                        ctrl.getAllData(), 
                        function(data) {
                            map.setView(new L.LatLng(data.z, data.x), map.getMaxZoom());
                        },
                        function(event) {
                            ctrl.complete();
                        }
                    );
                }
                stop(ctrl: MarkersControl<YAKMMarkerData>, map: L.Map) {
                    searchUI.close();
                }
            }
        }
    }

    initControl(ctrl: MarkersControl<YAKMMarkerData>, map: L.Map) {
        ctrl.setPanel(this._panels);
        ctrl.setBuilder(this);
        map.on("markers-control:+load", this._loadCallback, this);
        setTimeout(() => { this.load(this.options.url, map); });
    }

    release(ctrl: MarkersControl<YAKMMarkerData>, map: L.Map) {
        map.off("markers-control:+load", this._loadCallback, this);
        this.icons = {};
        this.markerData = [];
    }

    _loadCallback() {
        setTimeout(function (that: YAKMMarkersManager) {
            that._ctrl.loadAll(that.getRecords());
        }, 200, this);
    }

    protected _setAvatar(uuid: string) {
        let options: L.IconOptions = {
            iconUrl: L.Util.template(this.options.avatar.iconUrl, { user: uuid }),
            iconSize: this.options.avatar.iconSize,
            iconAnchor: this.options.avatar.iconAnchor,
            popupAnchor: this.options.avatar.popupAnchor
        };
        return options;
    }

    protected _setIcon(marker: L.Marker, iconName: string) {
        if (iconName) {
            if (iconName.startsWith("head:") && this.options.avatar) {
                let uuid = iconName.slice("head:".length);
                marker.setIcon(new L.Icon(this._setAvatar(uuid)));
            } else {
                let icon = this.icons[iconName];
                if (icon !== undefined) {
                    if (icon === null) { //when icon has not been loaded, record it for redrawing in load::$::$
                        if (!(iconName in this._needRedraw)) {
                            this._needRedraw[iconName] = new Array<L.Marker>();
                        }
                        this._needRedraw[iconName].push(marker);
                    } else {
                        marker.setIcon(icon);
                    }
                }
            }
        }
    }

    protected _getIcon(iconName: string, url: string) {
        getJSON(
            url,
            (data: L.IconOptions) => {
                let ic = this.icons[iconName] = new L.Icon(data);
                if (iconName in this._needRedraw) {  //redraw markers
                    this._needRedraw[iconName].forEach(function (marker) {
                        marker.setIcon(ic);
                    });
                    console.debug(`redraw markers[${this._needRedraw[iconName].length}] with new icon "${iconName}"`);
                    delete this._needRedraw[iconName];
                }
            },
            console.warn,
            5000
        );
    }

    protected mdprase(s: string) {
        if (s) {
            return MD(s);
        }
        return "";
    }

    build(record: YAKMMarkerData) {
        let marker = new L.Marker(new L.LatLng(record.z, record.x)).bindPopup(conditionalJoin(
            `<div>`,
            `<span class="yakm-marker-title">${record.name}</span>`,
            `<span class="yakm-marker-category">${record.category}</span>`,
            `</div>`,
            `<div class="yakm-marker-coord">${record.x},${record.z}</div>`,
            Boolean(record.description),
            `<hr>`,
            `<div class="yakm-marker-description">${this.mdprase(record.description)}</div>`,
            null
        ));
        this._setIcon(marker, record.icon);
        return marker;
    }



    protected _changeMarker(marker: YAKMMarkerData0, category: string) {
        //notice that `YAKMMarkerData0` can be force-cast to `YAKMMarkerData`
        (<YAKMMarkerData>marker).category = category;
        (<YAKMMarkerData>marker).timestamp = new Date(marker.timestamp);
        //to...reduce memory consumption?
        return <YAKMMarkerData>marker;
    }

    load(url: string, map: L.Map) {
        if (this.icons) {
            this.icons = {};
        }
        if (this.markerData.length > 0) {
            this.markerData = new Array();
        }
        getJSON(
            url,
            (data: YAKMMarkerDataFull) => {
                let iconCfgs = data.icons;
                let iconNum = 0;
                for (let iconName in iconCfgs) {    //load icons
                    ++iconNum;
                    if (!(iconName in this.icons)) {    //exclude existed icons
                        this.icons[iconName] = null;
                        this._getIcon(iconName, iconCfgs[iconName]);
                    }
                }
                let markers = data.markers;
                for (let category in markers) {
                    markers[category].forEach(function (this: YAKMMarkersManager, m) {
                        this.markerData.push(this._changeMarker(m, category));
                    }, this);
                }
                console.debug(`load marker-data[${this.markerData.length}] and prepare icons[${iconNum}] from "${url}"`);
                setTimeout(function () { map.fire("markers-control:+load", null, false); }, 500);
            },
            console.warn,
            5000
        );
        return this;
    }

    getRecords() {
        return this.markerData;
    }

    modifyRecords(toAdd: Array<YAKMMarkerData>, toRemove: Array<YAKMMarkerData>, list: Array<YAKMMarkerData>) {
        //this._modifyRecords(this.markerData, toAdd, toRemove);
        console.table(toAdd);
        console.table(toRemove);
    }

    protected _modifyRecords(data: Array<YAKMMarkerData>, toAdd: Array<YAKMMarkerData>, toRemove: Array<YAKMMarkerData>) {
        toAdd = toAdd.sort();
        toRemove = toRemove.sort();
        data = data.sort();
        this.markerData = new Array<YAKMMarkerData>();
        let i: number, j: number, k: number;
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
    }

    getIcons() {
        let list: { [name: string]: HTMLImageElement } = {};
        for (let name in this.icons) {
            try {
                let img = document.createElement("img");
                img.src = this.icons[name].options.iconUrl;
                list[name] = img;
            } catch (e) {
                console.warn(e, this.icons[name]);
            }
        }
        return list;
    }
}









