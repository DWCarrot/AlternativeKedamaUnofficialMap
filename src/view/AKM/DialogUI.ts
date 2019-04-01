import "../lib/easy-button"
import "jqueryui"
import * as L from "leaflet";
import * as $ from "jquery";
import * as MD from "marked";

export interface AboutDialogOptions extends L.EasyButtonOptions {
    context: string //in markdown
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
                    div.innerHTML = MD(this.options.context);
                    this.dialog = $(div).dialog({
                        modal: true,
                        close: () => { 
                            this.dialog = undefined; 
                        }
                    });
                    this.dialog.parent().addClass("leaflet-control leaflet-akm-dialog").css("z-index", 1000);
                } else {
                    this.dialog.dialog("close");
                    this.dialog = undefined;
                }
            },
            icon: "&nbsp;"
        });
        options.leafletClasses = true;
        let m = new Object();
        let id = L.Util.stamp(m);
        if (!options.id) {
            options.id = "akm_aboutdialog_button#" + id;
        }
        super(options);
        for (let p in m) {
            (<any>this)[p] = (<any>m)[p];
        }   //set leaflet_id  
    }

    onAdd(map: L.Map) {
        setTimeout(() => {
            let e = document.getElementById(this.options.id);
            e.style.width = 24 + "px";
            e.style.height = 24 + "px";
            e.classList.add("leaflet-akm-aboutdialog-button");
        }, 1)
        return super.onAdd(map);
    }

}

