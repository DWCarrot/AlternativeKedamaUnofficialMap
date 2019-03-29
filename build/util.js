define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var URL = /** @class */ (function () {
        function URL(url) {
            this.parser = document.createElement("a");
            this.parser.href = url;
        }
        Object.defineProperty(URL.prototype, "url", {
            get: function () {
                return this.parser.href;
            },
            set: function (s) {
                this.parser.href = s;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(URL.prototype, "protocol", {
            get: function () {
                return this.parser.protocol;
            },
            set: function (s) {
                this.parser.protocol = s;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(URL.prototype, "host", {
            get: function () {
                return this.parser.host;
            },
            set: function (s) {
                this.parser.host = s;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(URL.prototype, "hostname", {
            get: function () {
                return this.parser.hostname;
            },
            set: function (s) {
                this.parser.hostname = s;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(URL.prototype, "pathname", {
            get: function () {
                return this.parser.pathname;
            },
            set: function (s) {
                this.parser.pathname = s;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(URL.prototype, "query", {
            get: function () {
                return this.parser.search;
            },
            set: function (s) {
                this.parser.search = s;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(URL.prototype, "hash", {
            get: function () {
                return this.parser.hash;
            },
            set: function (s) {
                this.parser.hash = s;
            },
            enumerable: true,
            configurable: true
        });
        URL.prototype.getQuery = function () {
            var query = {};
            if (this.parser.search) {
                this.parser.search.slice(1).split('&').forEach(function (part) {
                    var i = part.indexOf('=');
                    if (i > 0)
                        query[part.slice(0, i)] = part.slice(i + 1);
                }, this);
            }
            return query;
        };
        URL.prototype.setQuery = function (query) {
            var search = '';
            for (var key in query) {
                search += String.prototype.concat.call('&', key, '=', query[key] === undefined ? '' : query[key]);
            }
            if (search !== '') {
                return this.parser.search = '?' + search.slice(1);
            }
            else {
                return this.parser.search = '';
            }
        };
        return URL;
    }());
    exports.URL = URL;
    function isCrossOrigin(url) {
        var a = document.createElement("a");
        a.href = url;
        return a.origin != location.origin;
    }
    exports.isCrossOrigin = isCrossOrigin;
    function loadStyle(url, integrity) {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = url;
        if (integrity) {
            link.integrity = integrity;
        }
        if (isCrossOrigin(url)) {
            link.crossOrigin = "anonymous";
        }
        document.getElementsByTagName("body")[0].appendChild(link);
        return link;
    }
    exports.loadStyle = loadStyle;
    function addStyle(css) {
        var styles = document.getElementsByTagName("style");
        var style;
        if (styles.length > 0) {
            style = styles[styles.length - 1];
        }
        else {
            style = document.createElement("style");
            document.getElementsByTagName("head")[0].appendChild(style);
        }
        style.innerHTML += css;
    }
    exports.addStyle = addStyle;
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
                            fail(req);
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
    function getWindowSize() {
        var w, h;
        if ("innerWidth" in window) {
            w = window.innerWidth;
            h = window.innerHeight;
        }
        else {
            var doc = document.documentElement || document.body;
            w = doc.clientWidth;
            h = doc.clientHeight;
        }
        return { w: w, h: h };
    }
    exports.getWindowSize = getWindowSize;
    var Klass = /** @class */ (function () {
        function Klass() {
        }
        Klass.prototype.newInstance = function () {
        };
        return Klass;
    }());
    exports.Klass = Klass;
});
//# sourceMappingURL=util.js.map