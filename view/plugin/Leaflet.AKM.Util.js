/// #require L from leaflet.js

(function() {
	
	if(L.AKM === undefined)
		L.AKM = {};

	L.AKM.Util = new (L.Class.extend({
		
		URL: function(url) {
			var parser = document.createElement('a');
			parser.href = url;
			Object.defineProperty(this, 'protocol', {
				get: function() {return parser.protocol;},
				set: function(s) {return parser.protocol = s;}
			});
			Object.defineProperty(this, 'host', {
				get: function() {return parser.host;},
				set: function(s) {return parser.host = s;}
			});
			Object.defineProperty(this, 'hostname', {
				get: function() {return parser.hostname;},
				set: function(s) {return parser.hostname = s;}
			});
			Object.defineProperty(this, 'pathname', {
				get: function() {return parser.pathname;},
				set: function(s) {return parser.pathname = s;}
			});
			Object.defineProperty(this, 'query', {
				get: function() {return parser.search;},
				set: function(s) {return parser.search = s;}
			});
			Object.defineProperty(this, 'hash', {
				get: function() {return parser.hash;},
				set: function(s) {return parser.hash = s;}
			});
			Object.defineProperty(this, 'url', {
				get: function() {return parser.href;},
				set: function(s) {return parser.href = s;}
			});
			this.getQuery = function() {
				var query = {};
				if(parser.search) {
					parser.search.slice(1).split('&').forEach(function(part) {
						var i = part.indexOf('=');
						if(i > 0)
							query[part.slice(0, i)] = part.slice(i + 1);
					}, this);
				}
				return query;
			}
			this.setQuery = function(query) {
				var search = '';
				for(var key in query) {
					search += String.prototype.concat.call('&', key, '=', query[key] === undefined ? '' : query[key]);
				}
				if(search !== '') {
					return parser.search = '?' + search.slice(1);
				} else {
					return parser.search = '';
				}
			}
		},
		
		
		SimpleDialog: L.Control.extend({
			
		}),
		
		addStyle: function(css) {
			var head = document.getElementsByTagName("head")[0];
			var style = document.createElement("style");
			style.type = "text/css";
			style.innerHTML = css;
			head.appendChild(style);
		},
		
		loadStyle: function(url) {
			var body = document.getElementsByTagName("body")[0];
			var link = document.createElement("link");
			link.rel = "stylesheet";
			link.href = url;
			body.appendChild(link);
		},
		
		getJSON: function(url, success, that1, fail, that2, nocache, timeout) {
			if(!timeout)
				timeout = 5000;
			if(nocache) {
				url = new this.URL(url);
				var query = url.getQuery();
				query.time = new Date().getTime();
				url.setQuery(query);
				query = undefined;
				url = url.url;
			}
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
								fail.call(that2, e);
							return;
						}
						console.debug(data);
						if(success && data)
							success.call(that1, data);                   
					} else {
						console.warn(xmlhttp.responseURL, xmlhttp.status, xmlhttp.statusText);
						if(fail)
							fail.call(that2, xmlhttp);                        
					}
				}
			}
			xmlhttp.open("GET", url);
			if("withCredentials" in xmlhttp) {
				xmlhttp.timeout = timeout;
			} else if(typeof XDomainRequest != "undefined") {
				xmlhttp = new XDomainRequest();
				xmlhttp.timeout = timeout;
			}
			xmlhttp.send();
		},
		
		clipboard: function(str) {
			var body = document.getElementsByTagName('body')[0];
			var input = document.createElement('input');
			body.appendChild(input);
			input.setAttribute('value', str);
			input.select();
			var success = document.execCommand('copy');
			if(success)
				console.debug('clipboard: `', str, '`');
			body.removeChild(input);
			return success;
		},
		
		getDomWidth: function(dom) {
			return dom.clientWidth;
		},

		getDomHeight: function(dom) {
			return dom.clientHeight;
		},
		
		isEmptyObj: function(obj) {
			for(var prop in obj)
				return false;
			return true;
		},
		
		geo_segmentCross: function(a1, a2, b1, b2) {	//L.LatLng
			if( Math.min(a1.lat, a2.lat) > Math.max(b1.lat, b2.lat)
			||	Math.max(a1.lat, a2.lat) < Math.min(b1.lat, b2.lat)
			||	Math.min(a1.lng, a2.lng) > Math.max(b1.lng, b2.lng)
			||	Math.max(a1.lng, a2.lng) < Math.min(b1.lng, b2.lng) )
				return false;
			var	v0 = b1.lng - a1.lng,	//A1B1
				v1 = b1.lat - a1.lat,
				v2 = b2.lng - a1.lng,	//A1B2
				v3 = b2.lat - a1.lat,
				v4 = b1.lng - a2.lng,	//A2B1
				v5 = b1.lat - a2.lat,
				v6 = b2.lng - a2.lng,	//A2B2
				v7 = b2.lat - a2.lat;
			return ((v0 * v3 - v1 * v2) * (v4 * v7 - v5 * v6) <= 0) && ((v0 * v5 - v1 * v4) * (v2 * v7 - v3 * v6) <= 0);
		},
		
		geo_pointInPolygon: function(point, polygon) {
			var hit = false;
			for(var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
				var a1 = polygon[i],
					a2 = polygon[j];
					v0 = point.lng - a1.lng,
					v1 = point.lat - a1.lat,
					v2 = point.lng - a2.lng,
					v3 = point.lat - a2.lat;
				if(Math.abs(v0 * v3 - v1 * v2) < 1e-6)
					return true;
				if(v1 * v3 < 0 && v2 < (a1.lng - a2.lng) / (a1.lat - a2.lat) * v3)
					hit = !hit;
			}
			return hit;
		},
		
		loadIcon: function(cfgList) {
			if(this.icons === undefined)
				this.icons = {};
			for(var p in cfgList) {
				this.icons[p] = new L.Icon(cfgList[p]);
			}
			return this.icons;
		},
		
		_str2icon: function(s) {
			if(this.icons) {
				return this.icons[s];
			}
			return undefined;
		},
		
		_icon2str: function(icon) {
			if(this.icons) {
				for(var s in this.icons)
					if(this.icons[s] === icon)
						return s;
			}
			return undefined;
		},
		
		basicMarkerFormatter: function(markerObj) {
			var title = String.prototype.concat.call('<div style="font-weight:bold;">', markerObj.title, '</div>');
			var coord = String.prototype.concat.call('<div style="font-size:smaller;">', markerObj.x, ',', markerObj.z, '</div>');
			var descr = '';
			if(markerObj.description)
				descr = String.prototype.concat.call('<hr/>' ,'<div style="max-width: 200px; word-wrap:break-word; word-break:break-all;" >', markerObj.description, '</div>');
			return String.prototype.concat.call(title, coord, descr);
		},
		
		basicPonterFormatter: function(latlng) {
			return String.prototype.concat.call('Point To: ', Math.round(latlng.lng), ',', Math.round(latlng.lat));
		},
		
		basicMarkerDataProcess: function(markerList) {
			var that = L.AKM.Util;
			markerList.forEach(function(r) {
				r.icon = that._str2icon(r.icon);
				if(!r.icon)
					delete r.icon;
			}, that);
			return markerList;
		},
		
		basicMarkerBuilder: function(markerObj) {
			var that = L.AKM.Util;
			var marker = new L.Marker([markerObj.z, markerObj.x]);
			if(markerObj.icon in that.icons)
				marker.setIcon(that.icons[markerObj.icon]);
			var title = String.prototype.concat.call('<div style="font-weight:bold;">', markerObj.title, '</div>');
			var coord = String.prototype.concat.call('<div style="font-size:smaller;">', markerObj.x, ',', markerObj.z, '</div>');
			var descr = '';
			if(markerObj.description)
				descr = String.prototype.concat.call('<hr/>' ,'<div style="max-width: 200px; word-wrap:break-word; word-break:break-all;" >', markerObj.description, '</div>');
			marker.bindPopup(String.prototype.concat.call(title, coord, descr));
			return marker;
		},
		
		basicMarkerEditUI: function(marker, markerObj, ctrl) {
			try{
				var that = L.AKM.Util;
				var obj = {
					x: markerObj.x,
					z: markerObj.z,
					title: markerObj.title,
					description: markerObj.description,
					icon: markerObj.icon
				};
				var s = prompt("change to: (json)", JSON.stringify(obj));
				if(s) {
					obj = JSON.parse(s);
					for(var p in obj)
						markerObj[p] = obj[p];
					ctrl.updateMarker(marker);
				}
			} catch(e) {
				console.warn(e);
			}
		},

		basicMarkerSearchUI: function(markerList, ctrl) {
			var keyword = prompt('marker title keyword: ', '');
			if (keyword) {
				var res = new Array();
				markerList.forEach(function(markerObj) {
					if(markerObj.title.indexOf(keyword) >= 0)
						res.push(markerObj);
				});
				var mes = 'results:\n';
				for (let i = 0; i < res.length; i++) {
					let id = ("        " + String(i))
					let val = JSON.stringify(res[i]);
					mes += String.prototype.concat.call("| ", id.slice(id.length - 3), "| ", val.slice(1, val.length - 1), '\n');
				}
				console.log(mes);
				mes += '-----------------\n';
				mes += 'select index to jump to:\n';
				let ind = prompt(mes, '');
				if (ind) {
					try {
						ind = Number(ind);
						let r = res[ind];
						ctrl._map.setView([r.z, r.x], ctrl._map.getMaxZoom());
					} catch (e) {
						console.debug(e);
					}
				}
			}
		},
		
		simulateUpload: function(data, context) {
			var str = data ? JSON.stringify(data) : "";
			if(L.AKM.Util.clipboard(str)) {
				alert("Simulate - Upload\r\ndata text has been copied to your clipboard");
				if(context && context.load instanceof Function)
					setTimeout(function() {context.load();}, 5000);
			}
		},
		
		geo_getCenter: function(latlngs) {
			var res = new L.LatLng(0, 0);
			latlngs.forEach(function(value) {res.lat += value.lat; res.lng += value.lng;});
			res.lat /= latlngs.length;
			res.lng /= latlngs.length;
			return res;
		},
		
		geo_getCircle3p: function(latlngs) {
			var a = latlngs[0].lng - latlngs[1].lng,
				b = latlngs[0].lat - latlngs[1].lat,
				c = latlngs[0].lng - latlngs[2].lng,
				d = latlngs[0].lat - latlngs[2].lat,
				e = 0.5 * (latlngs[0].lng * latlngs[0].lng - latlngs[1].lng * latlngs[1].lng + latlngs[0].lat * latlngs[0].lat - latlngs[1].lat * latlngs[1].lat);
				f = 0.5 * (latlngs[0].lng * latlngs[0].lng - latlngs[2].lng * latlngs[2].lng + latlngs[0].lat * latlngs[0].lat - latlngs[2].lat * latlngs[2].lat);
				c = new L.LatLng((c * e - a * f) / (b * c - a * d), (b * f - d * e) / (b * c - a * d));
				m = c.lng - latlngs[0].lng;
				n = c.lat - latlngs[0].lat,
				r = Math.sqrt(m * m + n * n);
			return {c: c, r: r};
		}
		
	}))();
	
})();

