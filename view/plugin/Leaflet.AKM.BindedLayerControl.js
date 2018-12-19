
/// #require L from leaflet.js
/// #require L.AKM.Util from L.AKM.Util.js

if(L.AKM === undefined)
	L.AKM = {};

/**
 *
 *
 */
 
L.AKM.BindedLayerControl = L.Control.Layers.extend({
	
	options: {
		collapsed: true,
		position: 'topright',
		autoZIndex: true,
		hideSingleBase: false,
		sortLayers: false,
		sortFunction: function (layerA, layerB, nameA, nameB) {
			return nameA < nameB ? -1 : (nameB < nameA ? 1 : 0);
		},
	},

	initialize: function (options) {
		L.Util.setOptions(this, options);
		this._layerControlInputs = [];
		this._layers = [];
		this._lastZIndex = 0;
		this._handlingClick = false;
		
		this._akm_data = {};
		this._selected = null;
	},
	
	registerBaseLayer: function(layer, name) {
		var record = this._akm_data[name];
		if(!record) {
			record = this._akm_data[name] = {
				baselayer: null,
				crs: null,
				overlayers: {
					uncontrolled: {},
					selected: {},
					unselected: {},
				},
			};
		}
		record.baselayer = layer;
		return this._map ? this.addBaseLayer(layer, name) : this;
	},
	
	registerCRS: function(crs, name) {
		var record = this._akm_data[name];
		if(!record) {
			record = this._akm_data[name] = {
				baselayer: null,
				crs: null,
				overlayers: {
					uncontrolled: {},
					selected: {},
					unselected: {},
				},
			};
		}
		record.crs = crs;
		if(this._map && this._selected == name) {
			this._map.options.crs = crs;
		}
	},
	
	registerOverlay: function(layer, name, baselayerName, selected) {
		if(baselayerName in this._akm_data) {
			selected = (typeof selected === 'boolean') ? (selected ? 'selected' : 'unselected') : 'uncontrolled';
			this._akm_data[baselayerName].overlayers[selected][name] = layer;
			return (this._map && this._selected == baselayerName) ? this.addBaseLayer(layer, name) : this;
		}
		return this;
	},

	addToMap: function(name) {
		if(this._map && name in this._akm_data)
			this._akm_data[name].baselayer.addTo(this._map);
		return this;
	},
	
	getCurrent: function() {
		return this._akm_data[this._selected];
	},
	
	_addBinded: function(obj) {
		this._selected = obj.name;
		if(this._map) {
			this._map.options.crs = this._akm_data[this._selected].crs;
		}
		var overlayers;
		overlayers = this._akm_data[this._selected].overlayers['selected'];
		for(var name in overlayers) {
			this._addLayer(overlayers[name], name, true);
			if(this._map);
				overlayers[name].addTo(this._map);
		}
		overlayers = this._akm_data[this._selected].overlayers['unselected'];
		for(var name in overlayers) {
			this._addLayer(overlayers[name], name, true);
		}
		overlayers = this._akm_data[this._selected].overlayers['uncontrolled'];
		for(var name in overlayers) {
			if(this._map);
				overlayers[name].addTo(this._map);
		}
		if(this._map) {
			this._map.setView([0, 0], (this._map.getMaxZoom() + this._map.getMinZoom()) / 2);
		}
		this._update();
	},
	
	_removeBinded: function() {
		var overlayers = this._akm_data[this._selected].overlayers;
		var list = this._layers.splice(0);
		var toRmv = [];
		list.forEach(function(obj2) {
			if(obj2.name in overlayers['unselected'] || obj2.name in overlayers['selected']) {
				obj2.layer.off('add remove', this._onLayerChange, this);
				obj2.layer.remove();
			}else {
				this._layers.push(obj2);
			}
		}, this);
		this._update();
		overlayers = overlayers['uncontrolled'];
		for(var name in overlayers) {
			overlayers[name].remove();
		}
		this._selected = null;
	},
	
	_onLayerChange: function(e) {
		if (!this._handlingClick) {
			this._update();
		}

		var obj = this._getLayer(L.Util.stamp(e.target));

		
		if(!obj.overlay && obj.name in this._akm_data) {
			//{layer, name, overlay}
			var that = this;
			var f1;
			if(e.type === 'add') {
				f1 = function() {that._addBinded(obj);};
			} else {
				f1 = function() {that._removeBinded();};
			}
			setTimeout(f1, 1);
		}
		
		var type = obj.overlay ?
			(e.type === 'add' ? 'overlayadd' : 'overlayremove') :
			(e.type === 'add' ? 'baselayerchange' : null);

		if (type) {
			this._map.fire(type, obj);
		}
	},
	
});