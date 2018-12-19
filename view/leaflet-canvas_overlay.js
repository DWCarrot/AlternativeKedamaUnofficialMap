
/**
 *	this class is modified from L.ImageOverlay
 */

/**
 *
 */

L.CanvasOverlay = L.Layer.extend({

	// @section
	// @aka CanvasOverlay options
	options: {
		// @option opacity: Number = 1.0
		// The opacity of the canvas overlay.
		opacity: 1,

		// @option interactive: Boolean = false
		// If `true`, the canvas overlay will emit [mouse events](#interactive-layer) when clicked or hovered.
		interactive: false,

		// @option zIndex: Number = 1
		// The explicit [zIndex](https://developer.mozilla.org/docs/Web/CSS/CSS_Positioning/Understanding_z_index) of the overlay layer.
		zIndex: 1,

		// @option className: String = ''
		// A custom class name to assign to the canvas. Empty by default.
		className: '',
	},

	initialize: function (bounds, options) { // (LatLngBounds, Object)
		this._canvas = null;
		this._bounds = (bounds instanceof L.LatLngBounds) ? bounds : new L.LatLngBounds(bounds);
		L.Util.setOptions(this, options);
		this._cwidth = Math.abs(this._bounds.getEast() - this._bounds.getWest());
		this._cheight = Math.abs(this._bounds.getSouth() - this._bounds.getNorth());
	},

	onAdd: function () {
		if (!this._canvas) {
			var canvas = L.DomUtil.create('canvas');
			canvas.width = this._cwidth;
			canvas.height = this._cheight;
			this._initCanvas(canvas);

			if (this.options.opacity < 1) {
				this._updateOpacity();
			}
		}

		if (this.options.interactive) {
			L.DomUtil.addClass(this._canvas, 'leaflet-interactive');
			this.addInteractiveTarget(this._canvas);
		}

		this.getPane().appendChild(this._canvas);
		this._reset();
	},

	onRemove: function () {
		L.DomUtil.remove(this._canvas);
		if (this.options.interactive) {
			this.removeInteractiveTarget(this._canvas);
		}
	},

	// @method setOpacity(opacity: Number): this
	// Sets the opacity of the overlay.
	setOpacity: function (opacity) {
		this.options.opacity = opacity;

		if (this._canvas) {
			this._updateOpacity();
		}
		return this;
	},

	setStyle: function (styleOpts) {
		if (styleOpts.opacity) {
			this.setOpacity(styleOpts.opacity);
		}
		return this;
	},

	// @method bringToFront(): this
	// Brings the layer to the top of all overlays.
	bringToFront: function () {
		if (this._map) {
			L.DomUtil.toFront(this._canvas);
		}
		return this;
	},

	// @method bringToBack(): this
	// Brings the layer to the bottom of all overlays.
	bringToBack: function () {
		if (this._map) {
			L.DomUtil.toBack(this._canvas);
		}
		return this;
	},

	// @method setBounds(bounds: LatLngBounds): this
	// Update the bounds that this ImageOverlay covers
	setBounds: function (bounds) {
		this._bounds = (bounds instanceof L.LatLngBounds) ? bounds : new L.LatLngBounds(bounds);

		if (this._map) {
			this._reset();
		}
		return this;
	},

	setCanvasSize: function(width, height) {
		this._cwidth = width;
		this._cheight = height;
		if(this._canvas) {
			this._canvas.width = this._cwidth;
			this._canvas.height = this._cheight;
			this._reset();
		}
	},
	
	getEvents: function () {
		var events = {
			zoom: this._reset,
			viewreset: this._reset
		};

		if (this._zoomAnimated) {
			events.zoomanim = this._animateZoom;
		}

		return events;
	},

	// @method setZIndex(value: Number): this
	// Changes the [zIndex](#canvas-overlay-zindex) of the canvas overlay.
	setZIndex: function (value) {
		this.options.zIndex = value;
		this._updateZIndex();
		return this;
	},

	// @method getBounds(): LatLngBounds
	// Get the bounds that this ImageOverlay covers
	getBounds: function () {
		return this._bounds;
	},

	// @method getElement(): HTMLElement
	// Returns the instance of [`HTMLImageElement`](https://developer.mozilla.org/docs/Web/API/HTMLImageElement)
	// used by this overlay.
	getElement: function () {
		return this._canvas;
	},
	
	_initCanvas: function (canvas) {
		
		this._canvas = canvas;
		
		L.DomUtil.addClass(canvas, 'leaflet-image-layer');
		if (this._zoomAnimated) {
			L.DomUtil.addClass(canvas, 'leaflet-zoom-animated');
		}
		if (this.options.className) {
			L.DomUtil.addClass(canvas, this.options.className);
		}

		canvas.onselectstart = L.Util.falseFn;
		canvas.onmousemove = L.Util.falseFn;

		if (this.options.zIndex) {
			this._updateZIndex();
		}
		
		var bounds = new L.Bounds(
		        this._map_latLngToLayerPoint(this._bounds.getNorthWest()),
		        this._map_latLngToLayerPoint(this._bounds.getSouthEast())),
		    size = bounds.getSize();
		this._scale = new L.Point(size.x / canvas.width, size.y / canvas.height);
	},

	_animateZoom: function (e) {
		var scale = this._scale.multiplyBy(this._map.getZoomScale(e.zoom)),
		    offset = this._map._latLngBoundsToNewLayerBounds(this._bounds, e.zoom, e.center).min;
		scale.toString = function() {return this.x + "," + this.y;};
		L.DomUtil.setTransform(this._canvas, offset, scale);
//		console.debug('_animateZoom: scale(' + scale + ')');
	},

	_reset: function () {
		var bounds = new L.Bounds(
		        this._map_latLngToLayerPoint(this._bounds.getNorthWest()),
		        this._map_latLngToLayerPoint(this._bounds.getSouthEast())),
		    scale = bounds.getSize();
		scale.x /= this._canvas.width;
		scale.y /= this._canvas.height;
		scale.toString = function() {return this.x + "," + this.y;};
		this._scale = scale;
		L.DomUtil.setTransform(this._canvas, bounds.min, scale);
//		console.debug('_reset: scale(' + scale + ')');
	},

	_updateOpacity: function () {
		L.DomUtil.setOpacity(this._canvas, this.options.opacity);
	},

	_updateZIndex: function () {
		if (this._canvas && this.options.zIndex !== undefined && this.options.zIndex !== null) {
			this._canvas.style.zIndex = this.options.zIndex;
		}
	},

	_map_latLngToLayerPoint: function(latlng) {
		var projectedPoint = this._map.project(latlng instanceof L.LatLng ? latlng : new L.LatLng(latLng));
		return projectedPoint._subtract(this._map.getPixelOrigin());
	}
	
});

L.canvasOverlay = function(bounds, options) {
	return new L.CanvasOverlay(bounds, options);
}