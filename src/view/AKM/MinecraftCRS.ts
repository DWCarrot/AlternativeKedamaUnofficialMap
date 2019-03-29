import * as L from "leaflet"

export interface MinecraftCRSOptions {
    scale?: number,
    offsetX?: number,
    offsetZ?: number,
    datumZoom?: number
}

export class MinecraftCRS implements L.CRS {

    latLngToPoint: (latlng: L.LatLngExpression, zoom: number) => L.Point;
    pointToLatLng: (point: L.PointExpression, zoom: number) => L.LatLng;
    project: (latlng: L.LatLng | L.LatLngLiteral) => L.Point;
    unproject: (point: L.PointExpression) => L.LatLng;
    scale: (zoom: number) => number;
    zoom: (scale: number) => number;
    getProjectedBounds: (zoom: number) => L.Bounds;
    distance: (latlng1: L.LatLngExpression, latlng2: L.LatLngExpression) => number;
    wrapLatLng: (latlng: L.LatLng | L.LatLngLiteral) => L.LatLng;

    infinite: boolean;

    projection: L.Projection;
    transformation: L.Transformation;

    options: MinecraftCRSOptions = {
        scale: 1,
        offsetX: 0,
        offsetZ: 0,
        datumZoom: 0
    }

    constructor(options: MinecraftCRSOptions) {
        L.Util.setOptions(this, options);
        L.Util.extend(this, L.CRS);
        let r = Math.pow(2, this.options.datumZoom) * this.options.scale;
        this.infinite = true;
        this.projection = L.Projection.LonLat;
        this.transformation = new L.Transformation(1 / r, -this.options.offsetX / r, 1 / r, -this.options.offsetZ / r);
        this.scale = function (zoom: number) {
            return Math.pow(2, zoom);
        };
        this.zoom = function (scale: number) {
            return Math.log(scale) / Math.LN2;
        };
        this.distance = function (latlng1: L.LatLngExpression, latlng2: L.LatLngExpression) {
            if(latlng1 instanceof Array) {
                latlng1 = new L.LatLng(latlng1[0], latlng1[1]);
            }
            if(latlng2 instanceof Array) {
                latlng2 = new L.LatLng(latlng2[0], latlng2[1]);
            }
            let dx = latlng2.lng - latlng1.lng,
                dy = latlng2.lat - latlng1.lat;
            return Math.sqrt(dx * dx + dy * dy);
        };
    }

}