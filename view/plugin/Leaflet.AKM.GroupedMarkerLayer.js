
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
		if(this.options.url) {
			L.AKM.Util.getJSON(
				this.options.url,
				function(data, that) {
					if(typeof that.options.dataPrePro == "function")
						data = that.options.dataPrePro(data);
					that._generateLayers(data).forEach(function(layer) {
						this.addLayer(layer);
					}, that);
				},
				this,
				null,
				null,
				true,
				5000
			);
		} else {
			this._generateLayers(markerList).forEach(function(layer) {
				this.addLayer(layer);
			}, this);
		}
	},
	
	onAdd: function(map) {
		L.LayerGroup.prototype.onAdd.call(this, map);
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
			that.addMarker({x: Math.round(event.latlng.lng), z: Math.round(event.latlng.lat)}, true);
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
	
	getMarkers: function(selected) {
		var layers = selected ? this._selected : this.getLayers();
		var markerList = [];
		if(layers)
			for(var i = 0; i < layers.length; ++i)
				markerList.push(layers[i]._AKMmgm);
		return markerList;
	},
	
	addMarker: function(marker, showPopup) {
		var layer = L.marker([marker.z, marker.x]).bindPopup(this.options.formatter(marker));
		var that = this;
		if(marker.icon)
			layer.setIcon(marker.icon);
		layer._AKMmgm = marker;
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
	
	_generateLayers: function(markerList) {
		var that = this;
		var layers = [];
		for(var i = 0; i < markerList.length; ++i) {
			var marker = markerList[i];
			var layer = L.marker([marker.z, marker.x]).bindPopup(this.options.formatter(marker));
			if(marker.icon)
				layer.setIcon(marker.icon);
			layer._AKMmgm = marker;
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
	
	
});