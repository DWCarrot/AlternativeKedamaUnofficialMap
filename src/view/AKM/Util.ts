

/////////////////////////////////////////////////////////////////////////

var base = location.href.slice(0, location.href.lastIndexOf("/")) + "/";

export function setBase(url: string) {
    let a = document.createElement("a");
    if (!url.endsWith("/"))
        url += "/";
    a.href = url;
    base = a.href;
}

export function getAbsoluteUrl(url: string, baseUrl?: string) {
    if (baseUrl === undefined)
        baseUrl = base;
    if (!baseUrl.endsWith("/"))
        baseUrl += "/";
    let a = document.createElement("a");
    a.href = url;
    if (url.startsWith(a.origin)) {
        url = a.href;
    } else {
        if (url.startsWith("/")) {
            url = a.href;
        } else {
            a.href = baseUrl;
            a.pathname += url;
            url = a.href;
        }
    }
    return url;
}

/**
 * 
 * @param url       css url to beloaded; can be absolute or relative(modified with baseUrl)
 * @param integrity 
 */
export function loadStyle(url: string, integrity?: string) {
    let link = document.createElement("link");
    link.rel = "stylesheet"
    link.href = url = getAbsoluteUrl(url, base);
    if (integrity) {
        link.integrity = integrity;
    }
    if (!url.startsWith(location.origin)) {
        link.crossOrigin = "anonymous"
    }
    let body = document.getElementsByTagName("body")[0];
    body.appendChild(link);
    return link;
}

/**
 * 
 * @param css 
 */
export function addStyle(css: string) {
    let styles = document.getElementsByTagName("style");
    let style: HTMLStyleElement
    if (styles.length > 0) {
        style = styles[styles.length - 1];
    } else {
        style = document.createElement("style");
        let head = document.getElementsByTagName("head")[0];
        head.appendChild(style);
    }
    style.innerHTML += css;
}

/**
 * 
 * @param container     object with defalut option values 
 * @param options       object with (part of) option values to set
 * @returns             ref of `container`, combine options into container
 */
export function setOptions(container: any, options: any) {
    if (typeof options === "object") {
        for (let i in options) {
            container[i] = options[i];
        }
    }
    return container;
}

/**
 * 
 * @example
 *      `s1, s2, b3, s3, b4, s4, s5, null, s6, null, s7`
 * =>   `s1 + s2 + b3 ? ( s3 + (b4 ? (s4 + s5) : "") + s6 ) : "" + s7` 
 */
export function conditionalJoin(...args: Array<String | boolean>) {
    let ls = new Array<String>();
    let depth = 0;
    for (let i = 0, skip = false; i < arguments.length; ++i) {
        let arg = arguments[i];
        if (arg === null) {
            --depth;
            if (depth < 0)
                throw new Exception("InvalidArgumentException", "Invalid input", { args: arguments, index: i });
            if (depth === 0 && skip)
                skip = false;
            continue;
        }
        if (typeof (arg) === "boolean") {
            ++depth;
            if (skip)
                continue;
            if (arg === false)
                skip = true;
            continue;
        }
        if (skip === false) {
            ls.push(arg);
        }
    }
    if (depth !== 0)
        throw new Exception("InvalidArgumentException", "Invalid input", { args: arguments, index: arguments.length });
    return ls.join("");
}

/**
 * 
 * @param url 
 * @param success 
 * @param fail 
 * @param timeout 
 * @param method 
 * @param data 
 */
export function getJSON(
    url: string,
    success?: (data: any) => void, 
    fail?: (req: XMLHttpRequest, error?: Exception) => void, 
    timeout?: number, 
    method?: string, 
    data?: any
) {
    let req = new XMLHttpRequest();
    req.onreadystatechange = function (ev) {
        if (req.readyState == 4) {
            if (req.status == 200) {
                let data: string;
                try {
                    data = JSON.parse(req.responseText);
                } catch (error) {
                    if (fail instanceof Function) {
                        fail(req, error);
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

/**
 * 
 * @param msg   exception message
 * @param args  other properties to be add 
 */
export class Exception extends Error {

    msg: string;

    name: string;

    [key: string]: any;

    constructor(name: string, msg: string, args?: { [key: string]: any }) {
        super(msg);
        if (typeof (args) === "object") {
            for (let prop in args) {
                this[prop] = args[prop];
            }
        }
        this.name = name;
        this.msg = msg;
        if (this.stack) {
            let i = this.stack.lastIndexOf("\n", this.stack.length - 2);
            this.stack = this.stack.slice(0, i + 1);
        }
    }
}




