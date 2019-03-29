import * as L from "leaflet"
import { setOptions, Exception, getAbsoluteUrl } from "./Util"


export interface MarkerData {
    
}

export interface MarkerDataManager<T> {

    getRecords: () => Array<T>;

    modifyRecords: (toAdd: Array<T>, toRemove: Array<T>, list?: Array<T>) => void;

}

export interface MarkerBuilder<T> {
    build: (record: T) => L.Marker;
}

export interface MarkerControlOptions<T> extends L.ControlOptions {

}

export interface MarkersControlPanelItem<T> {
    tip?: string;
    icon?: string;
    start: (ctrl: MarkersControl<T>, map: L.Map) => void;
    stop: (ctrl: MarkersControl<T>, map: L.Map) => void;
}

export interface MarkersControlPanel<T> {
    add: MarkersControlPanelItem<T>;
    remove: MarkersControlPanelItem<T>;
    edit: MarkersControlPanelItem<T>;
    revoke: MarkersControlPanelItem<T>;
    load: MarkersControlPanelItem<T>;
    save: MarkersControlPanelItem<T>;
    search: MarkersControlPanelItem<T>;
    [name: string]: MarkersControlPanelItem<T>;
}

interface _Marker<T> extends L.Marker {
    _akm_data: T;
}

const enum _Operation {
    nop = 0x00,
    add = 0x01,
    rmv = 0x02,
    edit = 0x10,
    edit_add = 0x11,
    edit_rmv = 0x12,
}



export class MarkersControl<T> extends L.Control {

    options: MarkerControlOptions<T> = {
        position: "topright",
    };

    protected _builder: MarkerBuilder<T>;

    protected _panels: MarkersControlPanel<T>;


    protected _map: L.Map;

    protected _container: HTMLElement;

    protected _sel: HTMLAnchorElement;


    protected _step: Array<{ o: _Operation, d: T }>;

    protected _tDM: Map<T, L.Marker>


    protected _addSet: Set<L.Marker>;

    protected _rmvSet: Set<L.Marker>;


    constructor(builder: MarkerBuilder<T>, panel: MarkersControlPanel<T>, options?: MarkerControlOptions<T>) {
        super(options);
        L.Util.setOptions(this, options);
        this._builder = builder;
        this._panels = panel;
        this._step = [];
        this._addSet = new Set();
        this._rmvSet = new Set();
        this._tDM = new Map();
    }

    setBuilder(builder: MarkerBuilder<T>) {
        let list = this.clearAll();
        this._builder = builder;
        if (list.length > 0) {
            this.loadAll(list);
        }
    }

    /**
     * 
     * @param name <string> name of panel to modify; <MarkersControlPanel> the whole panel to replace
     * @param panel panelItem of the specific panel `name`; ignored when `name` is a whole panel
     */
    setPanel(name: string | MarkersControlPanel<T>, panel?: MarkersControlPanelItem<T>) {
        if (this._map)
            this._removePanel(this._map, this._container);
        if (typeof (name) === "string") {
            if (panel === undefined)
                delete this._panels[<string>name];
            else
                this._panels[<string>name] = panel;
        } else {
            this._panels = name;
        }
        if (this._map)
            this._addPanel(this._map, this._container);
    }

    onAdd(map: L.Map) {
        let container = L.DomUtil.create("div", "leaflet-bar leaflet-control leaflet-control-markers")
        this._addPanel(map, container);
        this._handleView(map);
        return this._container = container;
    }

    onRemove(map: L.Map) {
        this.clearAll();
        this._removePanel(map, this._container);
    }

    /**
     * reset the specific panel button (without call panel `MarkersControlPanelItem<T>.stop()`)
     * @param panel panel name ; panel itself; default is the current one
     */
    complete(panel?: string | MarkersControlPanelItem<T>) {
        if (this._sel && (panel === undefined || panel === this._sel.name || panel === this._panels[this._sel.name])) {
            this._sel.classList.remove("leaflet-control-markers-panel-on");
            this._sel = undefined;
        }
    }


