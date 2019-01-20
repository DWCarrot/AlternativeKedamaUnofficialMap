// JavaScript source code

// load resources
(function() {
	Class.loadScript("https://unpkg.com/leaflet@1.3.4/dist/leaflet.js", "sha512-nMMmRyTVoLYqjP9hrbed9S+FzjZHW5gY1TWCHA5ckwXZBadntCNs8kEqAWdrb9O7rxbCaA4lKTIWjDXZxflOcA==",1);
//	Class.loadScript("https://unpkg.com/leaflet@1.3.4/dist/leaflet-src.js", "sha512-+ZaXMZ7sjFMiCigvm8WjllFy6g3aou3+GZngAtugLzrmPFKFK7yjSri0XnElvCTu/PrifAYQuxZTybAEkA8VOA==", 1);
	Class.loadStyle("https://unpkg.com/leaflet@1.3.4/dist/leaflet.css", "sha512-puBpdR0798OZvTTbP4A8Ix/l+A4dHDD0DGqYW6RQ+9jxkRFclaxxQb/SJAWZfWAkuyeQUytO7+7N4QKrDh+drA==");
	Class.loadScript("https://cdn.jsdelivr.net/npm/vue", undefined, 1);
	Class.loadScript("plugin/JSONBlob.js", undefined, 1);
	Class.loadScript("https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/0.4.2/leaflet.draw.js", undefined, 2);
	Class.loadStyle("https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/0.4.2/leaflet.draw.css", undefined);
	Class.loadScript("plugin/Leaflet.AKM.Util.js", undefined, 2);
	Class.loadScript("plugin/Leaflet.AKM.CRS.js", undefined, 3);
	Class.loadScript("plugin/Leaflet.AKM.BindedLayerControl.js", undefined, 3);
//	Class.loadScript("plugin/Leaflet.AKM.GroupedMarkerLayer.js", undefined, 3);
	Class.loadScript("plugin/Leaflet.AKM.ScaleControl.js", undefined, 3);
//	Class.loadScript("plugin/Leaflet.AKM.VMenuControl.js", undefined, 3);
//	Class.loadStyle("plugin/Leaflet.AKM.VMenuControl.css", undefined);
	Class.loadScript("plugin/Leaflet.AKM.MarkerControl.js", undefined, 3);
	Class.loadStyle("plugin/Leaflet.AKM.MarkerControl.css", undefined);
	Class.loadScript("lib/Leaflet.Dialog.js", undefined, 3);
	Class.loadStyle("lib/Leaflet.Dialog.css", undefined);
	Class.loadStyle("https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css", "sha384-1q8mTJOASx8j1Au+a5WDVnPi2lkFfwwEAa8hDDdjZlpLegxhjVME1fgjWPGmkzs7");
	Class.loadStyle("https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css", undefined);
	Class.loadScript("lib/easy-button.js", undefined, 3);
	Class.loadStyle("lib/easy-button.css", undefined);
	Class.loadScript("leaflet-kedama_craft_map-plugins.js", undefined, 3);
	Class.startTask(function() {
	
		let icons = {};
		let iconJSON = {};
		let query = new L.AKM.Util.URL(location.href).getQuery();
	
		let searchDialog = function(map, data, p) {
			if(p === undefined)
				p = "title";
			let dom = document.createElement("div");
			dom.id = "search_dialog";
			dom.className = "search-dialog-body"
			let c1 = document.createElement("div");
			c1.innerHTML = "<center><strong>搜索标记</strong></center>"
			dom.appendChild(c1);
			c1 = document.createElement("div");
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
				let res = new Array();
				let key = e.target.value;
				data.forEach(function(obj) {
					if(obj[p].indexOf(key) >= 0)
						res.push(obj);
				});
				for (let i = 0; i < res.length; i++) {
					let t = document.createElement("tr");
					t.marker = res[i];
					let d = [];
					for(let n = 0; n < 4; ++n)
						t.appendChild(d[n] = document.createElement("td"));
					d[0].innerText = t.marker[p];
					d[1].innerText = t.marker.x + ',' + t.marker.z;
					d[2].innerText = '跳转'
					d[2].className = 'td-btn'
					d[2].addEventListener("click", function(e) {
						let marker = e.target.parentNode.marker;
						map.setView([marker.z, marker.x], map.getMaxZoom());
					});
					d[3].innerText = '复制'
					d[3].className = 'td-btn'
					d[3].addEventListener("click", function(e) {
						let marker = e.target.parentNode.marker;
						let s = JSON.stringify(marker, ["x", "z", p]);
						if(L.AKM.Util.clipboard(s)) {
							e.target.style.backgroundColor = "#AFD";
							setTimeout(function(){e.target.style.backgroundColor = "";},1000);
						};
					});
					c5.appendChild(t);
				}
			});
			let c3 = document.createElement("hr");
			dom.appendChild(c3);
			return dom;
		}
		
		
		let updateMarkerList_YAKM = function(remote, local, curr, cmp) {
			let r = remote.splice(0);
			r.sort(cmp);
			local.sort(cmp);
			curr.sort(cmp);
			let i = 0, j = 0, k = 0, c = undefined, d = undefined;
			while(i < r.length && j < local.length && k < curr.length) {
				c = cmp(r[i], local[j]);
				if(c == 0) {
					d = cmp(local[j], curr[k]);
					if(d == 0) {
						remote.push(curr[k]);	//keep
						i++; j++; k++;
					} else {
						if(d > 0) {
							remote.push(curr[k]);	//add
							k++;
						} else {
							i++; j++	//remove
						}
					}
				} else {
					if(c > 0) {
						d = cmp(local[j], curr[k]);
						if(d == 0) {
							j++; k++;
						} else {
							if(d > 0) {
								k++;
							} else {
								j++;
							}
						}
					} else {
						remote.push(r[i]);
						i++;
					}
				}
			}
			while(i < r.length && j < local.length) {
				c = cmp(r[i], local[j]);
				if(c == 0) {
					i++; j++;
				} else {
					if(c > 0) {
						j++;
					} else {
						i++;
					}
				}
			}
			while(i < r.length)
				remote.push(r[i++]);
			while(k < curr.length)
				remote.push(curr[k++]);
			return remote;
		}
		
		
		L.AKM.Util.simulateUpload = function(data, context) {
			var str = data ? JSON.stringify(data) : "";
			if(L.AKM.Util.clipboard(str)) {
				alert(String.prototype.concat.call(
					"emmmm并没有服务器能接受上传数据\n\r",
					"emmmm因为并没有服务器QAQ\n\r",
					"数据已经以文本格式复制到剪切板上了，可以在别的地方右键粘贴\n\r",
					"比如找RDCarrot/jsw/SilentDepth等等 或者粘到论坛上（"
				))
				if(context && context.load instanceof Function)
					setTimeout(function() {context.load();}, 5000);
			}
		}
		
		L.AKM.MarkerControlLayer = L.Layer.extend({
		
			initialize: function (markerList, options) {
				this.real = new L.AKM.MarkerControl(markerList, options);
			},
			
			onAdd: function(map) {
				map.addControl(this.real);
				if(!this.added && query.tr) {
					this.added = true;
					let that = this.real;
					setTimeout(function() {
						if(that.options.loadOperation instanceof Function) {
							var data = that.getMarkers();
							if(that.options.dataPro2 instanceof Function)
								data = that.options.dataPro2(data);
							that.options.loadOperation(that.getMarkers(), that);
						}
					}, 2000);
				}
			},
			
			onRemove: function(map) {
				map.removeControl(this.real);
			}
		});
		
		
		L.AKM.Util.getJSON(
			"../data/icons/icon-configuration.json",
			function(data) {
				icons = L.AKM.Util.loadIcon(data);
			},
			undefined,
			undefined,
			undefined,
			false,
			5000
		);
		
		let dlgW = 750;
		let dlgH = 300;
		if(innerWidth * 0.75 < dlgW)
			dlgW = innerWidth * 0.70;
		if(innerHeight * 0.75 < dlgH)
			dlgH = innerHeight * 0.70;
		let dialog = L.control.dialog({
			anchor: [50, 0.5 * (innerWidth - dlgW)],
			size: [dlgW, dlgH],
			maxSize:[innerWidth * 0.75, innerHeight * 0.75]
		});
		let resizeDlg = function() {
			if(innerWidth * 0.75 < dlgW)
				dlgW = innerWidth * 0.70;
			if(innerHeight * 0.75 < dlgH)
				dlgH = innerHeight * 0.70;
			dialog.setLocation([50, 0.5 * (innerWidth - dlgW)]).setSize([dlgW, dlgH]);
		}
		window.addEventListener("resize", resizeDlg, false);
		
		Class.registerVar(
			"L.AKM.GroupedMarkerLayer",
			"$ICON_DATAPREPRO",
			function(markerData) {
				markerData.forEach(function(r) {
					if(r.icon && icons)
						r.icon = icons[r.icon]
					if(!r.icon)
						delete r.icon;
				});
				return markerData;
			}
		);
		
		Class.registerVar(
			"L.AKM.MarkerControlLayer",
			"$SEARCH_UI",
			function(markerList, ctrl) {
				try {
					let map = ctrl._map;
					dialog.setContent(searchDialog(map, markerList)).addTo(map);
				} catch(e) {
					console.warn(e);
				}
			}
		);
		
		Class.registerVar(
			"L.AKM.MarkerControlLayer",
			"$SEARCH_UI_YAKM",
			function(markerList, ctrl) {
				try {
					let map = ctrl._map;
					dialog.setContent(searchDialog(map, markerList, "name")).addTo(map);
				} catch(e) {
					console.warn(e);
				}
			}
		);
		
		
		Class.registerVar(
			"L.AKM.MarkerControlLayer",
			"$LOAD_OP_YAKM",
			function(data, ctrl) {
				let id = query.tr;
				if(id === undefined) {
					id = prompt("JSONBlob id:");
				}
				if(id === "")
					return;
				JSONBlob.getJSON(id, {
					success: function(respObj, resp) {
						data = respObj[ctrl.options["akm-id"]];
						if(data !== undefined) {
							sessionStorage.setItem(L.Util.stamp(ctrl), JSON.stringify(data));
							ctrl._removeList();
							ctrl._addList(data);
						}
					}
				});
			}
		);
		
		
		Class.registerVar(
			"L.AKM.MarkerControlLayer",
			"$PUSH_OP_YAKM",
			function(data, ctrl) {
				let id = query.tr;
				if(id === undefined) {
					id = prompt("JSONBlob id:");
				}
				if(id === "")
					return;
				JSONBlob.getJSON(id, {
					success: function(respObj) {
						let old = respObj[ctrl.options["akm-id"]];
						let priv = JSON.parse(sessionStorage.getItem(L.Util.stamp(ctrl)));
						let cmp = function(a, b) {
							let ta = new Date(a.timestamp).getTime();
							let tb = new Date(b.timestamp).getTime();
							if(ta == tb)
								return a.name.localeCompare(b.name);
							else
								return(ta - tb);
						}
						if(old === undefined && priv === undefined) {
							respObj[ctrl.options["akm-id"]] = data;
						} else {
							if(old === undefined || priv === undefined)
								return;
							old = old.markers;
							priv = priv.markers;
							data = data.markers;
							for(let cate in data) {
								if(!(cate in priv))
									priv[cate] = new Array();
								if(!(cate in old))
									old[cate] = new Array();
								updateMarkerList_YAKM(old[cate], priv[cate], data[cate], cmp);
							}
						}
						JSONBlob.putJSON(id, respObj, {
							success: function(respObj, resp) {
								sessionStorage.setItem(L.Util.stamp(ctrl), JSON.stringify(respObj[ctrl.options["akm-id"]]));
								alert("upload complete @https://jsonblob.com/" + id);
							}
						});
					}
				});
			}
		);
		
		Class.registerVar(
			"L.AKM.MarkerControlLayer",
			"$EDIT_UI",
			function(marker, markerObj, ctrl) {
				try {
					let map = ctrl._map;
					let dom = document.createElement("div");
					let changed = false;
					dom.innerHTML = document.getElementById("template-02").innerHTML;
					dom.id = "edit_dialog";
					dialog.setContent(dom).addTo(map);
					let vm = new Vue({
						el: "#" + dom.id,
						data: {
							marker: markerObj,
							iconUrl: new String(markerObj.icon in icons ? icons[markerObj.icon].options.iconUrl : ""),
						},
						computed: {
							icons: function() {return icons;},
						},
						methods: {
							oc_marker_change: function(event) {
								let t = event.target;
								this.marker[t.name] = t.value;
								changed = true;
								this.iconUrl = this.marker.icon in this.icons ? this.icons[this.marker.icon].options.iconUrl : "";
							},
						},
						destroyed: function() {
							dom.remove();
						},
					});
					let closeCallback = function(event) {
						map.off("dialog:closed", closeCallback);
						if(changed) {
							ctrl.updateMarker(marker);
						}
						vm.$destroy();
					}
					map.on("dialog:closed", closeCallback);
				} catch(e) {
					console.warn(e);
				}
			}
		);
		
		Class.registerVar(
			"L.AKM.MarkerControlLayer",
			"$DATA_PRO_1_YAKM",
			function(data, ctrl) {
				iconJSON = data.icons;
				for(let p in iconJSON) {
					if(p in icons)
						continue;
					L.AKM.Util.getJSON(
						iconJSON[p],
						function(data) {
							let ico = icons[this] = new L.Icon(data);
							for(let ind in ctrl._markers) {
								let pair = ctrl._markers[ind];
								if(pair.obj.icon == this)
									pair.layer.setIcon(ico);
							}
						},
						p
					)
				}
				let markers = data.markers;
				let array = new Array();
				ctrl["_$category"] = Object.keys(markers);
				for(let p in markers) {
					markers[p].forEach(function(item){
						item.category = p;
						this.push(item);
					}, array);
				}
				return array;
			}
		);
		
		Class.registerVar(
			"L.AKM.MarkerControlLayer",
			"$DATA_PRO_2_YAKM",
			function(data) {
				let markers = {};
				data.forEach(function(item) {
					let p = item.category;
					delete item.category;
					if(!(p in markers))
						markers[p] = new Array();
					markers[p].push(item);
				}, markers);
				return {
					markers: markers,
					icons: iconJSON
				};
			}
		);
		
		Class.registerVar(
			"L.AKM.MarkerControlLayer",
			"$MARKER_YAKM",
			function(markerObj) {
				var marker = new L.Marker([markerObj.z, markerObj.x]);
				if(markerObj.icon in icons)
					marker.setIcon(icons[markerObj.icon]);
				var title = String.prototype.concat.call('<span style="font-weight:bold;">', markerObj.name, '</span>');
				var coord = String.prototype.concat.call('<span style="font-size:smaller;">', markerObj.x, ',', markerObj.z, '</span>');
				var descr = '';
				if(markerObj.description)
					descr = String.prototype.concat.call('<span style="max-width: 200px; word-wrap:break-word; word-break:break-all;" >', markerObj.description.replace(/\n/g, '<br/>'), '</span>');
				var category = '';
				if(markerObj.category)
					category = String.prototype.concat.call('<span style="font-style:italic; font-size:smaller; color:aqua;">', markerObj.category, '</span>');
				marker.bindPopup(String.prototype.concat.call('<div>',title, category, '</div>', coord, '<hr/>' , descr));
				return marker;
			}
		);
		
		Class.registerVar(
			"L.AKM.MarkerControlLayer",
			"$EDIT_UI_YAKM",
			function(marker, markerObj, ctrl) {
				try {
					let map = ctrl._map;
					let dom = document.createElement("div");
					let changed = false;
					dom.innerHTML = document.getElementById("template-03").innerHTML;
					dom.id = "edit_dialog";
					dialog.setContent(dom).addTo(map);
					let vm = new Vue({
						el: "#" + dom.id,
						data: {
							marker: markerObj,
							iconUrl: new String(markerObj.icon in icons ? icons[markerObj.icon].options.iconUrl : ""),
							categories: ctrl["_$category"].slice(0),
						},
						computed: {
							icons: function() {return icons;},
						},
						methods: {
							oc_marker_change: function(event) {
								let t = event.target;
								this.marker[t.name] = t.value;
								changed = true;
								if(t.name == "icon")
									this.iconUrl = this.marker.icon in this.icons ? this.icons[this.marker.icon].options.iconUrl : "";
							},
						},
						destroyed: function() {
							dom.remove();
						},
					});
					let closeCallback = function(event) {
						map.off("dialog:closed", closeCallback);
						if(changed) {
							markerObj["timestamp"] = new Date().toISOString();
							markerObj["uploader"] = -1;
							ctrl.updateMarker(marker);
						}
						vm.$destroy();
					}
					map.on("dialog:closed", closeCallback);
				} catch(e) {
					console.warn(e);
				}
			}
		);
		
		let dynamicAdd = function(url, controller) {
			L.AKM.Util.getJSON(
				url,
				function(data) {
					let unit;
					unit = data.crs;
					controller.registerCRS(Class.forName(unit.class).newInstance(unit.args), data.world);
					unit = data.baselayer;
					controller.registerBaseLayer(Class.forName(unit.class).newInstance(unit.args), data.world);
					for(let p in data.overlayers) {
						unit = data.overlayers[p];
						controller.registerOverlay(Class.forName(unit.class).newInstance(unit.args), p, data.world, unit.autoshow);
					}
					if(data.default) {
						setTimeout(function() {controller.addToMap(data.world);}, 100);
					}
					let style = document.querySelector("#map").style;
					style.backgroundColor = "black";
					style.cursor = "default";
				},
				undefined,
				undefined,
				undefined,
				true
			);
		}
		
		//main
		
		let map = new L.Map('map', {
			renderer: L.canvas({ padding: 0.01 }),
			zoomSnap: 0.05,
			zoomDelta: 0.25,
			closePopupOnClick: true
		}).setView([0,0],-1);
		
		map.on('mousemove', function(event) {
			var latlng = event.latlng;
			this.innerHTML = String.prototype.concat.call(
				'<span>指向坐标</span>',
				'<span class="pointer-point-x">', 'x:', Math.round(latlng.lng), '</span>',
				'<span class="pointer-point-z">', 'z:', Math.round(latlng.lat), '</span>',
				'<span class="pointer-point-chunk">', 'chunk:', Math.floor(latlng.lng / 16), ',', Math.floor(latlng.lat / 16), '</span>'
			);
		}, document.querySelector("#debug"));
		
		
		let scaleControl = new L.AKM.ScaleControl().addTo(map);
		
		//leaflet-draw: temporarily add for overworld-railway project {
		
		let drawnItems = new L.GeoJSON().addTo(map);
		
		let drawControl = new L.Control.Draw({
			edit: {
				featureGroup: drawnItems,
				poly: {
					allowIntersection: false
				},
				
			},
			draw: {
				polygon: {
					allowIntersection: false,
					showArea: true
				},
			}
		}).addTo(map);
		
		
		map.on(L.Draw.Event.CREATED, function (event) {
			let layer = event.layer;

			drawnItems.addLayer(layer);
		});
		
		let loadGeo = new L.Control.EasyButton(
			'<img src="load-is.svg" class="help-and-about-icon"></img>',
			function() {
				let s = prompt('请粘贴GeoJSON');
				try {
					s = JSON.parse(s);
					drawnItems.addData(s);
				} catch(e) {
					if(s)
						console.warn(e);
				}
			},
			'由GeoJSON加载绘图',
			null,
			{
				position: 'topleft',
				tagName: 'a',
			}
		);
		
		let saveGeo = new L.Control.EasyButton(
			'<img src="save-is.svg" class="help-and-about-icon"></img>',
			function() {
				let s = drawnItems.toGeoJSON();
				L.AKM.Util.simulateUpload(s);
			},
			'保存绘图为GeoJSON',
			null,
			{
				position: 'topleft',
				tagName: 'a',
			}
		);
		
		let ebbar = L.easyBar([ loadGeo, saveGeo]).addTo(map);
		
		
		let ctrl = new L.AKM.BindedLayerControl().addTo(map);
		
		let help = new L.Control.EasyButton(
				'<img src="lib/help&about.svg" class="help-and-about-icon"></img>',
				function() {
					let dom = document.createElement("div");
					dom.innerHTML = document.getElementById("help-template").innerHTML;
					dialog.setContent(dom).addTo(map);
				},
				'Help & About',
				null,
				{
					position: 'topright',
					tagName: 'a',
				}
		).addTo(map);
		
		
		L.AKM.Util.getJSON(
			("sp" in query) ? query.sp : 'index.json', 
			function(data) {
				data.forEach(function(url) {dynamicAdd(url, ctrl);});
			},
			undefined,
			undefined,
			undefined,
			true
		);
		
		
		//common layer: MenuControl
		
		/*
		let menuControl = new L.AKM.VMenuControl('MENU', [
			{
				title: 'Help',
				callback: function () {
					let dom = document.createElement('div');
					dom.innerHTML = String.prototype.concat.call(
						'<table style="text-align:left;">',
							'<tr><td>+ / - / 鼠标滚轮</td><td>缩放</td></tr>',
							'<tr><td>LayerControl-markers</td><td>显示/隐藏标记点</td></tr>',
							'<tr><td>Menu-Marking</td><td>开启/关闭标记点操作</td></tr>',
							'<tr><td>鼠标左键</td><td>显示/隐藏提示、放置/取消放置标记点</td></tr>',
							'<tr><td>Menu-Search</td><td>搜索标记点，可根据搜索结果索引跳转</td></tr>',
						'</table>'
					);
					dialog.setContent(dom).addTo(map).setLocation([20,20]);
				}
			}, {
				title: "Search",
				callback: function () {
					try {
						dialog.setContent(searchDialog(map, ctrl.getCurrent().overlayers.selected['map-marker'].getMarkers())).addTo(map).setLocation([20,20]);
					} catch(e) {
						console.debug(e);
					}
				},
			}, {
				title: "Marker",
				sub: [{
						title: 'on/off',
						callback: function (e) {
							try {
								let userMarkersLayer = ctrl.getCurrent().overlayers.selected['user-marker'];
								if (userMarkersLayer.canEdit()) {
									userMarkersLayer.disableEdit();
									e.target._AKMvm_p.style.backgroundColor = "";
								} else {
									e.target._AKMvm_p.style.backgroundColor = "#AFD";
									userMarkersLayer.enableEdit();
								}
							} catch(err) {
								console.debug(err);
							}
						}
					}, {
						title: "SetMark",
						callback: function() {
							try {
								let userMarkersLayer = ctrl.getCurrent().overlayers.selected['user-marker'];
								if(userMarkersLayer) {
									try {
										let s = prompt('标记点位置: ', '0,0');
										s = s.split(',');
										userMarkersLayer.addMarker({title: '', x: Number.parseFloat(s[0]), z: Number.parseFloat(s[1])}, true);
										map.setView(L.latLng(s[1], s[0]), map.getMaxZoom());
									} catch(e) {
										alert(e);
									}
								}
							} catch(err) {
								console.debug(err);
							}
						},
					}
				]
				
			}, {
				title: "About",
				callback: function () {
					alert('推荐功能更完善的地图版本\n[jsw YAKM](https://kedama-map.jsw3286.eu.org/');
					let cet = document.createElement("center");
					let p = document.createElement("p");
					let warn = document.createTextNode("此条目正在开发中...");
					cet.appendChild(warn);
					dialog.setContent(cet.innerHTML).addTo(map).setLocation([20,20]);
				},
			}
		]).addTo(map);
		*/
		
		
		//}
		
		/*
		//modal test
		
		Vue.component('modal', {
			template: '#modal-template'
		});
		
		let vm = new Vue({
			el: '#modal-test-01',
			data: {
				showModal: false
			}
		})*/
		let vm = null;
		
		if(!L.Browser.ie) {
			eval('console.log("hook => ", {map, ctrl, dialog, drawnItems, vm})');
		}
	});
})();



