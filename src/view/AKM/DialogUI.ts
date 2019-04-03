import "../lib/easy-button"
import "jqueryui"
import "jquery-editable-select"
import * as L from "leaflet";
import * as $ from "jquery";
import * as MD from "marked";


export interface AboutDialogOptions extends L.EasyButtonOptions {
    /** context to show in About Dialog; in markdown format */
    context: string
}

function toTop(e: JQuery<HTMLElement>) {
    e.parent().addClass("leaflet-control leaflet-akm-dialog").css("z-index", 1000);
}

export class AboutDialog extends L.Control.EasyButton {

    options: AboutDialogOptions;

    dialog: JQuery<HTMLElement>;

    constructor(options?: AboutDialogOptions) {
        options.tagName = "a";
        options.states = [];
        options.states.push({
            stateName: "About#0",
            title: "About",
            onClick: (btn, map) => {
                if (!this.dialog) {
                    let div = document.createElement("div");
                    div.title = "About";
                    div.innerHTML = this.options.context;
                    this.dialog = $(div).dialog({
                        modal: true,
                        close: () => {
                            this.dialog = undefined;
                        }
                    });
                    toTop(this.dialog);
                } else {
                    this.dialog.dialog("close");
                    this.dialog = undefined;
                }
            },
            icon: "&nbsp;"
        });
        options.leafletClasses = true;
        if (options.context) {
            options.context = MD(options.context);
        }
        let m = new Object();
        let id = L.Util.stamp(m);
        if (!options.id) {
            options.id = "akm_aboutdialog_button#" + id;
        }
        super(options);
        (<any>this)["_leaflet_id"] = (<any>m)["_leaflet_id"];   //set leaflet_id  
    }

    onAdd(map: L.Map) {
        setTimeout(() => {
            let e = document.getElementById(this.options.id);
            e.style.width = 24 + "px";
            e.style.height = 24 + "px";
            e.classList.add("leaflet-akm-aboutdialog-button");
        }, 1);
        return super.onAdd(map);
    }

}

export interface PropBuilder {
    [key: string]: {
        toDom(value: any): HTMLElement
        fromDom(e: HTMLElement): any
        tip?: string
    }
}

export class EditUI<T> {

    dialog: JQuery<HTMLElement>;

    _builder: PropBuilder;

    _changed: boolean;

    constructor(builder: PropBuilder) {
        this._builder = builder;
    }

    open(data: T, callback: (newData: T) => void) {
        let newData = this.simpleCopy(data);
        let container = document.createElement("table");
        let changed: { [key: string]: boolean } = {};
        for (let key in this._builder) {
            let t = this._builder[key];

            let tr = document.createElement("tr");

            //name
            let td1 = document.createElement("td");
            td1.classList.add("leaflet-akm-editui-table-td1");
            let span1 = document.createElement("span");
            span1.innerText = t.tip ? t.tip : key;
            td1.appendChild(span1);
            tr.appendChild(td1);

            //inputs
            let td2 = document.createElement("td");
            td2.classList.add("leaflet-akm-editui-table-td2")
            let e = t.toDom((<any>data)[key]);
            e.setAttribute("name", key);
            e.addEventListener("change", (event) => {
                let e1 = <HTMLElement>event.target;
                let key = e1.getAttribute("name");
                let t1 = this._builder[key];
                let value = t1.fromDom(e1);
                if ((<any>data)[key] == value) {
                    delete changed[key];
                } else {
                    changed[key] = true;
                }
                (<any>newData)[key] = value;
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
                    click: () => {
                        this.close();
                    }
                },
                {
                    text: "Confirm",
                    click: () => {
                        this.close();
                        if (Object.keys(changed).length > 0) {
                            callback(newData);
                        }
                    }
                }
            ]
        });
        toTop(this.dialog);
    }

    close() {
        if (this.dialog) {
            this.dialog.dialog("close");
            this.dialog = undefined;
        }
    }


    simpleCopy(obj: T) {
        let r = <T>new Object();
        for (let p in obj) {
            r[p] = obj[p];
        }
        return r;
    }


}