    loadAll(list: Array<T>) {
        if (this._tDM.size > 0)
            this.clearAll();
        list.forEach(function (this: MarkersControl<T>, record) {
            let marker = this._builder.build(record);
            (<_Marker<T>>marker)._akm_data = record;
            this._tDM.set(record, marker);
            if (this._map) {
                this._map.addLayer(marker);
            } else {
                this._rmvSet.delete(marker);
                this._addSet.add(marker);
            }
        }, this);
    }

    /**
     * 
     *  @returns Array<T> | undefined 
     */
    clearAll() {

        let rest = new Array<T>();
        this._tDM.forEach(function (this: MarkersControl<T>, marker, record) {
            if (this._map) {
                this._map.removeLayer(marker);
            } else {
                if (!this._addSet.delete(marker)) {
                    this._rmvSet.add(marker);
                }
            }
            rest.push(record);
        }, this);
        this._tDM.clear();
        this._step.splice(0, this._step.length);
        return rest;

    }

    /** 
     * 
     * @returns {toAdd: Array<T>, toRemove: Array<T>} | undefined 
     */
    saveAll() {

        let dataSet = new Map<T, _Operation>();
        this._step.forEach(function (s) {
            let operation = s.o;
            let record = s.d;
            if ((operation & _Operation.rmv) > 0) {
                if (!dataSet.delete(record)) {
                    dataSet.set(record, _Operation.rmv);
                }
            } else {
                if ((operation & _Operation.add) > 0) {
                    dataSet.set(record, _Operation.add);
                }
            }
        }, this);
        let toAdd = new Array<T>();
        let toRemove = new Array<T>();
        dataSet.forEach(function (operation, data) {
            if (operation === _Operation.add) {
                toAdd.push(data);
            } else {
                toRemove.push(data);
            }
        }, this);
        dataSet.clear();
        this._step.splice(0, this._step.length);
        return { toAdd, toRemove };

    }

    revokeLast() {

        for (let s = this._step.pop(); s !== undefined; s = this._step.pop()) {
            let operation = s.o;
            let record = s.d;
            if ((operation & _Operation.rmv) > 0) {
                let m = this._builder.build(record);
                this._addToMap(m, record);
            } else {
                if ((operation & _Operation.add) > 0) {
                    let m = this._tDM.get(record);
                    this._rmvFromMap(m);
                }
            }
            if ((operation & _Operation.edit) === 0)
                break;
        }

    }

    /** 
     * 
     * @returns L.Marker [marker of `record`] | undefined 
     */
    addOne(record: T) {

        let m = this._builder.build(record);
        this._addToMap(m, record, _Operation.add);
        return m;

    }

    /** 
     * 
     * @returns L.Marker [marker itself] | undefined 
     */
    removeOne(layer: L.Marker) {

        this._rmvFromMap(layer, _Operation.rmv);
        return layer;

    }

    /** 
     * 
     * @returns L.Marker [marker of new `record`] | undefined 
     */
    editOne(layer: L.Marker, record: T) {

        this._rmvFromMap(layer, _Operation.edit_rmv);
        let m = this._builder.build(record);
        this._addToMap(m, record, _Operation.edit_add);
        return m;

    }

    getData(layer: L.Marker) {
        return (<_Marker<T>>layer)._akm_data;
    }

    getAllData() {
        let list = new Array<T>();
        this._tDM.forEach(function (marker, record) {
            list.push(record);
        }, this);
        return list;
    }

    getMarker(record?: T) {
        return this._tDM.get(record);
    }

    getAllMarkers() {
        let list = new Array<L.Marker>();
        this._tDM.forEach(function (marker, record) {
            list.push(marker);
        }, this);
        return list;
    }

    protected _handleView(map: L.Map) {
        this._rmvSet.forEach(function (m) {
            map.removeLayer(m);
        }, this);
        this._rmvSet.clear();
        this._addSet.forEach(function (m) {
            map.addLayer(m);
        }, this);
        this._addSet.clear();
    }

    protected _addToMap(marker: L.Marker, record: T, operation?: _Operation) {
        if (this._tDM.has(record))
            throw new Exception("InvalidArgumentException", "record has existed", { record });
        (<_Marker<T>>marker)._akm_data = record;
        this._tDM.set(record, marker);
        if (this._map) {
            this._map.addLayer(marker);
        } else {
            this._rmvSet.delete(marker);
            this._addSet.add(marker);
        }
        if (operation !== undefined) {
            this._step.push({ o: operation, d: record });
        }
    }

