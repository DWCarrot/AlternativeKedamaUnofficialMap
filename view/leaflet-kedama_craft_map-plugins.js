
/* global L */

/* namespace */
L.KC = {
	Util: {},
	Style: "",
};


L.KC.Style = "\
	.leaflet-kc-control-vmenu {\
		cursor: default;\
	}\
	.leaflet-kc-control-vmenu-head {\
		background-color: #fff;\
		border-bottom: 1px solid #ccc;\
		font-weight: bold;\
	}\
	.leaflet-kc-control-vmenu-item,\
	.leaflet-kc-control-vmenu-item:hover {\
		position: relative;\
		border-bottom: 1px solid #ccc;\
	}\
	.leaflet-kc-control-vmenu-item {\
		background-color: #fff;\
	}\
	.leaflet-kc-control-vmenu-item:hover,\
	.leaflet-kc-control-vmenu-item:hover > span {\
		background-color: #f4f4f4;\
	}\
	.leaflet-kc-control-vmenu-title {\
		display: inline;\
		background-color: #fff;\
		padding: 2px;\
	}\
	.leaflet-kc-control-vmenu-submenu {\
		position: absolute;\
		border-left: 1px solid #ccc;\
		border-right: 1px solid #ccc;\
		display: none;\
	}\
	.leaflet-kc-control-vmenu-list {\
		list-style: none;\
		text-align: left;\
	}\
";


/*				*/


/**
 *
 */
L.KC.Util.addStyle = function(css) {
	var head = document.getElementsByTagName("head")[0];
	var style = document.createElement("style");
	style.type = "text/css";
	style.innerHTML = css;
	head.appendChild(style);
}

/**
 *
 */
L.KC.Util.loadStyle = function(url) {
	var head = document.getElementsByTagName("head")[0];
	var style = document.createElement("link");
	style.rel = 'stylesheet';
	style.href = url;
	head.appendChild(style);
}

/**
 *
 */
L.KC.Util.loadScript = function(url) {
	var body = document.getElementsByTagName("body")[0];
	var script = document.createElement("script");
	script.type = 'text/javascript';
	script.src = url;
	body.appendChild(script);
	return script;
}


/**
 *
 */
