

import * as L from "leaflet"
import * as U from "./Util"

export interface MeasureControlOptions extends L.ControlOptions {
    showPoint?: (latLng: L.LatLng, map?: L.Map) => string,
    showCoord?: (latlng: L.LatLng, map?: L.Map) => string,
    showMeasure?: (start: L.LatLng, end: L.LatLng, map?: L.Map) => string,
    controlTip?: string,
    clearTip?: string,
}

export class MeasureControl extends L.Control {

    protected _container: HTMLElement;

    protected _map: L.Map;

    options: MeasureControlOptions;

    protected _cbPointer: (this: MeasureControl, _ev: L.LeafletEvent) => void;

    protected _cbMeasureCtrl: (this: MeasureControl, _ev: Event) => void;

    protected _cbMeasureSet: (this: MeasureControl, _ev: L.LeafletEvent) => void

    protected _cbMeasureShow: (this: MeasureControl, _ev: L.LeafletEvent) => void;

    protected _cbTooltipShow: (this: MeasureControl, _ev: L.LeafletEvent) => void;

    protected _showRange: L.Circle;

    protected _showDirection: L.Polyline;

    protected _tooltip: L.Tooltip;

    constructor(options?: MeasureControlOptions) {
        options = U.setOptions({
            position: "bottomleft",
            controlTip: "measure",
            clearTip: "clear",
            showCoord: (latlng: L.LatLng) => { return `<span>lat:${latlng.lat}</span><span>lng:${latlng.lng}</span>`; },
            showMeasure: (start: L.LatLng, end: L.LatLng) => { return `(${start.lat},${start.lng})-(${end.lat},${end.lng})`; },
            showPoint: (latLng: L.LatLng, map?: L.Map) => { return `(${latLng.lng},${latLng.lat})`; },
        }, options);
        super(options);
    }


    onAdd(map: L.Map) {
        this._map = map;
        let container = L.DomUtil.create("div", "leaflet-control-measure leaflet-control");
        this._addpointer(map, container);
        this._addMeasure(map, container);
        this._addClickTip(map);
        return this._container = container;
    }

    onRemove(map: L.Map) {
        this._rmvClickTip(map);
        this._rmvMeasure(map);
        this._rmvPointer(map);
        this._map = undefined;
    }

    protected _addpointer(map: L.Map, container: HTMLElement) {
        let span = <HTMLDivElement>L.DomUtil.create("div", "leaflet-control-measure-pointer", container);
        this._cbPointer = function (_ev) {
            let ev = <L.LeafletMouseEvent>_ev;
            span.innerHTML = this.options.showCoord(ev.latlng, map);
        }
        map.on("mousemove", this._cbPointer, this);
        return span;
    }

    protected _rmvPointer(map: L.Map) {
        if (this._cbPointer) {
            map.off("mousemove", this._cbPointer, this);
            this._cbPointer = undefined;
        }
    }

