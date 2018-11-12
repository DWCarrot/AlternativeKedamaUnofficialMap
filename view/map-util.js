/*
const getAbsURL = function (url) {
	let p = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/;
	if (!url.match(p)) {
		let urlp = url.split('/');
		let loc = window.location.pathname;
		let locp = loc.split('/');
		let i = locp.length - 1;
		if (loc[loc.length - 1] != '/')
			--i;
		++i;
		for (let j = 0; j < urlp.length; j++) {
			if (urlp[j] == '..') {
				--i;
				continue;
			}
			if (urlp[j] == '.') {
				continue;
			}
			locp[i++] = urlp[j];
		}
		url = window.location.protocol + '//' + window.location.host;
		for (let j = 0; j < i; ++j) {
			if(locp[j] == '')
				continue;
			url += ('/' + locp[j]);
		}
	}
	return url;
}*/



var MinecraftMapUtil = function() {

	this.mapIcons = [];

	this.str2dom = function(html) {
		var container = document.createElement('div');
		container.innerHTML = html;
		return container;
	}
	
	this.dom2str = function(dom) {
		var container = document.createElement('div');
		container.appendChild(dom);
		return container.innerHTML;
	}

	this.getJSON = function(url, success, fail, nocache) {
		if(nocache)
			url += ('?time=' + new Date().getTime());
		var data = null;
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if(xmlhttp.readyState == 4) {
				if(xmlhttp.status == 200) {
					try {
						data = JSON.parse(xmlhttp.responseText);
					} catch (e) {
						console.log(e);
					}
					console.debug(data);
					if(success && data)
						success(data);                   
				} else {
					console.log(xmlhttp);
					if(fail)
						fail(xmlhttp.responseText);                        
				}
			}
		}
		xmlhttp.open("GET", url, true);
		xmlhttp.send();
	};

	this.CRS = function(options) {
		var scale = 1;      /**  = `real length` / `pixel length`  **/
		var offset = L.latLng(0, 0);    /** pixel offset **/
		var tileSize = 256;
		var picSize = 256;
		var maxZoom = 0;
		if(options['scale'])
			scale = options.scale;
		if(options['offset'])
			offset = options.offset;
		if(options['tileSize'])
			tileSize = options.tileSize;
		if(options['picSize'])
			picSize = options.picSize;
		if(options['maxZoom'])
			maxZoom = options.maxZoom;
		var r = Math.pow(2, maxZoom) / tileSize * picSize;
		return L.extend({}, L.CRS.Simple, {
			projection: L.Projection.LonLat,
			transformation: new L.Transformation(1 / (r * scale), -offset.lng / r, 1 / (r * scale), -offset.lat / r),
		});
	};

	this.TileLayer = function(url, options) {
		return new this._TileLayer(url, options);
	};

	this._TileLayer = L.TileLayer.extend({
		initialize: function(url, options) {
			L.TileLayer.prototype.initialize.call(this, url, options);
		},
		onAdd: function(map) {
			L.TileLayer.prototype.onAdd.call(this, map);
			if(this.options['onAdd'])
				this.options.onAdd(map);
		},
		onRemove: function(map) {
			if(this.options['onRemove'])
				this.options.onRemove(map);
			L.TileLayer.prototype.onRemove.call(this, map);
		}
	});

	/**
	 *	@param	options	<Object>
	 *				.position	<String>
	 *				.items:		<:MenuItem> = {"item-name": <function>callback(<DomEvent>event) ...}
	 */
	this.MenuControl = function(options) {
		return new this._MenuControl(options);
	};

	this._MenuControl = L.Control.extend({
		options: {
			position: 'topright',
			items: {}
		},
		initialize: function(options) {
			L.Util.setOptions(this, options);
		},
		onAdd: function(map) {
			this._container = L.DomUtil.create('div', 'leafvar-control-container leafvar-bar');
			var head = L.DomUtil.create('strong', 'menu-head', this._container);
			head.innerText = 'MENU';
			for (var item in this.options.items) {
				var dom = L.DomUtil.create('div', 'menu-item', this._container);
				dom.innerHTML = item;
				L.DomEvent.on(dom, 'click', this.options.items[item], {});
			}
			return this._container;
		},
		onRemove: function(map) {
			for (var item in this.options.items) {
				var dom = L.DomUtil.create('div', 'menu-item', this._container);
				dom.innerHTML = item;
				L.DomEvent.off(dom, 'click', this.options.items[item], {});
			}
		}
	});
	
	this._ScaleControl = L.Control.extend({
		
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
		},//

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

		getRoundNum: function(num) {
			var pow10 = Math.pow(10, (Math.floor(num) + '').length - 1),
				d = num / pow10;
			d = d >= 10 ? 10 :
				d >= 5 ? 5 :
				d >= 2 ? 2 : 1;
			return {e:pow10 ,v: d};
		}
	});
	
	this.ScaleControl = function(options) {
		return new this._ScaleControl(options);
	};
	
	
	this.setCoordinate = function(map, crs) {
		map.options.crs = crs;
	}
	
	this.clipboard = function(str) {
		var input = document.createElement('input');
		document.body.appendChild(input);
		input.setAttribute('value', str);
		input.select();
		if (document.execCommand('copy')) {
			console.log('copy to clipboard: success `' + str + '`');
		}
		document.body.removeChild(input);
	};
	
	this.template = function(id, data) {
		return L.Util.template(document.getElementById(id).innerHTML, data);
	};
	
	this.createMapMarkersLayer = function(dataMarkers) {
		var markers = [];
		for (var i = 0; i < dataMarkers.length; ++i) {
			var marker = dataMarkers[i];
			var options = {};
			if(marker.icon !== undefined)
				options.icon = this.mapIcons[marker.icon];
			markers.push(
				L.marker([marker.z, marker.x], options)
				 .bindPopup(this.popupFormatter(marker))
			);
		}
		return L.layerGroup(markers);
	}
	
	/**
	 *	@return	<L.LayerGroup + `.addMarker(event)` + .addMarkerflag<boolean>>
	 */
	this.createUserMarkerLayer = function() {
		var layer = L.layerGroup();
		var that = this;
		layer.addMarker = function(event) {
			if(layer.addMarkerflag) {
				var options = {};
				if(event.markerIcon != undefined)
					options.icon = that.mapIcons[event.markerIcon];
				var marker = L.marker(event.latlng, options).bindPopup(
					that.popupFormatter({
						x: Math.round(event.latlng.lng),
						z: Math.round(event.latlng.lat)
					})
				);
				marker.on('click', function() {
					if(layer.addMarkerflag)
						layer.removeLayer(marker);
				});
				layer.addLayer(marker);
				marker.openPopup();
			}
		}
		return layer;
	}
	
	this.createDialog = function(map, dom, title) {
		if(!title)
			title = 'Dialog'
		if(typeof(dom) != "string")
			dom = this.dom2str(dom);
		dom = this.str2dom(this.template('template-dialog-basic', {title: title, inner: dom}));
		map._container.appendChild(dom);
		return dom;
	}
	
	this.popupFormatter = function(marker) {
		var html = '';
		if(marker.title)
			html += this.template('template-popup-01', {title: marker.title});
		html += this.template('template-popup-02',{x:marker.x, z:marker.z});
		if(marker.description)
			html += this.template('template-popup-03', {description: marker.description});
		return html;
	};
	
	this.pointerFormatter = function(latLng) {
		return this.template('template-pointer', {x: Math.round(latLng.lng), z: Math.round(latLng.lat)});
	}
	
	this.getFragment = function() {
		var hash = window.location.hash;
		if(hash && hash[0] == '#')
			return hash.slice(1);
		else
			return ''
	}
	
	this.setFragment = function(pos) {
		window.location.hash = '#' + pos;
	}
}