L.KC.ChunkMarker = L.LayerGroup.extend({
	
	options: {
		pane: 'overlayPane',
		attribution: null,
		intetval: 16,
		blockOpacity: 0.8,
		newId: function(list) {return Object.keys(list).length;},
	},
	
	initialize: function(chunkMarkerList, options) {
		if(chunkMarkerList instanceof Array) {
			this._list = chunkMarkerList;
		} else {
			L.AKM.Util.getJSON(
				chunkMarkerList,
				function(data) {
					this._list = data;
				},
				this,
				undefined,
				undefined,
				true,
				5000
			)
		}
		this.selectedIndex = undefined;
		L.LayerGroup.prototype.initialize.call(this, [], options);
	},
	
	onAdd: function(map) {
		var box = this._box = L.polygon([], {color: 'red', weight: 1, fill: false});
		var that = this;
		box.redrawBox = function(event) {
			var pos = that._getChunk(event.latlng);
			if(!pos.equals(box._chunkPos)) {
				box._chunkPos = pos;
				box.setLatLngs(that._getVex(pos));
			}
			//L.DomEvent.stopPropagation(event);
		}
		box.addTo(map);
		map.on('mousemove', this._box.redrawBox);
		this._callback_addBlock = function(event) {
			if(that.selectedIndex in that._list) {
				that.addBlock(that.selectedIndex, that._getChunk(event.latlng));
			}
			L.DomEvent.stopPropagation(event);
		};
		map.on('click', this._callback_addBlock);
		this._generateLayers();
		L.LayerGroup.prototype.onAdd.call(this, map);
	},
	
	onRemove: function(map) {
		if(this._box)
			map.off('mousemove', this._box.redrawBox);
		this._box.removeFrom(map);
		map.off('click', this.callback_addBlock);
		this.selectedIndex = undefined;
		this.clearLayers();
		L.LayerGroup.prototype.onRemove.call(this, map);
	},
	
	addBlock: function(ind, chunkPos) {		//chunkPos: {x: <Number>, z: <Number>} or L.LatLng
		if(chunkPos instanceof L.LatLng)
			chunkPos = {cx: chunkPos.lng, cz: chunkPos.lat};
		this.addLayer(this._generateBlock(ind, chunkPos));
		this._list[ind].area.push(chunkPos);
	},
	
	getList: function() {
		return this._list;
	},
	
	setIndex: function(ind) {
		if(ind == undefined || ind in this._list) {
			this.selectedIndex = ind;
			return true;
		}
		return false;
	},
	
	clearIndex: function() {
		return this.setIndex(undefined);
	},
	
	createIndex: function(record, select) {
		if( typeof record.title == 'undefined' 
		 || typeof record.declarant == 'undefined' 
		 || typeof record.color == 'undefined' )
			throw new TypeError(record);
		var ind = this.options.newId(this._list);
		this._list[ind] = record;
		if(typeof record.area == "array" && record.area) {
			for(var i = 0; i < record.area.length; ++i) {
				this.addLayer(this._generateBlock(ind, record.area[i]));
			}
		} else {
			record.area = [];
		}
		if(select)
			this.selectedIndex = ind;
	},
 	
	updateRecord: function(ind) {
		var that = this;
		this.eachLayer(function(block) {
			if(block._linked_ind == ind) {
				that.removeLayer(block);
			}
		});
		this._list[ind].area.forEach(function(value) {
			that.addLayer(that._generateBlock(ind, value));
		})
	},
	
	
	
	_generateLayers: function() {
		for(var i in this._list) {
			if(i == 'length')
				continue;
			var record = this._list[i];
			for(var j = 0; j < record.area.length; ++j) {
				this.addLayer(this._generateBlock(i, record.area[j]));
			}
		}
	},
	
	_getVex: function(cx, cz) {
		var d = this.options.intetval;
		if(cx instanceof L.LatLng) {
			cz = cx.lat;
			cx = cx.lng;
		}
		return [
			L.latLng(cz * d, cx * d),
			L.latLng((cz + 1) * d, cx * d),
			L.latLng((cz + 1) * d, (cx + 1) * d),
			L.latLng(cz * d, (cx + 1) * d),
		]
	},
	
	_getChunk: function(x, z) {	//or (latLng, )
		if(!(x instanceof L.LatLng)) {
			x = L.latLng(x, z)
		}
		var d = this.options.intetval;
		x.lat = Math.floor(x.lat / d);
		x.lng = Math.floor(x.lng / d);
		return x;
	},
	
	_generateBlock: function(ind, chunkPos) {		//chunkPos: {x: <Number>, z: <Number>}
		var that = this;
		var block = L.polygon(this._getVex(chunkPos.cx, chunkPos.cz), {stroke: false, fill: true, fillColor: this._list[ind].color, fillOpacity: this.options.blockOpacity });
		block._linked_ind = ind;
		block._linked_pos = chunkPos;
		block.bindPopup(this._formatter(this._list[ind]));
		block.on('click', function(event) {
			var b = event.target;
			if(b._linked_ind === that.selectedIndex) {
				that.removeLayer(b);
				var area = that._list[b._linked_ind].area;
				area.splice(area.indexOf(b._linked_pos), 1);
			}
			else
				b.openPopup();
			L.DomEvent.stopPropagation(event);
		});
		return block;
	},
	
	_formatter: function(record) {
		record = {title: record.title, declarant: record.declarant};
		return L.Util.template('<div><div>{title}</div><hr/><div style="font-size: smaller">{declarant}</div></div>', record);
	}
	
});