    protected _rmvFromMap(marker: L.Marker, operation?: _Operation) {
        let record = (<_Marker<T>>marker)._akm_data;
        if (record === undefined)
            return;
        if (this._tDM.get(record) !== marker)
            return;
        this._tDM.delete(record);
        if (this._map) {
            this._map.removeLayer(marker);
        } else {
            if (!this._addSet.delete(marker))
                this._rmvSet.add(marker);
        }
        if (operation !== undefined) {
            this._step.push({ o: operation, d: record });
        }
        return;
    }

    protected _panelCallback(this:MarkersControl<T>, ev: Event) {
        L.DomEvent.stopPropagation(ev);
        let a = <HTMLAnchorElement>ev.target;
        let cancel = (this._sel === a);
        if (this._sel) {
            this._sel.classList.remove("leaflet-control-markers-panel-on");
            let op = this._panels[this._sel.name];
            this._sel = undefined;
            op.stop(this, this._map);
        }
        if (!cancel) {
            a.classList.add("leaflet-control-markers-panel-on");
            this._sel = a;
            let p = this._panels[this._sel.name];
            p.start(this, this._map);
        }
    }

    protected _addPanel(map: L.Map, container: HTMLElement) {
        for (let name in this._panels) {
            let item = this._panels[name];
            let a = <HTMLAnchorElement>L.DomUtil.create("a", `leaflet-control-markers-panel leaflet-control-markers-${name}`, container);
            a.href = "#";
            a.name = name;
            if (item.tip !== undefined)
                a.title = item.tip;
            else
                a.title = name;
            if (item.icon !== undefined)
                a.style.backgroundImage = `url(${getAbsoluteUrl(item.icon)})`;
            L.DomEvent.on(a, "click", this._panelCallback, this);

        }
    }

    protected _removePanel(map: L.Map, container: HTMLElement) {
        if (this._sel) {
            let p = this._panels[this._sel.name];
            this._sel = undefined;
            p.stop(this, this._map);
        }
        for (let i = 0, ls = container.children; i < ls.length; ++i) {
            let a = <HTMLAnchorElement>ls[i];
            L.DomEvent.off(a, "click", this._panelCallback, this);
        }
    }

}

/** Layer */

export interface MarkersControlLayerOptions extends L.LayerOptions {

}

export abstract class MarkersControlLayer<T> extends L.Layer implements MarkerDataManager<T> {

    protected _ctrl: MarkersControl<T>;

    constructor(ctrl: MarkersControl<T>) {
        super();
        this._ctrl = ctrl;
    }

    onAdd(map: L.Map) {
        this.initControl(this._ctrl, map);
        this._ctrl.addTo(map);
        // map.on("markers-control:+load", this.loadAll, this);
        // map.on("markers-control:+save", this.saveAll, this);
        // map.on("markers-control:+clear", this.clearAll, this);
        return this;
    }

    onRemove(map: L.Map) {
        // map.off("markers-control:+load", this.loadAll, this);
        // map.off("markers-control:+save", this.saveAll, this);
        // map.off("markers-control:+clear", this.clearAll, this);
        this._ctrl.remove();
        this.release(this._ctrl, map);
        return this;
    }

    /**
     * require `MarkersControl<T>.setPanel()` to be called to set panel in `.initControl()` 
     */
    abstract initControl(ctrl: MarkersControl<T>, map: L.Map): void;

    abstract release(ctrl: MarkersControl<T>, map: L.Map): void;

    abstract getRecords(): Array<T>;

    abstract modifyRecords(toAdd: Array<T>, toRemove: Array<T>, list?: Array<T>): void;

}

/** panel examples */

class MarkersControlPanelAdd<T> implements MarkersControlPanelItem<T>{

    tip: "add";

    icon: undefined;

    protected _callback: (this: MarkersControlPanelAdd<T>, ev: L.LeafletEvent) => void;

    constructor() {

    }

    /**
     * @interface createMarker(latlng: L.LatLng) create empty marker data with Latlng
     */
    createMarker(latlng: L.LatLng) {
        return <T>{};
    }