var MinecraftMapManager = function(mapUtil) {
	
	this.store = {};
	
	this.flags = {};
	
	this.index = '';
	
	/**
	 *	@param	name	<String>
	 *	@param	jsonURL	<String>
	 *	@param	mapURL	<String>
	 *	@param	layersControl	<L.Control.Layers>
	 *	@param	show	<boolean>	whether to show map at the beginning
	 *	@param	callback	<Function>	(<:store-struct> struct)
	 *							<:store-struct>: {data:<json-object>, crs:<L.CRS>, baseLayer:<L.TileLayer>, overlayers: {overlayer: <L.Layer>...}}
	 */
	this.registerMap = function(name, jsonURL, mapURL, layersControl, show, callback) {
		var that = this;
		mapUtil.getJSON(
			jsonURL,
			function(data) {
				var e = {
					data: data,
					crs: mapUtil.CRS({
						scale: data.property.scale,
						offset: L.latLng(data.property.offsetZ, data.property.offsetX),
						tileSize: data.property.tileSize,
						picSize: data.property.picSize,
						maxZoom: data.property.maxZoom
					}),
					baselayer: L.tileLayer(mapURL, {
						world: data.property.world,
						attribution: data.attribution,
						tileSize: data.property.tileSize,
						maxZoom: data.property.maxZoom,
					}),
					overlayers: {
						"map-marker": mapUtil.createMapMarkersLayer(data.markers),
						"user-marker": mapUtil.createUserMarkerLayer()
					}
				}
				that.store[name] = e;
				layersControl.addBaseLayer(e.baselayer, name);
				if(show)
					e.baselayer.addTo(layersControl._map);
				callback(e);
			},
			function(error) {
				console.log(error)
			},
			true
		);
	}
	
	/**
	 *	@use	triggled by map.on('baselayerchange', ``) which called when baselayer is added
	 *	@param	event	<LayersControlEvent> := {layer: <L.Layer>, name: <String>}
	 *	@param	layersControl	<L.Control.Layers>
	 */
	this.onChangeBaselayers = function(event, layersControl) {
		var d;
		d = this.store[this.index];
		if(d) {
			for(prop in d.overlayers) {
				d.overlayers[prop].remove();
				layersControl.removeLayer(d.overlayers[prop]);
			}
		}
		this.index = event.name;
		d = this.store[this.index];
		if(d) {
			layersControl._map.options.crs = d.crs;
			for(prop in d.overlayers) {
				d.overlayers[prop].addTo(layersControl._map);
				layersControl.addOverlay(d.overlayers[prop], prop);
			}
			layersControl._map.setView([0,0], Math.max(layersControl._map.getMinZoom(), 2));
		}
		mapUtil.setFragment(this.index);
	}

	this.getCurrentDataStruct = function() {
		return this.store[this.index]
	}
}