//======================================================================================
//======================================================================================
// unused code
//======================================================================================
//======================================================================================
function unused2() {
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
	var menuControl = new L.KC.VMenuControl('MENU', [
		{
			title: 'Help',
			callback: function () {
				let dom = document.createElement('div');
				dom.innerHTML = '<table style="text-align:left;">'
					+ '<tr><td>+ / - / 鼠标滚轮</td><td>缩放</td></tr>'
					+ '<tr><td>LayerControl-markers</td><td>显示/隐藏标记点</td></tr>'
					+ '<tr><td>Menu-Marking</td><td>开启/关闭标记点操作</td></tr>'
					+ '<tr><td>鼠标左键</td><td>显示/隐藏提示、放置/取消放置标记点</td></tr>'
					+ '<tr><td>Menu-Search</td><td>搜索标记点，可根据搜索结果索引跳转</td></tr>'
					+ '</table>';
				map_dialog(map, dom, 'Tips');
			}
		}, {
			title: "Search",
			callback: function () {
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
		}, {
			title: "Marker",
			sub: [{
					title: 'on/off',
					callback: function (e) {
						var userMarkersLayer = mgr.getCurrentDataStruct().overlayers['user-marker'];
						if(userMarkersLayer) {
							if (userMarkersLayer.mc_addMarkerCallback) {
								userMarkersLayer.disableMarkerRemove();
								map.off('click', userMarkersLayer.mc_addMarkerCallback);
								delete userMarkersLayer.mc_addMarkerCallback;
								e.target._lkc_vm_p.style.backgroundColor = "";
							} else {
								e.target._lkc_vm_p.style.backgroundColor = "#AFD";
								userMarkersLayer.mc_addMarkerCallback = function(event) {
									userMarkersLayer.addMarker({title: '', x: Math.round(event.latlng.lng), z: Math.round(event.latlng.lat), icon: mapUtil.mapIcons['pointer']}, true);
								}
								setTimeout(function() {
									map.on('click', userMarkersLayer.mc_addMarkerCallback);
								}, 10);
								
								userMarkersLayer.enableMarkerRemove();
							}
						}
					}
				}, {
					title: "SetMark",
					callback: function() {
						var userMarkersLayer = mgr.getCurrentDataStruct().overlayers['user-marker'];
						if(userMarkersLayer) {
							try {
								var s = prompt('标记点位置: ', '0,0');
								s = s.split(',');
								userMarkersLayer.addMarker({title: '', x: Number.parseFloat(s[0]), z: Number.parseFloat(s[1]), icon: mapUtil.mapIcons['pointer']}, true);
								map.setView(L.latLng(s[1], s[0]), map.getMaxZoom());
							} catch(e) {
								alert(e);
							}
						}
					},
				}
			]
			
		}, {
			title: "About",
			callback: function () {
				alert('推荐功能更完善的地图版本\n[jsw YAKM](https://kedama-map.jsw3286.eu.org/');
				var cet = document.createElement("center");
				var p = document.createElement("p");
				var warn = document.createTextNode("此条目正在开发中...");
				cet.appendChild(warn);
				map_dialog(map, cet, 'About');
			},
		}
	]).addTo(map);
	
	//register pointer show
	map.on('mousemove', function (event) {
		document.getElementById('debug').innerHTML = mapUtil.pointerFormatter(event.latlng);
	});
	
	map.on('baselayerchange', function(event) {
		mgr.onChangeBaselayers(event, layerControl);
	});
	
	_hook = {map: map, util: mapUtil, mgr: mgr};
	
}
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
	this.map = null;                            //  leaflet map
	this.data = { attribution:"", marks:[]};    //  json data
	this.showMarkers = false;   //  L.markers & whether to show it
	this.layerSMarker = null;
	this.layerMarker = null;
	this.layerMap = {};
	this.icons = [];                            //  L.icons from icon pictures
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
//      this.layerMap[world] = L.tileLayer(pathroot, tileOptions).addTo(this.map);
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
		
	/*  this.onClickCallbacks.showMarks = function(event) {
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
//                      that.keyPressed[key] = null;
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
	 *  `map.setView(<number:x>,<number:z>)`
	 *  move to position(x,z)
	 */
	this.setView = function(x, z) {
		this.map.setView([z, x], this.map.getMaxZoom());
	};
	
	/**
	 *  `map.getStaticMarks()`
	 *  get an array of static marks in form of `[{title:$title, x:$x, z:$z},...]` 
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
	 *  `map.getUserMarks()`
	 *  get an array of user marks in form of `[{title:$index, x:$x, z:$z},...]`
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
	 *  `map.searchMarks(<string:keyword>)`
	 *  search the static mark list for marks whose title contain keyword
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
	 *  `map.setMark(<number:x>,<number:z>,<optional string:title>,<optional int:icon>)`
	 *  set a mark at position(x,z)
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
	 *  `new map.Dialog(<optional HTMLElement:htmlElement>,<optional string:title>)`
	 *  create an Dialog with a close button to display HTMLElement
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