L.KC.BChunkMarker = L.KC.ChunkMarker.extend({
	
	
	onAdd: function(map) {
		var that = this;
		if(L.control.slideMenu) {
			if(!this._slideMenu)
				this._slideMenu = L.control.slideMenu('<div id="chunkmarker_beta_sildemenu" ></div>');
			this._slideMenu.addTo(map);
			var container = document.getElementById('chunkmarker_beta_sildemenu');
			L.DomUtil.create('div', 'chunkmarker-beta-list', container).appendChild(this._b_createRecordTable());
			L.DomUtil.create('hr', '', container);
			L.DomUtil.create('div', 'chunkmarker-beta-control', container).appendChild(this._b_createControlTable());
			L.DomUtil.create('hr', '', container);
			L.DomUtil.create('div', 'chunkmarker-beta-commit',container).appendChild(this._b_createCommitControl());
		}
		L.KC.ChunkMarker.prototype.onAdd.call(this, map);
		if(this.options.onAddCallback instanceof Function)
			this.options.onAddCallback();
		//TODO
		document.getElementById('chunkmarker_beta_input_commit').addEventListener('click', function(event) {
			var list = event.target.source;
			console.log(list);
			var tip = document.createElement('div');
			tip.innerHTML = 'emmm其实并没有服务器会接受这个请求(<br />emmm其实并没有服务器(((<br />可以点击下面的链接把数据下载下来<br/>然后交给RDCarrot/jsw/SilentDepth<hr/>';
			var p = new FileOperation();
			p.createDownloadDialog(p.downloadFile('v3-chunkmark.json', JSON.stringify(list)),300,300, tip);
		});
		
	},
	
	onRemove: function(map) {
		if(this.options.onRemoveCallback instanceof Function)
			this.options.onRemoveCallback();
		if(this._slideMenu) {
			var container = document.getElementById('chunkmarker_beta_sildemenu');
			container.innerHTML = '';
			this._slideMenu.remove();
		}
		L.KC.ChunkMarker.prototype.onRemove.call(this, map);
	},
	
	_b_createRecordTable: function() {
		var table = document.createElement('table');
		table.id = 'chunkmarker_beta_list_table';
		table.className = 'chunkmarker-beta-list-table ' + table.className;
		table.appendChild(this._b_createRecordHead());
		for(var i in this._list) {
			table.appendChild(this._b_createRecordLine(i));
		}
		return table;
	},
	
	_b_createRecordHead: function() {
		var that = this;
		var tr = document.createElement('tr');
		var th, ctx;
		
		th = document.createElement('th');
		tr.appendChild(th);
		ctx = document.createElement('input');
		th.appendChild(ctx);
		ctx.type = 'radio';
		ctx.name = 'chunkmarker_beta_input_select';
		ctx.addEventListener('click', function(event) {
			that.setIndex(undefined);
		});
		
		th = document.createElement('th');
		tr.appendChild(th);
		ctx = document.createElement('span');
		th.appendChild(ctx);
		ctx.innerText = 'title';
		
		th = document.createElement('th');
		tr.appendChild(th);
		ctx = document.createElement('span');
		th.appendChild(ctx);
		ctx.innerText = 'declarant';
		
		th = document.createElement('th');
		tr.appendChild(th);
		ctx = document.createElement('span');
		th.appendChild(ctx);
		ctx.innerText = 'color';
		
		return tr;
	},
	
	_b_createRecordLine: function(ind) {
		var that = this;
		var record = this._list[ind];
		var tr = document.getElementById('chunkmarker_beta_tr' + ind);
		if(tr) {
			tr.innerHTML = '';
		} else {
			tr = document.createElement('tr');
			tr.id = 'chunkmarker_beta_tr' + ind;
		}
		var td, ctx;
		
		td = document.createElement('td');
		tr.appendChild(td);
		ctx = document.createElement('input');
		td.appendChild(ctx);
		ctx.type = 'radio';
		ctx.name = 'chunkmarker_beta_input_select';
		ctx.value = ind;
		ctx.addEventListener('click', function(event) {
			that.setIndex(event.target.value);
			var record = that._list[that.selectedIndex];
			document.getElementById('chunkmarker_beta_input_title').value = record.title;
			document.getElementById('chunkmarker_beta_input_declarant').value = record.declarant;
			document.getElementById('chunkmarker_beta_input_color').value = record.color;
		});
		
		td = document.createElement('td');
		tr.appendChild(td);
		ctx = document.createElement('span');
		td.appendChild(ctx);
		ctx.innerText = record.title;
		
		td = document.createElement('td');
		tr.appendChild(td);
		ctx = document.createElement('span');
		td.appendChild(ctx);
		ctx.innerText = record.declarant;
		
		td = document.createElement('td');
		tr.appendChild(td);
		ctx = document.createElement('input');
		td.appendChild(ctx);
		ctx.type = 'color';
		ctx.value = record.color;
		ctx.disabled = 'disabled';
		
		return tr;
	},
	
	_b_createControlTable: function() {
		var that = this;
		var table = document.createElement('table');
		table.className = 'chunkmarker-beta-control-table ' + table.className;
		var tr, td, ctx;
		
		tr = document.createElement('tr');
		table.appendChild(tr);
		td = document.createElement('td');
		tr.appendChild(td);
		ctx = document.createElement('span');
		td.appendChild(ctx);
		ctx.innerText = 'title';
		td = document.createElement('td');
		tr.appendChild(td);
		ctx = document.createElement('input');
		td.appendChild(ctx);
		ctx.id = 'chunkmarker_beta_input_title';
		
		tr = document.createElement('tr');
		table.appendChild(tr);
		td = document.createElement('td');
		tr.appendChild(td);
		ctx = document.createElement('span');
		td.appendChild(ctx);
		ctx.innerText = 'declarant';
		td = document.createElement('td');
		tr.appendChild(td);
		ctx = document.createElement('input');
		td.appendChild(ctx);
		ctx.id = 'chunkmarker_beta_input_declarant';
		
		tr = document.createElement('tr');
		table.appendChild(tr);
		td = document.createElement('td');
		tr.appendChild(td);
		ctx = document.createElement('span');
		td.appendChild(ctx);
		ctx.innerText = 'color';
		td = document.createElement('td');
		tr.appendChild(td);
		ctx = document.createElement('input');
		td.appendChild(ctx);
		ctx.type = 'color';
		ctx.id = 'chunkmarker_beta_input_color';
		
		tr = document.createElement('tr');
		table.appendChild(tr);
		td = document.createElement('td');
		tr.appendChild(td);
		ctx = document.createElement('input');
		td.appendChild(ctx);
		ctx.type = 'button';
		ctx.id = 'chunkmarker_beta_input_button';
		ctx.value = 'confirm';
		ctx.addEventListener('click', function(event) {
			var title = document.getElementById('chunkmarker_beta_input_title').value;
			var declarant = document.getElementById('chunkmarker_beta_input_declarant').value;
			var color = document.getElementById('chunkmarker_beta_input_color').value;
			if(title == '' || declarant == '' || color == '') 
				return;
			if(that.selectedIndex in that._list) {
				that._list[that.selectedIndex].title = title;
				that._list[that.selectedIndex].declarant = declarant;
				that._list[that.selectedIndex].color = color;
				that.updateRecord(that.selectedIndex);
				that._b_createRecordLine(that.selectedIndex);
			} else {
				that.createIndex({title: title, declarant: declarant, color: color}, true);
				document.getElementById('chunkmarker_beta_list_table').appendChild(that._b_createRecordLine(that.selectedIndex));
			}
		});
		td = document.createElement('td');
		
		return table;
	},
	
	_b_createCommitControl: function() {
		var form = document.createElement('form');
		var btn = document.createElement('input');
		form.appendChild(btn);
		btn.type = 'button';
		btn.id = 'chunkmarker_beta_input_commit';
		btn.value = 'commit';
		btn.source = this._list;
		return form;
	}
});


L.KC.ShowVertex = L.LayerGroup.extend({
	
	initialize: function(url, options) {
		L.AKM.Util.getJSON(
			url,
			function(data) {
				this._list = data;
			},
			this,
			undefined,
			undefined,
			true,
			5000
		)
		L.LayerGroup.prototype.initialize.call(this, [], options);
	},
	
	onAdd: function(map) {
		var ls = new Array();
		for(var prop in this._list) {
			var r = this._list[prop];
			this.addLayer(new L.Polygon(r.vertex, {stroke: false, fill: true, fillColor: r.color, fillOpacity: 0.75}));
		}
	},
	
	onRemove: function(map) {
		this.clearLayers();
	}
	
});

//global initialize
(function() {
	L.KC.Util.addStyle(L.KC.Style);
	L.KC.Util.loadScript("lib/L.Control.SlideMenu.js");
	L.KC.Util.loadStyle("lib/L.Control.SlideMenu.css");
})();