    start(ctrl: MarkersControl<T>, map: L.Map) {
        this._callback = function (_ev) {
            let ev = <L.LeafletMouseEvent>_ev;
            this.stop(ctrl, map);
            ctrl.complete();
            let record = this.createMarker(ev.latlng);
            ctrl.addOne(record);
            map.setView(ev.latlng, map.getMaxZoom());
        }
        map.on("click", this._callback, this);
    }
    stop(ctrl: MarkersControl<T>, map: L.Map) {
        map.off("click", this._callback, this);
        this._callback = undefined;
    }
}

class MarkersControlPanelRmv<T> implements MarkersControlPanelItem<T>{

    tip: "remove";

    icon: undefined;

    protected _callback: (this: MarkersControlPanelAdd<T>, ev: L.LeafletEvent) => void;

    constructor() {

    }

    start(ctrl: MarkersControl<T>, map: L.Map) {
        this._callback = (_ev) => {
            let ev = _ev;
            this.stop(ctrl, map);
            ctrl.complete();
            let marker = <L.Marker><any>ev.target;
            ctrl.removeOne(marker);
        }
        ctrl.getAllMarkers().forEach(function (this: MarkersControlPanelRmv<T>, marker) {
            marker.on("click", this._callback, this);
        }, this);
    }

    stop(ctrl: MarkersControl<T>, map: L.Map) {
        ctrl.getAllMarkers().forEach(function (this: MarkersControlPanelRmv<T>, marker) {
            marker.off("click", this._callback, this);
        }, this);
        this._callback = undefined;
    }
}

class MarkersControlPanelEdit<T> implements MarkersControlPanelItem<T>{

    tip: "edit";

    icon: undefined;

    protected _callback: (this: MarkersControlPanelEdit<T>, ev: L.LeafletEvent) => void;

    constructor() {

    }

    editDataUI(oldData: T, callback: (newData: T) => void) {
        return;
    }

    start(ctrl: MarkersControl<T>, map: L.Map) {
        this._callback = function (ev) {
            this.stop(ctrl, map);
            ctrl.complete();
            let marker = <L.Marker>ev.target;
            let data = ctrl.getData(marker);
            this.editDataUI(data, (newData: T) => {
                if (newData) {
                    ctrl.editOne(marker, newData);
                }
            });
        }
        ctrl.getAllMarkers().forEach(function (this: MarkersControlPanelEdit<T>, marker) {
            marker.on("click", this._callback, this);
        }, this);
    }

    stop(ctrl: MarkersControl<T>, map: L.Map) {
        ctrl.getAllMarkers().forEach(function (this: MarkersControlPanelEdit<T>, marker) {
            marker.off("click", this._callback, this);
        }, this);
        this._callback = undefined;
    }
}

class MarkersControlPanelRvk<T> implements MarkersControlPanelItem<T>{

    tip: "revoke";

    icon: undefined;

    start(ctrl: MarkersControl<T>, map: L.Map) {
        ctrl.complete();
        ctrl.revokeLast();
    }

    stop(ctrl: MarkersControl<T>, map: L.Map) {

    }
}

class MarkersControlPanelSave<T> implements MarkersControlPanelItem<T>{

    tip: "save";

    icon: undefined;

    start(ctrl: MarkersControl<T>, map: L.Map) {
        ctrl.complete();
        ctrl.saveAll();
    }

    stop(ctrl: MarkersControl<T>, map: L.Map) {

    }
}

class MarkersControlPanelLoad<T> implements MarkersControlPanelItem<T>{

    tip: "load";

    icon: undefined;

    mgr: MarkerDataManager<T>

    start(ctrl: MarkersControl<T>, map: L.Map) {
        ctrl.complete();
        ctrl.loadAll(this.mgr.getRecords());
    }

    stop(ctrl: MarkersControl<T>, map: L.Map) {

    }
}

class MarkersControlPanelSearch<DT> implements MarkersControlPanelItem<DT>{

    tip: "search";

    icon: undefined;

    searchUI: () => void

    start(ctrl: MarkersControl<DT>, map: L.Map) {
        ctrl.complete();
    }

    stop(ctrl: MarkersControl<DT>, map: L.Map) {

    }
}




