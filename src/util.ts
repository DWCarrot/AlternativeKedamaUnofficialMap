interface QueryKVPair {
    [key: string]: string
}

export class URL {

    parser: HTMLAnchorElement;

    constructor(url: string) {
        this.parser = document.createElement("a");
        this.parser.href = url;
    }

    get url() {
        return this.parser.href;
    }

    set url(s) {
        this.parser.href = s;
    }

    get protocol() {
        return this.parser.protocol;
    }

    set protocol(s) {
        this.parser.protocol = s;
    }

    get host() {
        return this.parser.host;
    }
    set host(s) {
        this.parser.host = s;
    }


    get hostname() {
        return this.parser.hostname;
    }

    set hostname(s) {
        this.parser.hostname = s;
    }

    get pathname() {
        return this.parser.pathname;
    }

    set pathname(s) {
        this.parser.pathname = s;
    }

    get query() {
        return this.parser.search;
    }
    set query(s) {
        this.parser.search = s;
    }

    get hash() {
        return this.parser.hash;
    }

    set hash(s) {
        this.parser.hash = s;
    }

    getQuery() {
        let query: QueryKVPair = {};
        if (this.parser.search) {
            this.parser.search.slice(1).split('&').forEach(function (part) {
                var i = part.indexOf('=');
                if (i > 0)
                    query[part.slice(0, i)] = part.slice(i + 1);
            }, this);
        }
        return query;
    }

    setQuery(query: QueryKVPair) {
        var search = '';
        for (var key in query) {
            search += String.prototype.concat.call('&', key, '=', query[key] === undefined ? '' : query[key]);
        }
        if (search !== '') {
            return this.parser.search = '?' + search.slice(1);
        } else {
            return this.parser.search = '';
        }
    }
}

export function isCrossOrigin(url: string) {
    let a = document.createElement("a");
    a.href = url;
    return a.origin != location.origin;
}

export function loadStyle(url: string, integrity?: string) {
    let link = document.createElement("link");
    link.rel = "stylesheet"
    link.href = url;
    if (integrity) {
        link.integrity = integrity;
    }
    if (isCrossOrigin(url)) {
        link.crossOrigin = "anonymous"
    }
    document.getElementsByTagName("body")[0].appendChild(link);
    return link;
}

export function addStyle(css: string) {
    let styles = document.getElementsByTagName("style");
    let style: HTMLStyleElement
    if (styles.length > 0) {
        style = styles[styles.length - 1];
    } else {
        style = document.createElement("style");
        document.getElementsByTagName("head")[0].appendChild(style);
    }
    style.innerHTML += css;
}


export function getJSON(url: string, success?: (data: any) => void, fail?: (req: XMLHttpRequest) => void, timeout?: number, method?: string, data?: any) {
    let req = new XMLHttpRequest();
    req.onreadystatechange = function (ev) {
        if (req.readyState == 4) {
            if (req.status == 200) {
                let data: string;
                try {
                    data = JSON.parse(req.responseText);
                } catch (error) {
                    if (fail instanceof Function) {
                        fail(req);
                    }
                    return;
                }
                if (success instanceof Function) {
                    success(data);
                }
            } else {
                if (fail instanceof Function) {
                    fail(req);
                }
            }
        }
    }
    if (method === undefined)
        method = "GET";
    req.open(method, url);
    if ("withCredentials" in req && timeout) {
        req.timeout = timeout;
    }
    req.send(data);
}

export function getWindowSize() {
    let w: number, h: number;
    if ("innerWidth" in window) {
        w = window.innerWidth;
        h = window.innerHeight;
    } else {
        let doc = document.documentElement || document.body;
        w = doc.clientWidth;
        h = doc.clientHeight;
    }
    return { w, h };
}

export class Klass {
    className: string;
    klass: any;

    newInstance() {
        
    }
}