    protected _addMeasure(map: L.Map, container: HTMLElement) {
        let a = <HTMLAnchorElement>L.DomUtil.create("a", "leaflet-control-measure-control leaflet-control-measure-control-default", container);
        a.href = "#";
        a.title = this.options.controlTip;
        a.innerHTML = "\u25C8";
        L.DomUtil.toBack(a);

        let span = <HTMLDivElement>L.DomUtil.create("div", "leaflet-control-measure-measure", container);
        span.style.display = "none";
        this._cbMeasureCtrl = (_ev) => {
            let ev = <MouseEvent>_ev;
            L.DomEvent.stopPropagation(ev);
            if (this._cbMeasureShow) {
                map.off("mousemove", this._cbMeasureShow, this);
                map.off("click", this._cbMeasureShow, this);
                this._cbMeasureShow = undefined;
            }
            span.innerHTML = "";
            for (let i = 1, ls = container.children; i < ls.length; ++i) {
                let aClear = ls[i];
                if (aClear.tagName.toLowerCase() === "a") {
                    aClear.remove();
                    map.removeLayer(this._showRange);
                    this._showRange = undefined;
                    map.removeLayer(this._showDirection);
                    this._showDirection = undefined;
                    break;
                }
            }
            let a = <HTMLAnchorElement>ev.target;
            if (this._cbMeasureSet) {
                map.off("click", this._cbMeasureSet, this);
                this._cbMeasureSet = undefined;
                a.classList.remove("leaflet-control-measure-control-down");

            } else {
                a.classList.add("leaflet-control-measure-control-down");
                this._cbMeasureSet = (_ev) => {
                    let ev = <L.LeafletMouseEvent>_ev;
                    //TODO: stopPropagation ev 
                    a.classList.remove("leaflet-control-measure-control-down");
                    map.off("click", this._cbMeasureSet, this);
                    this._cbMeasureSet = undefined;
                    let startP = ev.latlng;
                    this._cbMeasureShow = (_ev) => {
                        let ev = <L.LeafletMouseEvent>_ev;
                        if (ev.type === "click") {
                            map.off("mousemove", this._cbMeasureShow, this);
                            map.off("click", this._cbMeasureShow, this);
                            this._cbMeasureShow = undefined;
                            /// add clear button
                            let aClear = <HTMLAnchorElement>L.DomUtil.create("a", "leaflet-control-measure-clean", container);
                            let _cbClear = (ev: MouseEvent) => {
                                //TODO: stopPropagation ev 
                                aClear.removeEventListener("click", _cbClear);
                                aClear.remove();
                                span.innerHTML = "";
                                //TODO: remove
                                map.removeLayer(this._showRange);
                                this._showRange = undefined;
                                map.removeLayer(this._showDirection);
                                this._showDirection = undefined;
                                span.style.display = "none";
                            };
                            aClear.href = "#";
                            aClear.title = this.options.clearTip;
                            aClear.innerHTML = "\u2716";
                            aClear.addEventListener("click", _cbClear);
                        } else {
                            let endP = ev.latlng;
                            span.innerHTML = this.options.showMeasure(startP, endP, map);
                            //TODO: change graphic
                            this._showRange.setRadius(map.distance(startP, endP));
                            this._showDirection.setLatLngs([startP, endP]);
                        }
                    }
                    map.on("click", this._cbMeasureShow, this);
                    map.on("mousemove", this._cbMeasureShow, this);
                    //TODO: add graphic
                    this._showRange = new L.Circle(startP);
                    map.addLayer(this._showRange);
                    this._showDirection = new L.Polyline([startP]);
                    map.addLayer(this._showDirection);
                    span.style.display = "";
                }
                map.on("click", this._cbMeasureSet, this);
            }
        }
        a.addEventListener("click", this._cbMeasureCtrl);
        let b :EventListenerOrEventListenerObject
    }

    protected _rmvMeasure(map: L.Map) {
        let a;
        for (let i = 0, ls = this._container.children; i < ls.length; ++i) {
            a = ls[i];
            if (a.tagName.toLowerCase() === "a") {
                break;
            } else {
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
            map.off("mousemove", this._cbMeasureShow, this)
            this._cbMeasureShow = undefined;
        }
    }

    protected _addClickTip(map: L.Map) {
        if (!this._cbTooltipShow) {
            this._tooltip = new L.Tooltip();
            this._cbTooltipShow = function (_ev) {
                let ev = <L.LeafletMouseEvent>_ev;
                if (ev.type === "dblclick") {
                    map.removeLayer(this._tooltip);
                } else {
                    let latlng = ev.latlng;
                    this._tooltip.setContent(this.options.showPoint(latlng)).setLatLng(latlng);
                    map.addLayer(this._tooltip);
                }
            }
            map.on("click", this._cbTooltipShow, this);
            map.on("dblclick", this._cbTooltipShow, this);
        }
    }

    protected _rmvClickTip(map: L.Map) {
        if (this._cbTooltipShow) {
            map.off("dblclick", this._cbTooltipShow, this);
            map.off("click", this._cbTooltipShow, this);
            this._cbTooltipShow = undefined;
            if (this._tooltip) {
                map.removeLayer(this._tooltip);
                this._tooltip = undefined;
            }
        }
    }

}

