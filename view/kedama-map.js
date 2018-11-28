// JavaScript source code

window.onload = function() {
	
	function loadIcon(mapUtil) {
		this.icons = {};
		for(var i = 1; i <= 16; ++i) {
			var name = 'settlement-' + i;
			this.icons[name] = L.icon({
				iconUrl: 'banner_icon_' + i + '.png',
				iconSize: [25, 41], // size of the icon
				iconAnchor: [13, 41], // point of the icon which will correspond to marker's location
				popupAnchor: [0, -16] // point from which the popup should open relative to the iconAnchor
			});
		}
		var nList = ['-', 'building', 'world', 'facility', 'settlement', 'reserved', 'pointer']
		for(var i = 1; i <= 6; ++i) {
			var name = nList[i];
			this.icons[name] = L.icon({
				iconUrl: 'marker-icon-' + i + 'x.png',
				iconSize: [20, 32.8], // size of the icon
				iconAnchor: [10.5, 32.8], // point of the icon which will correspond to marker's location
				popupAnchor: [0, -18] // point from which the popup should open relative to the iconAnchor
			});
		}
		mapUtil.mapIcons = this.icons;
		this.icons = undefined;
		return mapUtil.mapIcons;
	};
	
	/*it works. why?*/
	function searchDialog(map) {
		let dom = document.createElement("div");
		dom.className = "search-dialog-body"
		let c1 = document.createElement("div");
		dom.appendChild(c1);
		let c2_0 = document.createElement("span");
		c2_0.innerText = "标记点名称:  ";
		c1.appendChild(c2_0);
		let c2 = document.createElement("input");
		c1.appendChild(c2);

		let c4 = document.createElement("div");
		dom.appendChild(c4);
		let c5 = document.createElement("table");
		c4.appendChild(c5);
		c2.addEventListener("input", function(e) {
			if(e.target.value == '')
				return;
			c5.innerHTML = "";
			let res = map.searchMarks(e.target.value);
			for (let i = 0; i < res.length; i++) {
				let t = document.createElement("tr");
				t.marker = res[i];
				let d = [];
				for(let n = 0; n < 4; ++n)
					t.appendChild(d[n] = document.createElement("td"));
				d[0].innerText = t.marker.name;
				d[1].innerText = t.marker.x + ',' + t.marker.z;
				d[2].innerText = '跳转'
				d[2].className = 'td-btn'
				d[2].addEventListener("click", function(e) {
					let marker = e.target.parentNode.marker;
					map.setView(marker.x, marker.z);
				});
				d[3].innerText = '复制'
				d[3].className = 'td-btn'
				d[3].addEventListener("click", function(e) {
					let marker = e.target.parentNode.marker;
					let s = JSON.stringify(marker);
					clipboard(s);
				});
				c5.appendChild(t);
			}
		});
		let c3 = document.createElement("hr")
		dom.appendChild(c3);
		return dom;
	}
	
	function map_dialog(map, htmlElement, title) {
		if(!title)
			title = 'Dialog'
		let _container = L.DomUtil.create('div', 'leaflet-control-container leaflet-bar leaflet-top dialog', map._container);
		let _close = L.DomUtil.create('input', 'close leaflet-right', _container);
		_close.value = 'X';
		_close.type = 'button';
		let closeDom = L.DomUtil.create('div', 'close-occupation', _container)
		closeDom.innerHTML = title;
		L.DomEvent.addListener(_close, 'click', function() {
			L.DomUtil.remove(_container);
		});
		if(!htmlElement)
			htmlElement = L.DomUtil.create('div', 'dialog-body');
		_container.appendChild(htmlElement);
		document.querySelector('.dialog').style.width = (innerWidth - 120) + 'px';
		return _container;
	}
	
	///////////////////////////////////////////////////////////////////////////////////////
	///
	var mapUtil = new MinecraftMapUtil();
	
	var mgr = new MinecraftMapManager(mapUtil);
	
	console.debug(loadIcon(mapUtil));
	///
	var map = L.map('map', {
		renderer: L.canvas({ padding: 0.01 }),
		zoomSnap: 0.05,
		zoomDelta: 0.25,
		closePopupOnClick: true
	}).setView([0,0],0);
	
	//common layer: ControlLayer
	var layerControl = mapUtil.LayersControl().addTo(map);
	
	//common layer: ScaleControl
	var scaleControl = mapUtil.ScaleControl({
		maxWidth: 100
	}).addTo(map);
	
	
	
	if(!mapUtil.getFragment())
		mapUtil.setFragment('v3');
	
	
	mgr.registerMap(
		'../data/v2/v2-settings.json',
		layerControl,
		function(e) {
			if(e.default)
				document.querySelector('#map').style.backgroundColor = "black";
		}
	);
	
	mgr.registerMap(
		'../data/v3/v3-settings.json',
		layerControl,
		function(e) {
			if(e.default)
				document.querySelector('#map').style.backgroundColor = "black";
		}
	);
	
	
	
	//hmmmm to reuse some functions
	var u = {
		searchMarks: function(keyword) {
			var res = [];
			var staticMarkers = mgr.getCurrentDataStruct().data.markers;
				for(let i = 0;i < staticMarkers.length; i++) {
					if(staticMarkers[i].title.indexOf(keyword) != -1) {
						res.push({
							name: staticMarkers[i].title,
							x: staticMarkers[i].x,
							z: staticMarkers[i].z
						});
					}
				}
			return res;
		},
		setView: function(x, z) {
			map.setView([z, x], map.getMaxZoom());
		}
	};
	
	
	//common layer: MenuControl
	var menuControl = mapUtil.MenuControl({
		items: {
			"Help": function () {
				let dom = document.createElement('div');
				dom.innerHTML = '<table style="text-align:left;">'
					+ '<tr><td>+ / - / 鼠标滚轮</td><td>缩放</td></tr>'
					+ '<tr><td>LayerControl-markers</td><td>显示/隐藏标记点</td></tr>'
					+ '<tr><td>Menu-Marking</td><td>开启/关闭标记点操作</td></tr>'
					+ '<tr><td>鼠标左键</td><td>显示/隐藏提示、放置/取消放置标记点</td></tr>'
					+ '<tr><td>Menu-Search</td><td>搜索标记点，可根据搜索结果索引跳转</td></tr>'
					+ '</table>';
				map_dialog(map, dom, 'Tips');
			},
			"Marking": function (e) {
				var userMarkersLayer = mgr.getCurrentDataStruct().overlayers['user-marker'];
				if(userMarkersLayer) {
					if (userMarkersLayer.addMarkerflag) {
						map.off('click', userMarkersLayer.addMarker)
						userMarkersLayer.addMarkerflag = undefined;
						e.target.style.backgroundColor = "";
					} else {
						e.target.style.backgroundColor = "#AFD";
						setTimeout(function(){userMarkersLayer.addMarkerflag = true;}, 10); 
						map.on('click', userMarkersLayer.addMarker);
					}
				}
			},
			"Search": function () {
				/*
				var keyword = prompt('标记点名称: ', 'keyword');
				if (keyword != 'keyword') {
					var res = map.searchMarks(keyword);
					var mes = '搜索结果:\n';
					for (let i = 0; i < res.length; i++) {
						res[i].index = i;
						mes += JSON.stringify(res[i]) + '\n';
					}
					console.log(mes);
					mes += '-----------------\n';
					mes += '选择跳转索引:\n';
					let ind = prompt(mes, '');
					if (ind) {
						try {
							ind = Number(ind);
							let r = res[ind];
							map.setView(r.x, r.z);
						} catch (e) {
							console.debug(e);
						}
					}
				}
				else {
					alert('请输入关键词!');
				}*/
				map_dialog(map, searchDialog(u), 'Search');
			},
			"SetMark": function() {
				var userMarkersLayer = mgr.getCurrentDataStruct().overlayers['user-marker'];
				if(userMarkersLayer && userMarkersLayer.addMarker) {
					try {
						var s = prompt('标记点位置: ', '0,0');
						s = s.split(',');
						s[0] = Number.parseFloat(s[0]);
						s[1] = Number.parseFloat(s[1]);
						userMarkersLayer.addMarkerflag = true;
						userMarkersLayer.addMarker({latlng: L.latLng(s[1], s[0])});
						userMarkersLayer.addMarkerflag = undefined;
						map.setView(L.latLng(s[1], s[0]), map.getMaxZoom());
					} catch(e) {
						alert(e);
					}
				}
			},
			"About": function () {
				alert('推荐功能更完善的地图版本\n[jsw YAKM](https://kedama-map.jsw3286.eu.org/');
				var cet = document.createElement("center");
				var p = document.createElement("p");
				var warn = document.createTextNode("此条目正在开发中...");
				cet.appendChild(warn);
				map_dialog(map, cet, 'About');
			},
		}
	}).addTo(map);
	
	//register pointer show
	map.on('mousemove', function (event) {
		document.getElementById('debug').innerHTML = mapUtil.pointerFormatter(event.latlng);
	});
	
	map.on('baselayerchange', function(event) {
		mgr.onChangeBaselayers(event, layerControl);
	});
	
	_hook = {map: map, util: mapUtil};
	
}


