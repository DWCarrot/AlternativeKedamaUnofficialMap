"use strict";
(function (info) {
    ///////////////////////////////////////////////////////////////////////////////
    //  fix IE11 compatibility
    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function (search, position) {
            if (position === undefined || position < 0) {
                position = 0;
            }
            return this.slice(position, position + search.length) === search;
        };
    }
    if (!String.prototype.endsWith) {
        String.prototype.endsWith = function (search, endPosition) {
            if (endPosition === undefined || endPosition > this.length) {
                endPosition = this.length;
            }
            return this.slice(endPosition - search.length, endPosition) === search;
        };
    }
    if (!console.table) {
        console.table = console.debug;
    }
    if (!Number.parseFloat) {
        Number.parseFloat = function (string) {
            return Number(string);
        };
    }
    if (!Number.parseInt) {
        Number.parseInt = function (string) {
            var v = Number(string);
            var i = Math.floor(v);
            if (v !== i)
                return NaN;
            return i;
        };
    }
    if (!Object.keys) {
        Object.keys = function (o) {
            var a = new Array();
            for (var k in o)
                a.push(k);
            return a;
        };
    }
    /////////////////////////////////////////////////////////////////////////
    console.debug = function () { };
    /**
     * @param cfg  <RequireConfig> now can use `integrity` and load css
     *      integrity: use {url:<string>, integrity:<string>} in config.paths
     *      css:       use `css!${moduleName}` or `css!${moduleName}#${any}` to bind css-loading to `moduleName` loading (`any` to avoid key conflict). `integrity` can also be used
     *          all the url can be absolute, relative to host or relative to baseURL
     *      default baseUrl are set to `data-main` module directory
     * @param entrance  the name of entrance-module
     */
    function config(cfg, entrance) {
        var scripts = document.querySelectorAll("script[data-main]");
        var script = scripts[scripts.length - 1];
        function absUrl(url, cfg) {
            if (url[0] === '/') {
                return location.origin + url;
            }
            var a = document.createElement("a");
            a.href = url;
            if (url === a.href) {
                return a.href;
            }
            a.href = cfg.baseUrl.slice(-1) === "/" ? cfg.baseUrl : (cfg.baseUrl + "/");
            a.href += url;
            return a.href;
        }
        var integrityList = {};
        var cssList = {};
        if (!cfg.baseUrl && script) {
            var dataMain = script.getAttribute("data-main");
            var i = dataMain.lastIndexOf('/');
            if (i > 0)
                cfg.baseUrl = dataMain.slice(0, i);
        }
        if (cfg.paths) {
            for (var name_1 in cfg.paths) {
                var val = cfg.paths[name_1];
                if (name_1.indexOf("css!") == 0) {
                    delete cfg.paths[name_1];
                    var i = name_1.indexOf("#", 4);
                    if (i < 0)
                        i = name_1.length;
                    name_1 = name_1.slice(4, i);
                    if (!(name_1 in cssList))
                        cssList[name_1] = [];
                    var link = document.createElement("link");
                    link.rel = "stylesheet";
                    if (val instanceof Object) {
                        link.href = absUrl(val.url + ".css", cfg);
                        if (val.integrity) {
                            link.integrity = val.integrity;
                            if (link.href.indexOf(location.origin) !== 0) {
                                link.crossOrigin = "anonymous";
                            }
                        }
                    }
                    else {
                        link.href = absUrl(val + ".css", cfg);
                    }
                    cssList[name_1].push(link);
                }
                else {
                    if (val instanceof Object) {
                        integrityList[name_1] = val.integrity;
                        cfg.paths[name_1] = val.url;
                    }
                }
            }
        }
        var nodeCount = 0;
        cfg.onNodeCreated = function (node, config, name, url) {
            if (nodeCount === 0 && ("" in cssList)) {
                cssList[""].forEach(function (link) {
                    this.appendChild(link);
                    link.addEventListener("load", function () {
                        console.debug("load css from \"" + link.href + "\"");
                    });
                }, document.getElementsByTagName("body")[0]);
            }
            if (name in integrityList) {
                node.integrity = integrityList[name];
                if (node.src.indexOf(location.origin) !== 0) {
                    node.crossOrigin = "anonymous";
                }
            }
            if (name in cssList) {
                node.addEventListener("load", function () {
                    cssList[name].forEach(function (link) {
                        this.appendChild(link);
                        link.addEventListener("load", function () {
                            console.debug("load css \"" + name + "\" from \"" + link.href + "\"");
                        });
                    }, document.getElementsByTagName("body")[0]);
                });
            }
            node.addEventListener("load", function () {
                console.debug("load module \"" + name + "\" from \"" + url + "\"");
            });
            ++nodeCount;
        };
        requirejs.config(cfg);
        requirejs([entrance], function () {
            if (info)
                console.info(info);
        });
    }
    ///////////////////////////////////////////////////////////////////////////////////////////
    //    
    //  
    //  
    //////////////////////////////////////////////////////////////////////////////////////////
    /**
     * main
     */
    config({
        paths: {
            "marked": "https://cdn.bootcss.com/marked/0.6.1/marked.min",
            "leaflet": {
                url: "https://unpkg.com/leaflet@1.4.0/dist/leaflet-src",
                integrity: "sha512-GBlVVqOnLycKN+z49gDABUY6RxEQjOw/GHFbpboxpTxAPJQ78C6pAjT08S/1fT9pWOy9PeyDqipC7cBwrfX2cA=="
            },
            "jquery": {
                url: "https://code.jquery.com/jquery-3.3.1.min",
                integrity: "sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8="
            },
            "jqueryui": "https://cdn.bootcss.com/jqueryui/1.12.1/jquery-ui",
            "jquery-editable-select": "lib/jquery-editable-select.min",
            "view/lib/easy-button": "https://cdn.jsdelivr.net/npm/leaflet-easybutton@2/src/easy-button",
            "css!leaflet": {
                url: "https://unpkg.com/leaflet@1.4.0/dist/leaflet",
                integrity: "sha512-puBpdR0798OZvTTbP4A8Ix/l+A4dHDD0DGqYW6RQ+9jxkRFclaxxQb/SJAWZfWAkuyeQUytO7+7N4QKrDh+drA=="
            },
            "css!view/akm": "css/akm",
            "css!view/AKM/MeasureControl": "css/AKM.MeasureControl",
            "css!view/AKM/MarkersControl": "css/AKM.MarkersControl",
            "css!view/AKM/YAKMMarkers": "css/AKM.YAKMMarkers",
            "css!view/AKM/DialogUI": "css/AKM.DialogUI",
            "css!#1": {
                url: "https://use.fontawesome.com/releases/v5.7.2/css/all",
                integrity: "sha384-fnmOCqbTlWIlj8LyTjo7mOUStjsKC4pOpQbqyi7RrhN7udi9RwhKkMHpvLbHG9Sr"
            },
            "css!jqueryui": "https://cdn.bootcss.com/jqueryui/1.12.1/jquery-ui",
            "css!jquery-editable-select": "lib/jquery-editable-select.min",
            "css!view/lib/easy-button": "https://cdn.jsdelivr.net/npm/leaflet-easybutton@2/src/easy-button"
        },
        waitSeconds: 10
    }, "view/akm");
})("\n====================================================================\n    Typescript \u00BB Alternative-KedamaCraft-Map (Unofficial)\n    \u00A9 2018-2019 KedamaMC Player Statistics & Visualization\n====================================================================\n\n");
//# sourceMappingURL=main.js.map