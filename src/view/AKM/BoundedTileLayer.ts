
import * as L from "leaflet"

export interface BoundedTileLayerOptions extends L.TileLayerOptions {
    bound?: L.LatLngBoundsExpression
    radius?: number
    judge?: (bound: L.LatLngBounds) => boolean
}

/**
 * @deprecated
 */
export class BoundedTileLayer extends L.TileLayer {

    options: BoundedTileLayerOptions = {
        bound: [[-2048, -2048], [2048, 2048]]
    };

    constructor(urlTemplate: string, options?: BoundedTileLayerOptions) {
        super(urlTemplate, options);
        L.Util.setOptions(this, options);
        this.setOptions(this.options);
    }

    setOptions(options: BoundedTileLayerOptions) {
        if (this.options.bound && this.options.bound instanceof Array) {
            this.options.bound = new L.LatLngBounds(this.options.bound[0], this.options.bound[1]);
        }
        if (typeof (this.options.judge) !== "function") {
            if(this.options.bound) {
                this.options.judge = (bound) => {
                    let _bound = <L.LatLngBounds>this.options.bound;
                    let latIntersects = (bound.getNorth() > _bound.getSouth()) && (bound.getSouth() < _bound.getNorth()),
                        lngIntersects = (bound.getEast() > _bound.getWest()) && (bound.getWest() < _bound.getEast());
                    return latIntersects && lngIntersects;
                }
            }
            if(this.options.radius) {
                this.options.judge = (bound) => {
                    let r = this.options.radius;
                    let x = Math.max(Math.abs(bound.getEast()), Math.abs(bound.getWest()));
                    let y = Math.max(Math.abs(bound.getSouth()), Math.abs(bound.getNorth()));
                    return x * x + y + y < r * r;
                }
            }
        }
    }

    createTile(coords: L.Coords, done: L.DoneCallback) {
        let map = this._map;
        let tsz = this.getTileSize();
        let sw = new L.Point(tsz.x * coords.x, tsz.y * coords.y);
        let ne = new L.Point(tsz.x * (coords.x + 1), tsz.y * (coords.y + 1));
        let bound = new L.LatLngBounds(map.unproject(sw, coords.z), map.unproject(ne, coords.z));
        if(this.options.judge(bound)) {
            return super.createTile(coords, done);
        } else {
            let c = document.createElement("div");
            done(undefined, c);
            return c;
        }
    }

}