//======================================================================================
//======================================================================================
// unused code
//======================================================================================
//======================================================================================

function unused() {

function format01(mark) {
	return '<div><div>' + mark.title + '</div><div>' + Math.round(mark.x) + ' , ' + Math.round(mark.z) + '</div></div>';
};

function format02(latlng) {
	return '指向坐标: ' + Math.round(latlng.lng) + ',' + Math.round(latlng.lat)
}

function format03(latlng) {
	return '<div>' + Math.round(latlng.lng) + ',' + Math.round(latlng.lat) + '</div>';
}

function KedamaMap() {

	this.util = new MinecraftMapUtil();

	/** properties **/
	this.map = null;							//	leaflet map
	this.data = { attribution:"", marks:[]};	//	json data
	this.showMarkers = false;	//	L.markers & whether to show it
	this.layerSMarker = null;
	this.layerMarker = null;
	this.layerMap = {};
	this.icons = [];							//	L.icons from icon pictures
	this.keyPressed = new Array(256);
	this.onClickCallbacks = {};
	this.lastUserMarker = null;
	this._dailog = null;
	/** methods **/
	
	this.loadIcon = function() {
		this.icons.push(
			L.icon({
				iconUrl: 'marker-icon-1x.png',
				iconSize: [14.5, 23], // size of the icon
				iconAnchor: [7.25, 22.5], // point of the icon which will correspond to marker's location
				popupAnchor: [0, -18] // point from which the popup should open relative to the iconAnchor
			})
		);
		for(let i = 1; i <= 16; ++i) {
			this.icons.push(
				L.icon({
					iconUrl: 'banner_icon_' + i + '.png',
					iconSize: [16, 24], // size of the icon
					iconAnchor: [8.5, 23], // point of the icon which will correspond to marker's location
					popupAnchor: [0, -16] // point from which the popup should open relative to the iconAnchor
				})
			);
		}
		return this.icons;
	};
	
	this.init = function(id, crsOptions, bounds) {
		let that = this;
		this.map = L.map(id, {
			renderer: L.canvas({ padding: 0.01 }),
			//crs: this.CRS(9600/617*256),
			crs: this.util.CRS(crsOptions),
			zoomSnap: 0.05,
			zoomDelta: 0.25,
			closePopupOnClick: true
		})
		.setView([0,0], 2)
		.on('click', function(event) {
			for(let property in that.onClickCallbacks) {
				let callback = that.onClickCallbacks[property];
				if(callback)
					callback(event);
			}
		});
		
		document.getElementById(id).onkeydown = function(e) {
			e = e || event;
　　 　 	that.keyPressed[e.keyCode] = e;
			console.debug('[down] ', e.key);
		}
		document.getElementById(id).onkeyup = function(e) {
			e = e || event;
　　 　 	that.keyPressed[e.keyCode] = null;
			console.debug('[up  ] ', e.key);
		}
	};

	this.registerMap = function (world, pathroot, tileOptions) {
		this.layerMap[world] = this.util.TileLayer(pathroot, tileOptions).addTo(this.map);
//		this.layerMap[world] = L.tileLayer(pathroot, tileOptions).addTo(this.map);
		this.util.ScaleControl({
			maxWidth: 100
		}).addTo(this.map);
	};
	
	this.registerPointerShow = function(id) {
		this.map.on('mousemove', function (event) {
			document.getElementById(id).innerText = format02(event.latlng);
		});
	};
	
	this.registerMenu = function (items) {
		this.util.MenuControl({ position: 'topleft', items: items }).addTo(this.map);
	};
	
	this.registerMarks = function() {
		let key = 16; //keyCode of 'shift'
		let marks = this.data.markers;
		let that = this;
		this.layerSMarker = L.layerGroup().addTo(this.map);
		for (let i = 0; i < marks.length; ++i) {
			let mark = marks[i];
			let icon = (mark.icon === undefined) ? this.icons[0] : this.icons[mark.icon]; 
			this.layerSMarker.addLayer(
				L.marker([mark.z, mark.x], { icon: icon })
				 .bindPopup(format01(mark))
			);
		}
		
	/*	this.onClickCallbacks.showMarks = function(event) {
			if(that.keyPressed[key]) {
				if(that.showMarkers) {
					that.showMarkers = false;
					that.layerMarker.remove();
				} else {
					that.showMarkers = true;
					that.layerMarker.addTo(that.map);
				}
			}
		};*/
	};	

	this.registerUserMarks = function() {
		let key = 18;
		let that = this;
		this.layerMarker = L.layerGroup().addTo(this.map);
		this.onClickCallbacks.userMarkers = function(event) {
			if (that.keyPressed[key]) {
				if (typeof (that.keyPressed[key]) == 'string') {
					that.keyPressed[key] = {
						ctx: that.keyPressed[key]
					}
					return;
				}
				let mark = L.marker(event.latlng, { icon: that.icons[0] })
					.bindPopup(format03(event.latlng));
				mark.on('click', function() {
					if(that.keyPressed[key]) {
						that.layerMarker.removeLayer(mark);
//						that.keyPressed[key] = null;
					}
				});
				that.layerMarker.addLayer(mark);
				mark.openPopup();
			}
		}
	};

	this.registerLayerControl = function () {
		let base = {
			"v2": this.layerMap["v2"],
			"v3": this.layerMap["v3"]
		};
		let overlay = {
			"map-markers": this.layerSMarker,
			"user-markers": this.layerMarker,
		}
		L.control.layers(base, overlay).addTo(this.map);
	}
	
	/** API **/
	
	/**
	 *	`map.setView(<number:x>,<number:z>)`
	 *	move to position(x,z)
	 */
	this.setView = function(x, z) {
		this.map.setView([z, x], this.map.getMaxZoom());
	};
	
	/**
	 *	`map.getStaticMarks()`
	 *	get an array of static marks in form of `[{title:$title, x:$x, z:$z},...]` 
	 */
	this.getStaticMarks = function() {
		let res = [];
		let markers = this.data.marks;
		for(let i = 0; i < markers.length; ++i) {
			let mark = markers[i];
			res.push({
				title: mark.title,
				x: mark.x,
				z: mark.z
			});
		}
		return res;
	};
	
	/**
	 *	`map.getUserMarks()`
	 *	get an array of user marks in form of `[{title:$index, x:$x, z:$z},...]`
	 */
	this.getUserMarks = function() {
		let res = [];
		let markers = this.layerMarker.getLayers();
		for(let i = 0; i < markers.length; ++i) {
			let latlng = markers[i].getLatLng();
			res.push({
				title: i,
				x: latlng.lng,
				z: latlng.lat
			});
		}
		return res;
	};

	/**
	 *	`map.searchMarks(<string:keyword>)`
	 *	search the static mark list for marks whose title contain keyword
	 */
	this.searchMarks = function(keyword) {
		let res = [];
		let staticMarkers = this.getStaticMarks();
		for(let i = 0;i < staticMarkers.length; i++) {
			if(staticMarkers[i].title.indexOf(keyword) != -1) {
				res.push({
					name: staticMarkers[i].title,
					x: staticMarkers[i].x,
					z: staticMarkers[i].z
				});
			}
		}
		return res;
	};
	
	/**
	 *	`map.setMark(<number:x>,<number:z>,<optional string:title>,<optional int:icon>)`
	 *	set a mark at position(x,z)
	 */
	this.setMark = function(x, z, title, icon) {
		let key = 18;
		let that = this;
		let mark = L.marker([z, x], { icon: this.icons[icon | 0] })
		.bindPopup(format01({x:x, z:z, title: title}))
		.on('click', function() {
			if(that.keyPressed[key]) {
				that.layerMarker.removeLayer(mark);
				//that.keyPressed[key] = null;
			}
		});
		this.layerMarker.addLayer(mark);
	};
	
	/**
	 *	`new map.Dialog(<optional HTMLElement:htmlElement>,<optional string:title>)`
	 *	create an Dialog with a close button to display HTMLElement
	 */
	this.dialog = function(htmlElement, title) {
		if(!title)
			title = 'Dialog'
		let _container = L.DomUtil.create('div', 'leaflet-control-container leaflet-bar leaflet-top dialog', this.map._container);
		let _close = L.DomUtil.create('input', 'close leaflet-right', _container);
		_close.value = 'X';
		_close.type = 'button';
		let closeDom = L.DomUtil.create('div', 'close-occupation', _container)
		closeDom.innerHTML = title;
		L.DomEvent.addListener(_close, 'click', function() {
			L.DomUtil.remove(_container);
		});
		if(!htmlElement)
			htmlElement = L.DomUtil.create('div', 'dialog-body');
		_container.appendChild(htmlElement);
		document.querySelector('.dialog').style.width = (innerWidth - 120) + 'px';
		return _container;
	}
}

window.onload = function () {
	
	var tip = '\
	+ / - / 鼠标滚轮: 缩放\n\
	Shift+左        : 显示/隐藏标记点\n\
	Alt+左          : 放置/取消放置标记点\n\
	左(点击标记点)  : 显示/隐藏提示';
	

	map = new KedamaMap();
	map.loadIcon();
	map.init('map', { scale: 1, tileSize: 512, picSize: 512, maxZoom: 5 });
	map.util.getJSON('../data/v2/v2.json', function (data) {
		map.data = data;
		map.registerMap('v2', '../data/{world}/{z}/{x},{y}.png', {world:'v2', tileSize: 512, attribution: data.attribution });
		map.registerMap('v3', '../data/{world}/{z}/{x},{y}.png', {world:'v3', tileSize: 512, attribution: data.attribution });
		map.registerMarks();
		map.registerPointerShow('debug');
		map.registerUserMarks();
		map.registerLayerControl();

		map.registerMenu({
			"Help": function () {
				let dom = document.createElement('div');
				dom.innerHTML = '<table style="text-align:left;">'
					+ '<tr><td>+ / - / 鼠标滚轮</td><td>缩放</td></tr>'
					+ '<tr><td>LayerControl-markers</td><td>显示/隐藏标记点</td></tr>'
					+ '<tr><td>Menu-Marking</td><td>开启/关闭标记点操作</td></tr>'
					+ '<tr><td>鼠标左键</td><td>显示/隐藏提示、放置/取消放置标记点</td></tr>'
					+ '<tr><td>Menu-Search</td><td>搜索标记点，可根据搜索结果索引跳转</td></tr>'
					+ '</table>';
				map._dailog = map.dialog(dom, 'Tips');
			},
			"Marking": function (e) {
				if (map.keyPressed[18]) {
					map.keyPressed[18] = null;
					e.target.style.backgroundColor = "";
				} else {
					map.keyPressed[18] = "menu";
					e.target.style.backgroundColor = "#AFD";
				}
			},
			"Search": function () {
				/*
				var keyword = prompt('标记点名称: ', 'keyword');
				if (keyword != 'keyword') {
					var res = map.searchMarks(keyword);
					var mes = '搜索结果:\n';
					for (let i = 0; i < res.length; i++) {
						res[i].index = i;
						mes += JSON.stringify(res[i]) + '\n';
					}
					console.log(mes);
					mes += '-----------------\n';
					mes += '选择跳转索引:\n';
					let ind = prompt(mes, '');
					if (ind) {
						try {
							ind = Number(ind);
							let r = res[ind];
							map.setView(r.x, r.z);
						} catch (e) {
							console.debug(e);
						}
					}
				}
				else {
					alert('请输入关键词!');
				}*/
				
				map.dialog(searchDialog(u), 'Search');
			},
			"About": function () {
				alert('推荐功能更完善的地图版本\n[jsw YAKM](https://kedama-map.jsw3286.eu.org/v2/#4800,0,0)');
				var cet = document.createElement("center");
				var p = document.createElement("p");
				var warn = document.createTextNode("此条目正在开发中...");
				cet.appendChild(warn);
				map.dialog(cet, 'About');
			}
		});

	}, null, true);

}

function clipboard(str) {
	let input = document.createElement('input');
	document.body.appendChild(input);
	input.setAttribute('value', str);
	input.select();
	if (document.execCommand('copy')) {
		console.log('copy to clipboard: success `' + str + '`');
	}
	document.body.removeChild(input);
}

}