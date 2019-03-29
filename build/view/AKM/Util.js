/////////////////////////////////////////////////////////////////////////
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var base = location.href.slice(0, location.href.lastIndexOf("/")) + "/";
    function setBase(url) {
        var a = document.createElement("a");
        if (!url.endsWith("/"))
            url += "/";
        a.href = url;
        base = a.href;
    }
    exports.setBase = setBase;
    function getAbsoluteUrl(url, baseUrl) {
        if (baseUrl === undefined)
            baseUrl = base;
        if (!baseUrl.endsWith("/"))
            baseUrl += "/";
        var a = document.createElement("a");
        a.href = url;
        if (url.startsWith(a.origin)) {
            url = a.href;
        }
        else {
            if (url.startsWith("/")) {
                url = a.href;
            }
            else {
                a.href = baseUrl;
                a.pathname += url;
                url = a.href;
            }
        }
        return url;
    }
    exports.getAbsoluteUrl = getAbsoluteUrl;
    /**
     *
     * @param url       css url to beloaded; can be absolute or relative(modified with baseUrl)
     * @param integrity
     */
    function loadStyle(url, integrity) {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = url = getAbsoluteUrl(url, base);
        if (integrity) {
            link.integrity = integrity;
        }
        if (!url.startsWith(location.origin)) {
            link.crossOrigin = "anonymous";
        }
        var body = document.getElementsByTagName("body")[0];
        body.appendChild(link);
        return link;
    }
    exports.loadStyle = loadStyle;
    /**
     *
     * @param css
     */
    function addStyle(css) {
        var styles = document.getElementsByTagName("style");
        var style;
        if (styles.length > 0) {
            style = styles[styles.length - 1];
        }
        else {
            style = document.createElement("style");
            var head = document.getElementsByTagName("head")[0];
            head.appendChild(style);
        }
        style.innerHTML += css;
    }
    exports.addStyle = addStyle;
    /**
     *
     * @param container     object with defalut option values
     * @param options       object with (part of) option values to set
     * @returns             ref of `container`, combine options into container
     */
    function setOptions(container, options) {
        if (typeof options === "object") {
            for (var i in options) {
                container[i] = options[i];
            }
        }
        return container;
    }
    exports.setOptions = setOptions;
    /**
     *
     * @example
     *      `s1, s2, b3, s3, b4, s4, s5, null, s6, null, s7`
     * =>   `s1 + s2 + b3 ? ( s3 + (b4 ? (s4 + s5) : "") + s6 ) : "" + s7`
     */
    function conditionalJoin() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var ls = new Array();
        var depth = 0;
        for (var i = 0, skip = false; i < arguments.length; ++i) {
            var arg = arguments[i];
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
    exports.conditionalJoin = conditionalJoin;
    /**
     *
     * @param url
     * @param success
     * @param fail
     * @param timeout
     * @param method
     * @param data
     */
    function getJSON(url, success, fail, timeout, method, data) {
        var req = new XMLHttpRequest();
        req.onreadystatechange = function (ev) {
            if (req.readyState == 4) {
                if (req.status == 200) {
                    var data_1;
                    try {
                        data_1 = JSON.parse(req.responseText);
                    }
                    catch (error) {
                        if (fail instanceof Function) {
                            fail(req, error);
                        }
                        return;
                    }
                    if (success instanceof Function) {
                        success(data_1);
                    }
                }
                else {
                    if (fail instanceof Function) {
                        fail(req);
                    }
                }
            }
        };
        if (method === undefined)
            method = "GET";
        req.open(method, url);
        if ("withCredentials" in req && timeout) {
            req.timeout = timeout;
        }
        req.send(data);
    }
    exports.getJSON = getJSON;
    /**
     *
     * @param msg   exception message
     * @param args  other properties to be add
     */
    var Exception = /** @class */ (function (_super) {
        __extends(Exception, _super);
        function Exception(name, msg, args) {
            var _this = _super.call(this, msg) || this;
            if (typeof (args) === "object") {
                for (var prop in args) {
                    _this[prop] = args[prop];
                }
            }
            _this.name = name;
            _this.msg = msg;
            if (_this.stack) {
                var i = _this.stack.lastIndexOf("\n", _this.stack.length - 2);
                _this.stack = _this.stack.slice(0, i + 1);
            }
            return _this;
        }
        return Exception;
    }(Error));
    exports.Exception = Exception;
});
//# sourceMappingURL=Util.js.map