export function editableSelect(list: Array<string>, value: string) {
    value = value || "";
    let select = document.createElement("select");
    list.forEach(function (v) {
        if (v) {
            let option = document.createElement("option");
            option.text = v;
            option.value = v;
            if (value == v)
                option.selected = true;
            select.appendChild(option);
        }
    });
    setTimeout(() => {  //`setTimeout` make sure select is added to document
        let c = select.parentElement;
        let e = $(select)
            .editableSelect()
            .on("select.editable-select", function (e, li) {
                select.value = li.text();
                let evt = document.createEvent("CustomEvent");
                evt.initCustomEvent("change", false, true, { target: select });
                select.dispatchEvent(evt);
            });
        let input = <HTMLInputElement>c.children[0];
        input.value = value;
    }, 1);
    return select;
}


export class SingleSearchUI<T> {

    _keyProp: string;
    _show: (data: T) => HTMLElement | string;
    _id: string;

    dialog: JQuery<HTMLElement>;

    constructor(keyProp: string, show: (data: T) => HTMLElement | string) {
        this._keyProp = keyProp;
        this._show = show;
        this._id = (Math.random() * new Date().getTime()).toString(36).split(".").join("");
        this.dialog = $(`
            <div id="SingleSearchUI-${this._id}">
                <div class="leaflet-akm-single_search_ui-search">
                    <input type="text" class="leaflet-akm-single_search_ui-search-input" />
                </div>
                <div class="leaflet-akm-single_search_ui-result">
                    <ul class="leaflet-akm-single_search_ui-search-list">
                    </ul>
                </div>
            </div>
        `);
    }

    open(dataset: Array<T>, callback: (data: T) => void, closeCallback?: (event: Event) => void) {
        this.dialog.dialog({
            title: "Search",
            modal: true,
            width: "50%",
            open: (event, ui) => {
                let input = <HTMLInputElement>document.querySelector(`#SingleSearchUI-${this._id} input.leaflet-akm-single_search_ui-search-input`);
                let ul = <HTMLUListElement>document.querySelector(`#SingleSearchUI-${this._id} ul.leaflet-akm-single_search_ui-search-list`);
                let handle = 0;
                let inputCallback = () => {
                    handle = 0;
                    if (input.value == "") {
                        return;
                    }
                    let res = this.search(dataset, input.value);
                    ul.innerHTML = "";
                    res.forEach(function (this: SingleSearchUI<T>, r, i, arr) {
                        let li = document.createElement("li");
                        let c = this._show(r);
                        if (typeof (c) === "string") {
                            li.innerHTML = c;
                        } else {
                            li.appendChild(c);
                        }
                        li.setAttribute("index", String(i));
                        li.addEventListener("click", function (event) {
                            let data = arr[Number.parseInt(this.getAttribute("index"))];
                            callback(data);
                        });
                        ul.appendChild(li);
                    }, this);
                }
                input.addEventListener("input", (event) => {
                    if (handle) {
                        clearTimeout(handle);
                    }
                    handle = setTimeout(inputCallback, 500);
                });
            },
            close: closeCallback,
        });
        toTop(this.dialog);
    }

    close() {
        this.dialog.dialog("close");
    }

    search(dataset: Array<T>, value: string) {
        let res = new Array<T>();
        dataset.forEach(function (this: SingleSearchUI<T>, data) {
            let v1 = (<any>data)[this._keyProp];
            let j = false;
            switch (typeof (v1)) {
                case "number": j = (v1 == Number(value)); break;
                case "boolean": j = (v1 = Boolean(value)); break;
                case "string": j = (v1.indexOf(value) >= 0); break;
            }
            if (j) {
                res.push(data);
            }
        }, this);
        return res;
    }
}

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

