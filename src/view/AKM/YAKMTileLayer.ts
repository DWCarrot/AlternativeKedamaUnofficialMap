
import * as L from "leaflet"
import { getJSON } from "./Util"

/** 
 * from https://kedama-map.jsw3286.eu.org/v3/js/main.js 
 */
function B62decode(raw: string) {
    var res = 0,
        length = raw.length,
        i, char
    for (i = 0; i < length; i++) {
        char = raw.charCodeAt(i)
        if (char < 58) { // 0-9
            char = char - 48
        } else if (char < 91) { // A-Z
            char = char - 29
        } else { // a-z
            char = char - 87
        }
        res += char * Math.pow(62, length - i - 1)
    }
    return res
};

interface YAKMMetaData0 {
    display_name: string
    size: number
    offset: Array<number> | L.Point
    tiles: { [tileStr: string]: string | Date }
}

export interface YAKMMetaData extends YAKMMetaData0 {
    display_name: string
    size: number
    offset: L.Point
    tiles: { [tileStr: string]: Date }
}

export interface YAKMTileLayerOptions extends L.TileLayerOptions {
    metadata?: {
        url: string
        style: string
    }
}

export class YAKMTileLayer extends L.TileLayer {

    options: YAKMTileLayerOptions;

    metaData: YAKMMetaData;

    constructor(urlTemplate: string, options?: YAKMTileLayerOptions) {
        super(urlTemplate, options);
        L.Util.setOptions(this, options);
    }

    onAdd(map: L.Map) {
        let url = this.options.metadata.url;
        let style = this.options.metadata.style;
        getJSON(
            url,
            (data: { styles: { [style: string]: YAKMMetaData0 } }) => {
                let data0 = data.styles[style];
                let offset = <Array<number>>data0.offset;
                data0.offset = new L.Point(offset[0], offset[1]);
                let tiles = data0.tiles
                for (let name in tiles) {
                    tiles[name] = new Date(B62decode(<string>tiles[name]));
                }
                this.metaData = <YAKMMetaData>data0;
            },
            console.warn,
            5000
        );
        return super.onAdd(map);
    }

    onRemove(map: L.Map) {
        this.metaData = undefined;
        return super.onRemove(map);
    }

    createTile(coords: L.Coords, done: L.DoneCallback) {
        if (this.metaData) {
            let id = `${coords.x},${coords.y}`;
            let t = this.metaData.tiles[id];
            if(t) {
                let tile = document.createElement('img');
                L.DomEvent.on(tile, 'load', L.Util.bind((<any>this)._tileOnLoad, this, done, tile));
                L.DomEvent.on(tile, 'error', L.Util.bind((<any>this), this, done, tile));
                if (this.options.crossOrigin || this.options.crossOrigin === '') {
                    tile.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
                }
                tile.alt = '';
                tile.setAttribute('role', 'presentation');
                tile.src = this._addTime((<any>this).getTileUrl(coords), t);
                return tile;
            } else {
                let tile = document.createElement('div');
                setTimeout(() => {
                    (<Function>(<any>this)._tileOnLoad).call(this, done, tile);
                }, 20);
                return tile;
            }
        }
        return super.createTile(coords, done);
    }

    _addTime(url: string, t: Date) {

        let s = url.split("?");
        url = s[0] + "?t=" + t.getTime();
        if (s.length > 1) {
            url += ("&" + s[1]);
        }
        return url;
    }
}