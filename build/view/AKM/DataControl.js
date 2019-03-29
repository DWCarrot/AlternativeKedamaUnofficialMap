"use strict";
/*

import * as L from "leaflet"


// function _map_getIndex(obj: any, i: number) {
//     if ("$map::index" in obj) {
//         return obj["$map::index"];
//     } else {
//         return obj["$map::index"] = i;
//     }
// }

// function _map_rmvIndex(obj: any) {
//     return delete obj["$map::index"];
// }

export interface DataManager<DT, VT extends L.Layer> {

    layerBuilder: (record: DT) => VT;

    getRecords: () => Array<DT>;

    modifyRecords: (toAdd: Array<DT>, toRemove: Array<DT>) => void;

}

export interface DataViewOperation<DT, VT extends L.Layer> {

    start: (control: DataControl<DT, VT>) => void;

    stop: (control: DataControl<DT, VT>) => void;
}

export interface DataControlPanelItem<DT, VT extends L.Layer> {
    tip: string,    // description of this item, show when mouse move on
    icon?: string,  // icon url
    ui?: DataViewOperation<DT, VT>
}

export interface DataControlOptions<DT, VT extends L.Layer> extends L.ControlOptions {
    panel: {
        add: DataControlPanelItem<DT, VT>,
        remove: DataControlPanelItem<DT, VT>,
        edit: DataControlPanelItem<DT, VT>,
        revoke: DataControlPanelItem<DT, VT>,
        save: DataControlPanelItem<DT, VT>,
        load: DataControlPanelItem<DT, VT>,
        [operation: string]: DataControlPanelItem<DT, VT>
    }
    panelSize: number | { width: number, height: number }
}

export class DataControl<DT, VT extends L.Layer> extends L.Control {

    manager: DataManager<DT, VT> = null;

    options: DataControlOptions<DT, VT> = {
        position: "topright",
        panelSize: 26,
        panel: {
            add: {
                tip: "add",
            },
            remove: {
                tip: "remove",
            },
            edit: {
                tip: "edit",
            },
            revoke: {
                tip: "revoke",
            },
            save: {
                tip: "save",
            },
            load: {
                tip: "load",
            }
        }
    }

    _layerTable: { [id: number]: { layer: VT, record: DT, on: boolean } } = {};

    _optStore: Array<{ opt: "add" | "rmv" | "edit", tgt: number, ntg?: number }> = [];

    _map: L.Map = null;

    _container: HTMLElement = null;

    _selectedPanel: HTMLAnchorElement = null;

    constructor(manager: DataManager<DT, VT>, options?: DataControlOptions<DT, VT>) {
        super(options);
        this.manager = manager;
    }

    setDataManager(manager: DataManager<DT, VT>) {
        if (this._map) {
            this.clearAll(this._map);
            this.loadAll();
        }
        this.manager = manager;
    }

    setPanel(panelItem: DataControlPanelItem<DT, VT>) {

    }

    onAdd(map: L.Map) {
        this._map = map;
        this._container = L.DomUtil.create("div", "leaflet-bar leaflet-control leaflet-control-data");
        let panel = this.options.panel;
        let pw: number;
        let ph: number;
        if (typeof (this.options.panelSize) === "object") {
            pw = this.options.panelSize.width;
            ph = this.options.panelSize.height;
        } else {
            pw = ph = this.options.panelSize;
        }
        for (let name in panel) {
            let item = <DataControlPanelItem<DT, VT>>(<any>panel)[name];
            let a = <HTMLAnchorElement>L.DomUtil.create("a", "leaflet-control-data-" + name, this._container);
            a.href = "#";
            a.title = item.tip;
            a.style.width = String(pw) + "px";
            a.style.height = String(ph) + "px";
            a.name = name;
            if (item.icon)
                a.style.backgroundImage = String.prototype.concat.call("url(\"", item.icon, "\")");
            L.DomEvent.addListener(a, "click", this._panelCallback, this);
        }

        return this._container;
    }

    onRemove(map: L.Map) {
        this.clearAll(map);
        this._container.childNodes.forEach(function(a) {
            L.DomEvent.removeListener(<HTMLElement>a, "click", this._panelCallback, this);
        }, this);
    }

    loadAll() {
        this.manager.getRecords().forEach((record) => {
            let layer = this.manager.layerBuilder(record);
            let id = L.Util.stamp(layer);
            this._layerTable[id] = { layer: layer, record: record, on: true };
            this._map.addLayer(layer);
        }, this);
    }

    clearAll(map: L.Map) {
        if (this._selectedPanel) {
            let operation = (<DataControlPanelItem<DT, VT>>(<any>this.options)[this._selectedPanel.name]).ui;
            if (operation)
                operation.stop(this);
            this._selectedPanel = null;
        }
        for (let id in this._layerTable) {
            map.removeLayer(this._layerTable[id].layer);
        }
        this._layerTable = {};
        this._optStore = [];
    }

    saveAll() {
        let set: { [id: number]: "add" | "rmv" } = {};
        let toAdd = new Array<DT>();
        let toRemove = new Array<DT>();
        this._optStore.forEach((opt) => {
            switch (opt.opt) {
                case "add":
                    set[opt.tgt] = "add";
                    break;
                case "rmv":
                    if (set[opt.tgt] === "add") {
                        set[opt.tgt] = undefined;
                    } else {
                        set[opt.tgt] = "rmv";
                    }
                    break;
                case "edit":
                    if (set[opt.tgt] === "add") {
                        set[opt.tgt] = undefined;
                    } else {
                        set[opt.tgt] = "rmv";
                    }
                    set[opt.ntg] = "add";
                    break;
            }
        }, this);
        for (let id in set) {
            let opt = set[id];
            if (opt === "add") {
                toAdd.push(this._layerTable[id].record);
                continue;
            }
            if (opt === "rmv") {
                toRemove.push(this._layerTable[id].record);
                continue;
            }
        }
        this.manager.modifyRecords(toAdd, toRemove);
    }

    revokeLast() {
        let lastOpt = this._optStore.pop();
        switch (lastOpt.opt) {
            case "add":
                if (lastOpt.tgt in this._layerTable) {
                    let tuple = this._layerTable[lastOpt.tgt];
                    this._map.removeLayer(tuple.layer);
                    tuple.on = false;
                }
                break;
            case "rmv":
                if (lastOpt.tgt in this._layerTable) {
                    let tuple = this._layerTable[lastOpt.tgt];
                    this._map.addLayer(tuple.layer);
                    tuple.on = true;
                }
                break;
            case "edit":
                if (lastOpt.ntg in this._layerTable) {
                    let tuple = this._layerTable[lastOpt.ntg];
                    this._map.removeLayer(tuple.layer);
                    tuple.on = false;
                    if (lastOpt.tgt in this._layerTable) {
                        let tuple = this._layerTable[lastOpt.tgt];
                        this._map.addLayer(tuple.layer);
                        tuple.on = true;
                    }
                }
                break;
        }
    }

    addOne(record: DT) {
        let layer = this.manager.layerBuilder(record);
        let id = L.Util.stamp(layer);
        this._map.addLayer(layer);
        this._layerTable[id] = { layer: layer, record: record, on: true };
        this._optStore.push({ opt: "add", tgt: id });
    }

    removeOne(layer: VT) {
        let id = L.Util.stamp(layer);
        if (id in this._layerTable) {
            let tuple = this._layerTable[id];
            this._map.removeLayer(tuple.layer);
            tuple.on = false;
            this._optStore.push({ opt: "rmv", tgt: id });
        }
    }

    editOne(layer: VT, record: DT) {
        let id = L.Util.stamp(layer);
        if (id in this._layerTable) {
            let tuple = this._layerTable[id];
            this._map.removeLayer(tuple.layer);
            tuple.on = false;
            let nlayer = this.manager.layerBuilder(record);
            let nid = L.Util.stamp(nlayer);
            this._map.addLayer(nlayer);
            this._layerTable[nid] = { layer: nlayer, record: record, on: true };
            this._optStore.push({ opt: "edit", tgt: id, ntg: nid });
        }
    }

    getRecord(layer: VT) {
        let tuple = this._layerTable[L.Util.stamp(layer)];
        return tuple ? tuple.record : undefined;
    }

    getLayer(record: VT) {
        for (let id in this._layerTable) {
            let tuple = this._layerTable[id];
            if (tuple.on)
                return tuple.layer;
        }
        return null;
    }

    getAll() {
        let arr = new Array<{ record: DT, layer: VT }>();
        for (let id in this._layerTable) {
            let tuple = this._layerTable[id];
            if (tuple.on) {
                arr.push(tuple);
            }
        }
        return arr;
    }

    endOperation() {
        if (this._selectedPanel) {
            let item = this.options.panel[this._selectedPanel.name];
            if (item.ui)
                item.ui.stop(this);
            this._selectedPanel = null;
        }
    }

    _panelCallback(ev: Event) {
        let a = <HTMLAnchorElement>ev.target;
        if (this._selectedPanel) {
            if (this._selectedPanel === a)
                a = null;
            let operation = (<DataControlPanelItem<DT, VT>>(<any>this.options)[this._selectedPanel.name]).ui;
            if (operation)
                operation.stop(this);
            this._selectedPanel = null;
        }
        if (a) {
            this._selectedPanel = a;
            let operation = (<DataControlPanelItem<DT, VT>>(<any>this.options)[a.name]).ui;
            if (operation)
                operation.start(this);
        }
        // switch (a.name) {
        //     case "add":
        //         break;
        //     case "remove":
        //         break;
        //     case "edit":
        //         break;
        //     case "revoke":
        //         break;
        //     case "add":
        //         break;
        //     case "remove":
        //         break;
        // }
    }


}

*/ 
//# sourceMappingURL=DataControl.js.map