/// #require L from leaflet.js
/// #require L.AKM.Util from L.AKM.Util.js

(function() {
	
	if(L.AKM === undefined)
		L.AKM = {};
	
	L.AKM.MarkerControl = L.Control.extend({
		
		options: {
			
			position: "topright",
			
			buttonSize: 30,
			
			buttonTitle: {
				add: "Add one marker",
				remove: "Remove selected marker",
				edit: "Edit selected marker",
				search: "Search markers",
				push: "Upload changes to server",
				load: "Load markers",
			},
			
			/**
			 * @option markerFactory	<Function> (<MarkerObj>) => (<L.Marker>)
					transform markerObj to marker, with popup or something else
			 */
			markerFactory: L.AKM.Util.basicMarkerBuilder,
			
			/**
			 * @option editUI			<Function> (<L.Marker>, <MarkerObj>, <L.AKM.MarkerControl>this) => ()
					perform UI to edit marker and markerObj
					need to call <L.AKM.MarkerControl>this.updateMarker() at the end of editUI()
			 */
			editUI: L.AKM.Util.basicMarkerEditUI,	//
			
			/**
			 * @option searchUI			<Function> (<Array<MarkerObj>>, <L.AKM.MarkerControl>this) => ()
					perform UI to search markers
			 */
			searchUI: L.AKM.Util.basicMarkerSearchUI,
			
			/**
			 * @option pushOperation	<Function> (<Array<MarkerObj>>, <L.AKM.MarkerControl>this) => ()
					perform UI to search markers
			 */
			pushOperation: L.AKM.Util.simulateUpload,
			
			/**
			 * @option loadOperation	<Function> (<Array<MarkerObj>>, <L.AKM.MarkerControl>this) => ()
					perform UI to search markers
			 */
			loadOperation: L.AKM.Util.simulateLoad,
			
			
			/**
			 * @option dataPro1			<Function> (<Array<MarkerObj>>, <L.AKM.MarkerControl>this) => ()
					perform UI to search markers
			 */
			dataPro1: null,
			
			
			/**
			 * @option dataPro2			<Function> (<Array<MarkerObj>>, <L.AKM.MarkerControl>this) => ()
					perform UI to search markers
			 */
			dataPro2: null,
		},
		
		initialize: function(markerList, options) {
			L.Util.setOptions(this, options);
			this._markers = {};
			if(typeof markerList === "string") {
				//this.reloadAsyn(this.options.url);
				this._url = markerList;
			} else {
				if(this.options.dataPro1 instanceof Function)
					markerList = this.options.dataPro1(markerList, this);
				this._addList(markerList);
			}
		},
		
		load: function(url) {
			if(url === undefined)
				url = this._url;
			L.AKM.Util.getJSON(
				url,
				function(markerList) {
					this._removeList();
					if(this.options.dataPro1 instanceof Function)
						markerList = this.options.dataPro1(markerList, this);
					this._addList(markerList);
				},
				this
			);
		},
		
		onAdd: function(map) {
		//	L.Control.prototype.onAdd.call(this, map);
			
			
			
			this._onAddMarkers(map);
			this._onAddControl(map);
			return this._control;
		},
		
		onRemove: function(map) {
			
			this._onRemoveMarkers(map);
			this._onRemoveControl(map);
			
		//	L.Control.prototype.onRemove.call(this, map);
		},
		
		/**
		 *	@param markerObj	{x:<Number>, z:<Number>, title:<String/HTML>, description:?<String/HTML>, icon:?<L.Icon>}
								<L.Marker>
		 */
		addMarker: function(markerObj, openPopup) {
			var layer;
			if(markerObj instanceof L.Marker) {
				layer = markerObj;
				var latlng = layer.getLatLng();
				markerObj = {x: latlng.lng, z:latlng.lat, title: ""};
			} else {
				layer = this.options.markerFactory(markerObj);
			}
			var id = L.Util.stamp(layer);
			this._markers[id] = {obj: markerObj, layer: layer};
			if(this._map) {
				this._map.addLayer(layer);
				if(openPopup)
					layer.openPopup();
			}
			return markerObj;
		},
		
		removeMarker: function(markerObj) {
			// <L.Marker> || id || markerObj
			var id, layer;
			if(markerObj instanceof L.Marker) {
				id = L.Util.stamp(markerObj);
				layer = markerObj;
				markerObj = this._markers[id].obj;
				delete this._markers[id];
			} else {
				if(markerObj in this._markers) {
					id = markerObj;
					layer = this._markers[id].layer;
					markerObj = this._markers[id].obj;
					delete this._markers[id];
				} else {
					for(id in this._markers) {
						if(this._markers[id].obj === markerObj) {
							layer = this._markers[id].layer;
							delete this._markers[id];
						}
					}
				}
			}
			if(this._map && layer)
				this._map.removeLayer(layer);
			return markerObj;
		},
		
		updateMarker: function(markerObj) {
			// <L.Marker> || id || markerObj
			markerObj = this.removeMarker(markerObj);
			this.addMarker(markerObj, true);
		},
		
		getMarkers: function(sort) {
			var list = new Array();
			for(var id in this._markers)
				list.push(this._markers[id].obj);
			if(list.length > 1 && sort) {
				var comp;
				if(sort instanceof Array) {
					comp = function(a, b) {
						for(var i = 0; i < sort.length; ++i) {
							a = a[sort[i]];
							b = b[sort[i]];
							if(a > b)
							return 1;
							if(a < b)
								return -1;
							return 0;
						}
					};
				} else {
					comp = function(a, b) {
						a = a[sort];
						b = b[sort];
						if(a > b)
							return 1;
						if(a < b)
							return -1;
						return 0;
					};
				}
				list.sort(comp);
			}
			return list;
		},
		
		_addList: function(markerList) {
			//add & try to show
			markerList.forEach(function(markerObj) {
				var layer = this.options.markerFactory(markerObj);
				var id = L.Util.stamp(layer);
				this._markers[id] = {obj: markerObj, layer: layer};
			}, this);
			if(this._map) {
				for(var id in this._markers) {
					this._map.addLayer(this._markers[id].layer);
				}
			}
		},
		
		
		_removeList: function() {
			// try to unshow and try to remove
			if(this._map) {
				for(var id in this._markers) {
					this._map.removeLayer(this._markers[id].layer);
				}
				this._markers = {};
			}
		},
		
		_onAddMarkers: function(map) {
			if(this._url && L.AKM.Util.isEmptyObj(this._markers)) {
				this.load(this._url);
			} else {
				for(var id in this._markers) {
					map.addLayer(this._markers[id].layer);
				}
			}
		},
		
		_onRemoveMarkers: function(map) {
			for(var id in this._markers) {
				map.removeLayer(this._markers[id].layer);
			}
		},
		
		_onAddControl: function(map) {
			var w = this.options.buttonSize;
			var tips = this.options.buttonTitle;
			this._control = L.DomUtil.create("div", "leaflet-control-markers leaflet-bar leaflet-control");
			var add = L.DomUtil.create("a", "leaflet-control-markers-add", this._control);
			add.name = "add";
			add.href = "#";
			add.title = tips.add;
			add.style.width = String(w) + "px";
			add.style.height = String(w) + "px";
			add.style.backgroundPositionX = String(-(w * 0)) + "px";
			L.DomEvent.on(add, "click", this._onCtrlAdd, this);
			var remove = L.DomUtil.create("a", "leaflet-control-markers-remove", this._control);
			remove.name = "remove"
			remove.href = "#";
			remove.title = tips.remove;
			remove.style.width = String(w) + "px";
			remove.style.height = String(w) + "px";
			remove.style.backgroundPositionX = String(-(w * 1)) + "px";
			L.DomEvent.on(remove, "click", this._onCtrlRemove, this);
			var edit = L.DomUtil.create("a", "leaflet-control-markers-edit", this._control);
			edit.name = "edit";
			edit.href = "#";
			edit.title = tips.edit;
			edit.style.width = String(w) + "px";
			edit.style.height = String(w) + "px";
			edit.style.backgroundPositionX = String(-(w * 2)) + "px";
			L.DomEvent.on(edit, "click", this._onCtrlEdit, this);
			var search = L.DomUtil.create("a", "leaflet-control-markers-search", this._control);
			search.name = "search";
			search.href = "#";
			search.title = tips.search;
			search.style.width = String(w) + "px";
			search.style.height = String(w) + "px";
			search.style.backgroundPositionX = String(-(w * 3)) + "px";
			L.DomEvent.on(search, "click", this._onCtrlSearch, this);
			var push = L.DomUtil.create("a", "leaflet-control-markers-push", this._control);
			push.name = "push";
			push.href = "#";
			push.title = tips.push;
			push.style.width = String(w) + "px";
			push.style.height = String(w) + "px";
			push.style.backgroundPositionX = String(-(w * 4)) + "px";
			L.DomEvent.on(push, "click", this._onCtrlPush, this);
			var load = L.DomUtil.create("a", "leaflet-control-markers-load", this._control);
			load.name = "load";
			load.href = "#";
			load.title = tips.load;
			load.style.width = String(w) + "px";
			load.style.height = String(w) + "px";
			load.style.backgroundPositionX = String(-(w * 5)) + "px";
			L.DomEvent.on(load, "click", this._onCtrlLoad, this);
		},
		
		_onRemoveControl: function(map) {
			this._onCtrlClear();
		},
		
		_onCtrlAdd: function(event) {
			if(this._onCtrlClear() === "add")
				return;
			this._menuFuc = event.target;
			this._menuFuc.classList.add("leaflet-control-markers-selected");
			var that = this;
			setTimeout(function() {
				that._map.on("click", that._onCtrlAddOne, that);
			}, 10);
			L.DomEvent.stopPropagation(event);
		},
		
		_onCtrlAddOne: function(event) {
			this._map.off("click", this._onCtrlAddOne, this);
			this._menuFuc.classList.remove("leaflet-control-markers-selected");
			this._menuFuc = undefined;
			var marker = new L.Marker(event.latlng);
			if(this.options.editUI instanceof Function)
				this.options.editUI(marker, this.addMarker(marker, true), this);
			L.DomEvent.stopPropagation(event);
		},
		
		_onCtrlEdit: function(event) {
			if(this._onCtrlClear() === "edit")
				return;
			this._menuFuc = event.target;
			this._menuFuc.classList.add("leaflet-control-markers-selected");
			var that = this;
			setTimeout(function() {
				for(var id in that._markers)
					that._markers[id].layer.on("click", that._onCtrlEditOne, that);
			}, 10);
			L.DomEvent.stopPropagation(event);
		},
		
		_onCtrlEditOne: function(event) {
			for(var id in this._markers)
				this._markers[id].layer.off("click", this._onCtrlEditOne, this);
			this._menuFuc.classList.remove("leaflet-control-markers-selected");
			this._menuFuc = undefined;
			if(this.options.editUI instanceof Function)
				this.options.editUI(event.target, this._markers[L.Util.stamp(event.target)].obj, this);
			L.DomEvent.stopPropagation(event);
		},
		
		_onCtrlRemove: function(event) {
			if(this._onCtrlClear() === "remove")
				return;
			this._menuFuc = event.target;
			this._menuFuc.classList.add("leaflet-control-markers-selected");
			var that = this;
			setTimeout(function() {
				for(var id in that._markers)
					that._markers[id].layer.on("click", that._onCtrlRemoveOne, that);
			}, 10);
			L.DomEvent.stopPropagation(event);
		},
		
		_onCtrlRemoveOne: function(event) {
			for(var id in this._markers)
				this._markers[id].layer.off("click", this._onCtrlRemoveOne, this);
			this._menuFuc.classList.remove("leaflet-control-markers-selected");
			this._menuFuc = undefined;
			this.removeMarker(event.target);
			L.DomEvent.stopPropagation(event);
		},
		
		_onCtrlSearch: function(event) {
			this._onCtrlClear();
			this._menuFuc = event.target;
			if(this.options.searchUI instanceof Function)
				this.options.searchUI(this.getMarkers(), this);
			this._menuFuc = undefined;
		},
		
		_onCtrlPush: function(event) {
			this._onCtrlClear();
			this._menuFuc = event.target;
			if(this.options.pushOperation instanceof Function)
				this.options.pushOperation(this.getMarkers(["icon", "title"]), this);
			else
				console.info('upload: ', this.getMarkers());
			this._menuFuc = undefined;
		},
		
		_onCtrlLoad: function(event) {
			this._onCtrlClear();
			this._menuFuc = event.target;
			if(this.options.pushOperation instanceof Function)
				this.options.loadOperation(this.getMarkers(["icon", "title"]), this);
			this._menuFuc = undefined;
		},
		
		_onCtrlClear: function() {
			if(this._menuFuc === undefined)
				return undefined;
			var last = this._menuFuc.name;
			switch(last) {
				case "add":
					this._map.off("click", this._onCtrlAddOne, this);
					this._menuFuc.classList.remove("leaflet-control-markers-selected");
					this._menuFuc = undefined;
					break;
				case "remove":
					for(var id in this._markers)
						this._markers[id].layer.off("click", this._onCtrlRemoveOne, this);
					this._menuFuc.classList.remove("leaflet-control-markers-selected");
					this._menuFuc = undefined;
					break;
				case "edit":
					for(var id in this._markers)
						this._markers[id].layer.off("click", this._onCtrlEditOne, this);
					this._menuFuc.classList.remove("leaflet-control-markers-selected");
					this._menuFuc = undefined;
				case "search":
					break;
				case "push":
					break;
				case "load":
					break;
			}
			return last;
		}
	});
	
	L.AKM.MarkerControlLayer = L.Layer.extend({
		
		initialize: function (markerList, options) {
			this.real = new L.AKM.MarkerControl(markerList, options);
		},
		
		onAdd: function(map) {
			map.addControl(this.real);
		},
		
		onRemove: function(map) {
			map.removeControl(this.real);
		}
	});
	
})();



