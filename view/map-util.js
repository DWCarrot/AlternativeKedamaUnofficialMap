/*
const getAbsURL = function (url) {
	
}*/



var MinecraftMapUtil = function() {

	this.mapIcons = {};

	this,getAbsURL = function(url) {
		var p = /^(http[s]?|ftp):\/\/([^/:]+)(:\d*)?([^#?\s]+)(\?[^#]*)?(#\S+)?$/;
		if (!url.match(p)) {
			var path = '';
			if(url.slice(0, 1) == '/') {
				path = url;
			} else {
				path = window.location.pathname;
				path = path.slice(0, path.lastIndexOf("/")) + '/' + url;
			}
			path = path.split("/");
			url = [];
			for(var i = 0; i < path.length; ++i) {
				if(path[i] == ".")
					continue;
				if(path[i] == "..") {
					url.pop();
					continue;
				}
				url.push(path[i]);
			}
			url = window.location.protocol + "//" + window.location.host + "/" + url.join("/");
		}
		return url;
	}
	
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
	
	this.getJSONs = function(url, success, args1, fail, args2, nocache, timeout) {
		if(!timeout)
			timeout = 5000;
		if(typeof url == "string") {
			url = {"$url": url};
		}
		var reqs = {};
		var dataList = {};
		for(var prop in url) {
			var req = new XMLHttpRequest();
			if(nocache)
				url[prop] += ('?time=' + new Date().getTime());
			dataList[prop] = null;
			reqs[prop] = req;
			req._id = prop;
			req.timeout = timeout;
			req.onload = function(event) {
				var p = event.target._id;
				try {
					dataList[p] = JSON.parse(event.target.responseText);
					console.log(dataList[p]);
				} catch(e) {
					console.log(e);
					if(fail)
						fail(e, args2);
				}
				delete reqs[p];
				if(Object.keys(reqs).length == 0) {
					if(Object.keys(dataList).length == 1 && ("$url" in dataList))
						dataList = dataList["$url"];
					if(success)
						success(dataList, args1);
				}
			};
			req.onerror = function(event) {
				console.log(event.target);
				delete reqs[event.target._id];
				if(fail)
					fail(event.target, args2);
			}
			req.open("GET", url[prop], true);
		}
		for(var prop in reqs)
			reqs[prop].send();
	}
	
	
	this.getJSON = function(url, success, args1, fail, args2, nocache, timeout) {
		if(!timeout)
			timeout = 5000;
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
						console.warn(e);
						if(fail)
							fail(e, args2);
					}
					console.debug(data);
					if(success && data)
						success(data, args1);                   
				} else {
					console.warn(xmlhttp.responseURL, xmlhttp.status, xmlhttp.statusText);
					if(fail)
						fail(xmlhttp, args2);                        
				}
			}
		}
		xmlhttp.open("GET", url, true);
		if("withCredentials" in xmlhttp) {
			xmlhttp.timeout = timeout;
		} else if(typeof XDomainRequest != "undefined") {
			xmlhttp = new XDomainRequest();
			xmlhttp.timeout = timeout;
		}
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
	
	this.LayersControl = function(options) {
		if(options == undefined)
			options = {};
		options.sortLayers = false;		//failed
		options.sortFunction = function(layerA, layerB, nameA, nameB) {
			if(layerA.mc_priority == undefined || layerB.mc_priority == undefined)
				return nameA.localeCompare(nameB);
			else
				return Math.sign(layerB.mc_priority - layerA.mc_priority);
		}
		return new L.Control.Layers({}, {}, options);
	}
	
	this._ChunkMarker = L.Path.extend({
		
		initialize: function(options) {
			L.Util.setOptions(this, options);
		}
		
	});
	
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
	
	/**
	 *	@return	<L.LayerGroup + 
	 */
	this.createMapMarkersLayer = function(dataMarkers) {
		var markers = [];
		for (var i = 0; i < dataMarkers.length; ++i) {
			var marker = dataMarkers[i];
			var options = {};
			if(marker.icon !== undefined && this.mapIcons[marker.icon])
				options.icon = this.mapIcons[marker.icon];
			markers.push(
				L.marker([marker.z, marker.x], options)
				 .bindPopup(this.popupFormatter(marker))
			);
		}
		return L.layerGroup(markers);
	}
	
	/**
	 *	@return	<L.LayerGroup + .mc_addMarker(event) + .mc_addMarkerflag<boolean>>
	 */
	this.createUserMarkerLayer = function() {
		var layer = L.layerGroup();
		var that = this;
		layer.mc_addMarker = function(event) {
			if(layer.mc_addMarkerflag) {
				var options = {};
				if(event.markerIcon == undefined)
					event.markerIcon = "pointer";
				if(event.markerIcon != undefined && that.mapIcons[event.markerIcon])
					options.icon = that.mapIcons[event.markerIcon];
				var marker = L.marker(event.latlng, options).bindPopup(
					that.popupFormatter({
						x: Math.round(event.latlng.lng),
						z: Math.round(event.latlng.lat)
					})
				);
				marker.on('click', function() {
					if(layer.mc_addMarkerflag)
						layer.removeLayer(marker);
				});
				layer.addLayer(marker);
				marker.openPopup();
			}
		}
		return layer;
	}
	
	this.createChunkLineLayer = function(width, height, interval) {
		var latlngs = [];
		for(var i = 0; i < width / 2; i += interval) {
			latlngs.push([[-height / 2, i], [height / 2, i]]);
			latlngs.push([[-height / 2, -i], [height / 2, -i]]);
		}
		for(var i = 0; i < height / 2; i += interval) {
			latlngs.push([[i, -width / 2], [i, width / 2]]);
			latlngs.push([[-i, -width / 2], [-i, width / 2]]);
		}
		var layer = L.polyline(latlngs, {color: 'red', weight: 1, opacity: 0.2, fill: false});
		layer.callbacks = {};
		layer.on('click', function(event) {
			for(var prop in layer.callbacks) {
				layer.callbacks[prop](event);
			}
		});
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
			html += this.template('template-popup-03', {description: marker.description.replace(/\n/g, '<br/>')});
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
	this.registerMap = function(url, layersControl, callback, args) {
		var that = this;
		mapUtil.getJSON(
			url,
			function(data) {
				var e = {};
				e.name = data.world;
				e.default = data.default;
				e.crs = new L.KC.CRS({
					scale: data.baselayer.scale,
					offset: L.latLng(data.baselayer.offsetZ, data.baselayer.offsetX),
					tileSize: data.baselayer.tileSize,
					picSize: data.baselayer.picSize,
					maxZoom: data.baselayer.maxZoom
				});
				e.baselayer = L.tileLayer(data.baselayer["url"], {
					world: data.world,
					attribution: data.attribution,
					tileSize: data.baselayer.tileSize,
					maxZoom: data.baselayer.maxZoom,
				});
				e.overlayers = {};
				for(var prop in data.overlayers) {
					var options = data.overlayers[prop];
					switch(options.func) {
						case "$MapMarkers":
							mapUtil.getJSON(
								options["url"],
								function(mdata, p) {
									if(!mdata)
										return;
									for(var i = 0; i < mdata.length; ++i)
										if(mdata[i].icon && mapUtil.mapIcons[mdata[i].icon])
											 mdata[i].icon = mapUtil.mapIcons[mdata[i].icon];
									var layer = new L.KC.MarkersGroup(mdata);
									layer.mc_default = data.overlayers[p].default;
									layer.mc_data = mdata;
									layer.mc_priority = data.overlayers[p].priority
									e.overlayers[p] = layer;
									if(that.index == e.name) {
										if(layer.mc_default)
											layer.addTo(layersControl._map);
										layersControl.addOverlay(layer, p);
									}
								},
								prop,
								undefined,
								undefined,
								true,
								5000
							);
							break;
						case "$UserMarkers":
							var layer = new L.KC.MarkersGroup([]);
							layer.mc_default = options.default;
							layer.mc_priority = options.priority;
							e.overlayers[prop] = layer;
							break;
						case "$ChunkMarkGroup":
							mapUtil.getJSON(
								options["url"],
								function(mdata, p) {
									var layer = new L.KC.BChunkMarker(mdata, {onAddCallback: function(){that.getCurrentDataStruct().baselayer.setOpacity(0.25);}, onRemoveCallback: function() {that.getCurrentDataStruct().baselayer.setOpacity(1);}, });
									layer.mc_default = data.overlayers[p].default;
									layer.mc_data = mdata;
									layer.mc_priority = data.overlayers[p].priority
									e.overlayers[p] = layer;
									if(that.index == e.name) {
										if(layer.mc_default)
											layer.addTo(layersControl._map);
										layersControl.addOverlay(layer, p);
									}
								},
								prop,
								undefined,
								undefined,
								true,
								5000
							);
							
							break;
					}
				}
				that.store[data.world] = e;
				layersControl.addBaseLayer(e.baselayer, data.world);
				if(data.default) {
					e.baselayer.addTo(layersControl._map);
//					console.debug(1, Object.keys(e.overlayers));
				}
				if(typeof callback == "function")
					callback(e, args);
			},
			undefined,
			function(error) {
				
			},
			undefined,
			true,
			5000
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
//		console.debug(3, Object.keys(d.overlayers));
		if(d) {
			layersControl._map.options.crs = d.crs;
			for(prop in d.overlayers) {
				if(d.overlayers[prop].mc_default)
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