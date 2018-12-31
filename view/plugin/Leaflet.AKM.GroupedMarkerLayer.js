
/// #require L from leaflet.js
/// #require L.AKM.Util from L.AKM.Util.js


if(L.AKM === undefined)
	L.AKM = {};

/**
 *
 *	@param	markerList	<Array<:marker-record>>
 *					<:marker-record>: {x: <Number>, z: <Number>, title: <String/HtmlString>, icon <L.Icon>?, description <String/HtmlString>?, ...}
 *	@param	options
 *			options.formatter: <function> (<:marker-record>)=>(<String>)
 *			options.dataPrePro: <function> (<any>json-data)=>(<Array<:marker-record>>)
 */
L.AKM.GroupedMarkerLayer = L.LayerGroup.extend({
	
	options: {
		pane: 'overlayPane',
		attribution: null,
		url: null,
		dataPrePro: L.AKM.Util.basicMarkerDataProcess,
		formatter: L.AKM.Util.basicMarkerFormatter,
		
	},
	
	initialize: function(markerList, options) {
		L.Util.setOptions(this, options);
		this._layers = {};
		this._markerList = {};
		if(this.options.url) {
			//this.reloadAsyn(this.options.url);
		} else {
			this._generateLayers(markerList).forEach(function(layer) {
				this.addLayer(layer);
			}, this);
		}
	},
	
	reloadAsyn: function(url) {
		L.AKM.Util.getJSON(
			url,
			function(data) {
				if(typeof this.options.dataPrePro == "function")
					data = this.options.dataPrePro(data);
				this._markerList = {};
				this._generateLayers(data).forEach(function(layer) {
					this.addLayer(layer);
				}, this);
			},
			this,
			undefined,
			undefined,
			true,
			5000
		);
	},
	
	onAdd: function(map) {
		L.LayerGroup.prototype.onAdd.call(this, map);
		if(this.options.url && L.AKM.Util.isEmptyObj(this._layers))
			this.reloadAsyn(this.options.url);
		if(this._AKMmgg_cb && !this._AKMmgg_rm) {
			map.on('click', this._AKMmgg_cb);
			this._AKMmgg_rm = true;
		}
	},
	
	onRemove: function(map) {
		map.off('click', this._AKMmgg_cb);
		this._AKMmgg_rm = false;
		this._AKMmgg_sel = false;
		L.LayerGroup.prototype.onRemove.call(this, map);
	},
	
	canEdit: function() {
		return this._AKMmgg_cb instanceof Function;
	},
	
	enableEdit: function() {
		var that = this;
		this._AKMmgg_cb = function(event) {
			that.addMarker({x: Math.round(event.latlng.lng), z: Math.round(event.latlng.lat), title: 'new marker'}, true);
		}
		if(this._map) {
			this._map.on('click', this._AKMmgg_cb);
			this._AKMmgg_rm = true;
		}
		return this;
	},
	
	disableEdit: function() {
		this._AKMmgg_rm = false;
		if(this._map) {
			this._map.off('click', this._AKMmgg_cb);
			this._AKMmgg_cb = undefined;
		}
		return this;
	},
	
	
	
	startMarkerSelect: function() {
		this._selected = [];
		this._AKMmgg_sel = true;
		return this;
	},
	
	stopMarkerSelect: function() {
		this._AKMmgg_sel = false;
		return this;
	},
	
	inMarkerSelect: function() {
		return this._AKMmgg_sel;
	},
	
	getMarkers: function(selected) {
		var layers = selected ? this._selected : this.getLayers();
		var markerList = [];
		if(layers)
			for(var i = 0; i < layers.length; ++i)
				markerList.push(this._markerList[L.Util.stamp(layers[i])]);
		return markerList;
	},
	
	addMarker: function(markerObj, showPopup) {
		var layer = L.marker([markerObj.z, markerObj.x]).bindPopup(this.options.formatter(markerObj));
		var that = this;
		if(markerObj.icon)
			layer.setIcon(markerObj.icon);
		this._markerList[L.Util.stamp(layer)] = markerObj;
		layer.on('click', function(event) {
			var layer1 = event.target;
			if(that._AKMmgg_rm)
				that.removeLayer(layer1);
			if(that._AKMmgg_sel)
				that._selected.push(layer1);
		});
		this.addLayer(layer);
		if(showPopup)
			layer.openPopup();
		return layer;
	},
	
	removeMarker: function(marker) {
		this.removeLayer(marker);
		var i = L.Util.stamp(marker);
		var r = this._markerList[i];
		delete this._markerList[i];
		return r;
	},
	
	_generateLayers: function(markerList) {
		var that = this;
		var layers = [];
		for(var i = 0; i < markerList.length; ++i) {
			var markerObj = markerList[i];
			var layer = L.marker([markerObj.z, markerObj.x]).bindPopup(this.options.formatter(markerObj));
			if(markerObj.icon)
				layer.setIcon(markerObj.icon);
			this._markerList[L.Util.stamp(layer)] = markerObj;
			layer.on('click', function(event) {
				var layer1 = event.target;
				if(that._AKMmgg_rm)
					that.removeLayer(layer1);
				if(that._AKMmgg_sel)
					that._selected.push(layer1);
			});
			layers.push(layer);
		}
		return layers;
	},
	
	marker2latlng: function(markerObj) {
		if(markerObj instanceof Array) {
			var ls = new Array();
			markerObj.forEach(function(value) {
				ls.push(this.marker2latlng(value));
			}, this);
			return ls;
		}
		return new L.LatLng(markerObj.z, markerObj.x)
	}
});

