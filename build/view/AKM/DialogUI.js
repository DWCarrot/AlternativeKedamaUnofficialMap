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
define(["require", "exports", "leaflet", "jquery", "marked", "../lib/easy-button", "jqueryui", "jquery-editable-select"], function (require, exports, L, $, MD) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function toTop(e) {
        e.parent().addClass("leaflet-control leaflet-akm-dialog").css("z-index", 1000);
    }
    var AboutDialog = /** @class */ (function (_super) {
        __extends(AboutDialog, _super);
        function AboutDialog(options) {
            var _this = this;
            options.tagName = "a";
            options.states = [];
            options.states.push({
                stateName: "About#0",
                title: "About",
                onClick: function (btn, map) {
                    if (!_this.dialog) {
                        var div = document.createElement("div");
                        div.title = "About";
                        div.innerHTML = _this.options.context;
                        _this.dialog = $(div).dialog({
                            modal: true,
                            close: function () {
                                _this.dialog = undefined;
                            }
                        });
                        toTop(_this.dialog);
                    }
                    else {
                        _this.dialog.dialog("close");
                        _this.dialog = undefined;
                    }
                },
                icon: "&nbsp;"
            });
            options.leafletClasses = true;
            if (options.context) {
                options.context = MD(options.context);
            }
            var m = new Object();
            var id = L.Util.stamp(m);
            if (!options.id) {
                options.id = "akm_aboutdialog_button#" + id;
            }
            _this = _super.call(this, options) || this;
            _this["_leaflet_id"] = m["_leaflet_id"]; //set leaflet_id  
            return _this;
        }
        AboutDialog.prototype.onAdd = function (map) {
            var _this = this;
            setTimeout(function () {
                var e = document.getElementById(_this.options.id);
                e.style.width = 24 + "px";
                e.style.height = 24 + "px";
                e.classList.add("leaflet-akm-aboutdialog-button");
            }, 1);
            return _super.prototype.onAdd.call(this, map);
        };
        return AboutDialog;
    }(L.Control.EasyButton));
    exports.AboutDialog = AboutDialog;
    var EditUI = /** @class */ (function () {
        function EditUI(builder) {
            this._builder = builder;
        }
        EditUI.prototype.open = function (data, callback) {
            var _this = this;
            var newData = this.simpleCopy(data);
            var container = document.createElement("table");
            var changed = {};
            for (var key in this._builder) {
                var t = this._builder[key];
                var tr = document.createElement("tr");
                //name
                var td1 = document.createElement("td");
                td1.classList.add("leaflet-akm-editui-table-td1");
                var span1 = document.createElement("span");
                span1.innerText = t.tip ? t.tip : key;
                td1.appendChild(span1);
                tr.appendChild(td1);
                //inputs
                var td2 = document.createElement("td");
                td2.classList.add("leaflet-akm-editui-table-td2");
                var e = t.toDom(data[key]);
                e.setAttribute("name", key);
                e.addEventListener("change", function (event) {
                    var e1 = event.target;
                    var key = e1.getAttribute("name");
                    var t1 = _this._builder[key];
                    var value = t1.fromDom(e1);
                    if (data[key] == value) {
                        delete changed[key];
                    }
                    else {
                        changed[key] = true;
                    }
                    newData[key] = value;
                });
                td2.appendChild(e);
                tr.appendChild(td2);
                container.appendChild(tr);
            }
            this.dialog = $(container).dialog({
                modal: true,
                width: "50%",
                buttons: [
                    {
                        text: "Cancel",
                        click: function () {
                            _this.close();
                        }
                    },
                    {
                        text: "Confirm",
                        click: function () {
                            _this.close();
                            if (Object.keys(changed).length > 0) {
                                callback(newData);
                            }
                        }
                    }
                ]
            });
            toTop(this.dialog);
        };
        EditUI.prototype.close = function () {
            if (this.dialog) {
                this.dialog.dialog("close");
                this.dialog = undefined;
            }
        };
        EditUI.prototype.simpleCopy = function (obj) {
            var r = new Object();
            for (var p in obj) {
                r[p] = obj[p];
            }
            return r;
        };
        return EditUI;
    }());
    exports.EditUI = EditUI;
    function editableSelect(list, value) {
        value = value || "";
        var select = document.createElement("select");
        list.forEach(function (v) {
            if (v) {
                var option = document.createElement("option");
                option.text = v;
                option.value = v;
                if (value == v)
                    option.selected = true;
                select.appendChild(option);
            }
        });
        setTimeout(function () {
            var c = select.parentElement;
            var e = $(select)
                .editableSelect()
                .on("select.editable-select", function (e, li) {
                select.value = li.text();
                var evt = document.createEvent("CustomEvent");
                evt.initCustomEvent("change", false, true, { target: select });
                select.dispatchEvent(evt);
            });
            var input = c.children[0];
            input.value = value;
        }, 1);
        return select;
    }
    exports.editableSelect = editableSelect;
    var SingleSearchUI = /** @class */ (function () {
        function SingleSearchUI(keyProp, show) {
            this._keyProp = keyProp;
            this._show = show;
            this._id = (Math.random() * new Date().getTime()).toString(36).split(".").join("");
            this.dialog = $("\n            <div id=\"SingleSearchUI-" + this._id + "\">\n                <div class=\"leaflet-akm-single_search_ui-search\">\n                    <input type=\"text\" class=\"leaflet-akm-single_search_ui-search-input\" />\n                </div>\n                <div class=\"leaflet-akm-single_search_ui-result\">\n                    <ul class=\"leaflet-akm-single_search_ui-search-list\">\n                    </ul>\n                </div>\n            </div>\n        ");
        }
        SingleSearchUI.prototype.open = function (dataset, callback, closeCallback) {
            var _this = this;
            this.dialog.dialog({
                title: "Search",
                modal: true,
                width: "50%",
                open: function (event, ui) {
                    var input = document.querySelector("#SingleSearchUI-" + _this._id + " input.leaflet-akm-single_search_ui-search-input");
                    var ul = document.querySelector("#SingleSearchUI-" + _this._id + " ul.leaflet-akm-single_search_ui-search-list");
                    var handle = 0;
                    var inputCallback = function () {
                        handle = 0;
                        if (input.value == "") {
                            return;
                        }
                        var res = _this.search(dataset, input.value);
                        ul.innerHTML = "";
                        res.forEach(function (r, i, arr) {
                            var li = document.createElement("li");
                            var c = this._show(r);
                            if (typeof (c) === "string") {
                                li.innerHTML = c;
                            }
                            else {
                                li.appendChild(c);
                            }
                            li.setAttribute("index", String(i));
                            li.addEventListener("click", function (event) {
                                var data = arr[Number.parseInt(this.getAttribute("index"))];
                                callback(data);
                            });
                            ul.appendChild(li);
                        }, _this);
                    };
                    input.addEventListener("input", function (event) {
                        if (handle) {
                            clearTimeout(handle);
                        }
                        handle = setTimeout(inputCallback, 500);
                    });
                },
                close: closeCallback,
            });
            toTop(this.dialog);
        };
        SingleSearchUI.prototype.close = function () {
            this.dialog.dialog("close");
        };
        SingleSearchUI.prototype.search = function (dataset, value) {
            var res = new Array();
            dataset.forEach(function (data) {
                var v1 = data[this._keyProp];
                var j = false;
                switch (typeof (v1)) {
                    case "number":
                        j = (v1 == Number(value));
                        break;
                    case "boolean":
                        j = (v1 = Boolean(value));
                        break;
                    case "string":
                        j = (v1.indexOf(value) >= 0);
                        break;
                }
                if (j) {
                    res.push(data);
                }
            }, this);
            return res;
        };
        return SingleSearchUI;
    }());
    exports.SingleSearchUI = SingleSearchUI;
});
// function _editableSelect(list: Array<string>, value: string) {
//     value = value || "";
//     let span = document.createElement("span");
//     span.classList.add("combox_border");
//     span.style.display = "inline";
//     span.style.position = "relative";
//     span.setAttribute("value", value);
//     let input = document.createElement("input");
//     input.classList.add("combox_input");
//     input.type = "text";
//     input.value = value;
//     span.appendChild(input);
//     let font = document.createElement("font");
//     font.classList.add("ficomoon", "icon-angle-bottom", "combox_button");
//     font.style.display = "inline-block";
//     span.appendChild(font);
//     let ul = document.createElement("ul");
//     ul.classList.add("combox_select");
//     ul.style.position = "absolute";
//     ul.style.top = 29 + "px";
//     ul.style.left = -1 + "px";
//     ul.style.display = "none";
//     list.forEach(function (value) {
//         let li = document.createElement("li");
//         let a = document.createElement("a");
//         a.href = "javascript:void(0)";
//         a.innerText = value;
//         a.addEventListener("click", function (event) {
//             let _a = <HTMLAnchorElement>event.target;
//             input.value = _a.innerText;
//             span.setAttribute("value", input.value);
//             simuOnChange(span);
//             ul.style.display = "none";
//             font.classList.remove("icon-angle-top");
//             font.classList.add("icon-angle-bottom");
//         })
//         li.appendChild(a);
//         ul.appendChild(li);
//     });
//     span.appendChild(ul);
//     input.addEventListener("change", function (event) {
//         let _input = <HTMLInputElement>event.target;
//         span.setAttribute("value", _input.value);
//         simuOnChange(span);
//     })
//     font.addEventListener("click", function (event) {
//         let _font = <HTMLFontElement>event.target;
//         if (ul.style.display === "none") {
//             ul.style.display = "";
//             _font.classList.remove("icon-angle-bottom")
//             _font.classList.add("icon-angle-top");
//         } else {
//             ul.style.display = "none";
//             _font.classList.remove("icon-angle-top");
//             _font.classList.add("icon-angle-bottom");
//         }
//     });
//     return span;
// }
//# sourceMappingURL=DialogUI.js.map