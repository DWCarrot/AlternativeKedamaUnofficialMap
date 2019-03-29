import * as L from "leaflet"
import { setOptions, loadStyle, conditionalJoin, getJSON } from "./Util"
import { MarkerData, MarkersControl, MarkersControlLayer, MarkersControlLayerOptions, MarkersControlPanel, MarkerDataManager } from "./MarkersControl"

export interface BasicMarker extends MarkerData {
    x: number,
    z: number,
    title: string,
    icon: string,
    description: string
}

interface IconList {
    [name: string]: L.IconOptions
}

export interface BasicMarkersManagerOptions extends MarkersControlLayerOptions {
    url: string
    icon: string
    avatar?: L.IconOptions
}

export class BasicMarkersManager extends MarkersControlLayer<BasicMarker> {

    options: BasicMarkersManagerOptions = {
        url: "",
        icon: "",
        avatar: {
            iconUrl: "https://minotar.net/helm/{user}",
            iconSize: [24, 24],
            iconAnchor: [11.5, 0],
            popupAnchor: [0, 20],
        }
    }

    icons: { [name: string]: L.Icon } = {};

    markerData: Array<BasicMarker> = [];

    classId: string = null;

    url: string;

    iconCfg: string;

    protected _needRedraw: { [icon: string]: Array<L.Marker> } = {};

    protected _panels: MarkersControlPanel<BasicMarker>;

    constructor(ctrl: MarkersControl<BasicMarker>, options: BasicMarkersManagerOptions) {
        super(ctrl);
        L.Util.setOptions(this, options);
        this.genPanel();
    }

