/// #require L from leaflet.js

if(L.AKM === undefined)
	L.AKM = {};

/**
 *
 *	@param	options		{scale, offset, maxZoom}
 *				scale		<Number>	the ratio of the pixel-length in given tile-size to that in real map
 *				offset		<L.LatLng>	offset x(lng), z(lat) | <Array<Number>> offset x[0] z[1]
 *				maxZoom		<Number>
 */
L.AKM.CRS = L.Class.extend({
	
	options: {
		scale: 1,
		offset: new L.LatLng(0, 0),
		maxZoom: 0,
	},
	
	initialize: function(options) {
		L.Util.setOptions(this, options);
		if(this.options.offset instanceof Array)
			this.options.offset = new L.LatLng(this.options.offset[1], this.options.offset[0]);
		var crs = L.CRS.Simple;
		for(var prop in crs) {
			this[prop] = crs[prop];
		}
		var r = Math.pow(2, this.options.maxZoom) * this.options.scale;
		this.transformation = new L.Transformation(1 / r, -this.options.offset.lng / r, 1 / r, -this.options.offset.lat / r);
	},
	
});