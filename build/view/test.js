define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var container = document.getElementById("map-container");
    exports.container = container;
    function genItem(n, obj) {
        var a = new Array();
        if (obj) {
            for (var i = 0; i < n; ++i) {
                var u = {
                    a: Math.random(),
                    b: 1.0 / (Math.random() + 1),
                    c: "hello" + Math.floor(Math.random() * 1000)
                };
                a.push(u);
            }
        }
        else {
            for (var i = 0; i < n; ++i) {
                var u = [
                    Math.random(),
                    1.0 / (Math.random() + 1),
                    "hello" + Math.floor(Math.random() * 1000)
                ];
                a.push(u);
            }
        }
        return a;
    }
    exports.genItem = genItem;
});
//# sourceMappingURL=test.js.map