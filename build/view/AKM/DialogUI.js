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
define(["require", "exports", "leaflet", "jquery", "marked", "../lib/easy-button", "jqueryui"], function (require, exports, L, $, MD) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
                        div.innerHTML = MD(_this.options.context);
                        _this.dialog = $(div).dialog({
                            modal: true,
                            close: function () {
                                _this.dialog = undefined;
                            }
                        });
                        _this.dialog.parent().addClass("leaflet-control leaflet-akm-dialog").css("z-index", 1000);
                    }
                    else {
                        _this.dialog.dialog("close");
                        _this.dialog = undefined;
                    }
                },
                icon: "&nbsp;"
            });
            options.leafletClasses = true;
            var m = new Object();
            var id = L.Util.stamp(m);
            if (!options.id) {
                options.id = "akm_aboutdialog_button#" + id;
            }
            _this = _super.call(this, options) || this;
            for (var p in m) {
                _this[p] = m[p];
            } //set leaflet_id  
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
});
//# sourceMappingURL=DialogUI.js.map