    protected genPanel() {
        let mgr = <MarkerDataManager<BasicMarker>>this;
        this._panels = {
            add: new class Add {
                id: number = 0;
                callback: (this: this, ev: L.LeafletEvent) => void;
                start(ctrl: MarkersControl<BasicMarker>, map: L.Map) {
                    this.callback = function (_ev) {
                        let ev = <L.LeafletMouseEvent>_ev;
                        this.stop(ctrl, map);
                        ctrl.complete();
                        let record: BasicMarker = {
                            x: ev.latlng.lng,
                            z: ev.latlng.lat,
                            title: "point_" + String(this.id++),
                            icon: "",
                            description: ""
                        }
                        let marker = ctrl.addOne(record);
                        map.setView(ev.latlng, map.getMaxZoom());
                    }
                    map.on("click", this.callback, this);
                }
                stop(ctrl: MarkersControl<BasicMarker>, map: L.Map) {
                    map.off("click", this.callback, this);
                    this.callback = undefined;
                }
            },

            remove: new class Rmv {
                callback: (this: Rmv, ev: L.LeafletEvent) => void
                start(ctrl: MarkersControl<BasicMarker>, map: L.Map) {
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
                stop(ctrl: MarkersControl<BasicMarker>, map: L.Map) {
                    ctrl.getAllMarkers().forEach(function (this: Rmv, marker) {
                        marker.off("click", this.callback, this);
                    }, this);
                    this.callback = undefined;
                }
            },

            edit: new class Edit {
                callback: (this: Edit, ev: L.LeafletEvent) => void
                start(ctrl: MarkersControl<BasicMarker>, map: L.Map) {
                    this.callback = function (this: Edit, ev) {
                        this.stop(ctrl, map);
                        ctrl.complete();
                        let marker = <L.Marker>ev.target;
                        this.editUI(ctrl.getData(marker), (newData) => {
                            ctrl.editOne(marker, newData);
                        });
                    }
                    ctrl.getAllMarkers().forEach(function (this: Edit, marker) {
                        marker.on("click", this.callback, this);
                    }, this);
                }
                stop(ctrl: MarkersControl<BasicMarker>, map: L.Map) {
                    ctrl.getAllMarkers().forEach(function (this: Edit, marker) {
                        marker.off("click", this.callback, this);
                    }, this);
                    this.callback = undefined;
                }
                /** @method */
                editUI(oldData: BasicMarker, callback: (newData: BasicMarker) => void) {
                    let v = JSON.stringify(oldData);
                    let s = prompt("marker-data", v);
                    try {
                        if (s === null || s === v)
                            return;
                        let d = <BasicMarker>JSON.parse(s);
                        setTimeout(callback, 200, d);
                    } catch (e) {

                    }
                }
            },

            revoke: new class Rvk {
                start(ctrl: MarkersControl<BasicMarker>, map: L.Map) {
                    ctrl.complete();
                    ctrl.revokeLast();
                }

                stop(ctrl: MarkersControl<BasicMarker>, map: L.Map) {

                }
            },

            save: new class Save {
                start(ctrl: MarkersControl<BasicMarker>, map: L.Map) {
                    ctrl.complete();
                    let obj = ctrl.saveAll();
                    mgr.modifyRecords(obj.toAdd, obj.toRemove);
                }
                stop(ctrl: MarkersControl<BasicMarker>, map: L.Map) {

                }
            },

            load: new class Load {
                start(ctrl: MarkersControl<BasicMarker>, map: L.Map) {
                    ctrl.complete();
                    ctrl.loadAll(mgr.getRecords());
                }
                stop(ctrl: MarkersControl<BasicMarker>, map: L.Map) {

                }
            },

            search: new class Search {
                searchUI(list: Array<BasicMarker>, ctrl: MarkersControl<BasicMarker>) {
                    let h = setTimeout(function (list: Array<BasicMarker>) {
                        let key = prompt("Search for (name):");
                        let res = new Array<BasicMarker>();
                        let show = "Result is:\n";
                        if (key) {
                            list.forEach(function (data) {
                                if (data.title.indexOf(key) >= 0) {
                                    res.push(data);
                                    show += `${res.length}.\t${data.title} (${data.x},${data.z})\n`;
                                }
                            });
                        }
                        show += "=====================\n";
                        show += "Select index to jump to:"
                        let index = Number.parseInt(prompt(show));
                        if (index > 0 && index <= res.length) {
                            let data = res[index - 1];
                            let map = (<L.Map>(<any>ctrl)._map);
                            map.setView([data.z, data.x], map.getMaxZoom());
                        }
                    }, 10, list);
                    return function () {
                        clearTimeout(h);
                        console.debug('>> ', h);
                    };
                }
                _future: () => void;
                start(ctrl: MarkersControl<BasicMarker>, map: L.Map) {
                    ctrl.complete();
                    this._future = this.searchUI(ctrl.getAllData(), ctrl);
                }
                stop(ctrl: MarkersControl<BasicMarker>, map: L.Map) {
                    if (this._future) {
                        this._future();
                        this._future = undefined;
                    }
                }
            }
        }
    }

    initControl(ctrl: MarkersControl<BasicMarker>, map: L.Map) {
        ctrl.setPanel(this._panels);
        ctrl.setBuilder(this);
        map.on("markers-control:+load", this._loadCallback, this);
        setTimeout(() => { this.load(this.options.url, this.options.icon, map); });
    }

    release(ctrl: MarkersControl<BasicMarker>, map: L.Map) {
        map.off("markers-control:+load", this._loadCallback, this);
        this.icons = {};
        this.markerData = [];
    }

    _loadCallback() {
        setTimeout(function (that: BasicMarkersManager) {
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

    build(record: BasicMarker) {
        let marker = new L.Marker(new L.LatLng(record.z, record.x)).bindPopup(conditionalJoin(
            `<div>`,
            `<span class="yakm-marker-title">${record.title}</span>`,
            `</div>`,
            `<div class="yakm-marker-coord">${record.x},${record.z}</div>`,
            Boolean(record.description),
            `<hr>`,
            `<div class="yakm-marker-description">${record.description}</div>`,
            null
        ));
        this._setIcon(marker, record.icon);
        return marker;
    }

    load(url: string, iconCfg: string, map: L.Map) {
        this.icons = {};
        getJSON(
            iconCfg,
            (iconList: IconList) => {
                for (let name in iconList) {
                    this.icons[name] = new L.Icon(iconList[name]);
                }
            },
            console.warn,
            2500
        );
        this.markerData = [];
        getJSON(
            url,
            (data: Array<BasicMarker>) => {
                this.markerData = data;
                console.debug(`load marker-data[${this.markerData.length}] from "${url}"`);
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

    modifyRecords(toAdd: Array<BasicMarker>, toRemove: Array<BasicMarker>, list: Array<BasicMarker>) {
        //this._modifyRecords(this.markerData, toAdd, toRemove);
        console.table(toAdd);
        console.table(toRemove);
    }

    protected _modifyRecords(data: Array<BasicMarker>, toAdd: Array<BasicMarker>, toRemove: Array<BasicMarker>) {
        toAdd = toAdd.sort();
        toRemove = toRemove.sort();
        data = data.sort();
        this.markerData = new Array<BasicMarker>();
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
