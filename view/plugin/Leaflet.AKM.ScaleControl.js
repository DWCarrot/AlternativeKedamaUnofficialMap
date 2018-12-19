/// #require L from leaflet.js
/// #require L.AKM.Util from L.AKM.Util.js

if(L.AKM === undefined)
	L.AKM = {};

/**
 *
 */
L.AKM.ScaleControl = L.Control.extend({

	options: {
		position: 'bottomleft',
		maxWidth: 100,	//pixel
		standard: true,
		chunk: true,
		updateWhenIdle: false
	},
	
	onAdd: function(map) {
		var className = 'leaflet-control-scale',
			container = L.DomUtil.create('div', className),
			options = this.options;
		this._addScales(options, className + '-line', container);
		map.on(options.updateWhenIdle ? 'moveend' : 'move', this.update, this);
		map.whenReady(this.update, this);
		return container;
	},

	onRemove: function(map) {
		map.off(this.options.updateWhenIdle ? 'moveend' : 'move', this.update, this);
	},

	_addScales: function(options, className, container) {
		if(options.standard) {
			this._bScale = L.DomUtil.create('div', className, container);
		}
		if(options.chunk) {
			this._cScale = L.DomUtil.create('div', className, container);
		}
	},

	update: function() {
		var map = this._map,
			y = map.getSize().y / 2;
		var maxMeters = map.distance(map.containerPointToLatLng([0, y]), map.containerPointToLatLng([this.options.maxWidth, y]));
		var ratio = this.options.maxWidth / maxMeters;
		if(this.options.standard) {
			var dist = this.getRoundNum(maxMeters);
			this.updateScale(this._bScale, dist.v * dist.e, 'block', ratio);
		}
		if(this.options.chunk) {
			var dist = this.getRoundNum(maxMeters / 16);
			this.updateScale(this._cScale, dist.v * dist.e, 'chunk', ratio * 16);
		}
	},

	updateScale: function(scale, dist, unit, ratio) {
		scale.style.width = Math.round(dist * ratio) + 'px';
		scale.innerHTML = dist + ' ' + unit;
	},

	//this function is copied from L.ScaleControl
	getRoundNum: function(num) {
		var pow10 = Math.pow(10, (Math.floor(num) + '').length - 1),
			d = num / pow10;
		d = d >= 10 ? 10 :
			d >= 5 ? 5 :
			d >= 2 ? 2 : 1;
		return {e:pow10 ,v: d};
	}
});