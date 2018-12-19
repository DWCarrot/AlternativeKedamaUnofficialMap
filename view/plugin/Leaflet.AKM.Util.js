/// #require L from leaflet.js

if(L.AKM === undefined)
	L.AKM = {};

L.AKM.Util = new (L.Class.extend({
	
	URL: function(url) {
		var parser = document.createElement('a');
		parser.href = url;
		Object.defineProperty(this, 'protocol', {
			get() {return parser.protocol;},
			set(s) {return parser.protocol = s;}
		});
		Object.defineProperty(this, 'host', {
			get() {return parser.host;},
			set(s) {return parser.host = s;}
		});
		Object.defineProperty(this, 'hostname', {
			get() {return parser.hostname;},
			set(s) {return parser.hostname = s;}
		});
		Object.defineProperty(this, 'pathname', {
			get() {return parser.pathname;},
			set(s) {return parser.pathname = s;}
		});
		Object.defineProperty(this, 'query', {
			get() {return parser.search;},
			set(s) {return parser.search = s;}
		});
		Object.defineProperty(this, 'hash', {
			get() {return parser.hash;},
			set(s) {return parser.hash = s;}
		});
		Object.defineProperty(this, 'url', {
			get() {return parser.href;},
			set(s) {return parser.href = s;}
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
	
	addStyle: function(css) {
		var head = document.getElementsByTagName("head")[0];
		var style = document.createElement("style");
		style.type = "text/css";
		style.innerHTML = css;
		head.appendChild(style);
	},
	
	getJSON: function(url, success, args1, fail, args2, nocache, timeout) {
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
							fail(e, args2);
						return;
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
	
	basicMarkerFormatter: function(marker) {
		var title = String.prototype.concat.call('<div style="font-weight:bold;">', marker.title, '</div>');
		var coord = String.prototype.concat.call('<div style="font-size:smaller;">', marker.x, ',', marker.z, '</div>');
		var descr = '';
		if(marker.description)
			descr = String.prototype.concat.call('<hr/>' ,'<div style="max-width: 200px; word-wrap:break-word; word-break:break-all;" >', marker.description, '</div>');
		return String.prototype.concat.call(title, coord, descr);
	},
	
	basicPonterFormatter: function(latlng) {
		return String.prototype.concat.call('Point To: ', Math.round(latlng.lng), ',', Math.round(latlng.lat));
	},
	
	basicMarkerDataProcess: function(markerList) {
		
	},

}))();