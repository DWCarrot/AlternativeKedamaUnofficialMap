/// #require L from leaflet.js
/// #require L.AKM.Util from L.AKM.Util.js

if(L.AKM === undefined)
	L.AKM = {};

/**
 *
 *	@param	title	<String/HtmlString>
 *	@param	items	<Array<:Menu-Item>>
 *				<:Menu-Item>	{title , sub?, callback?}
 *					title		<String/HtmlString>
 *					sub			<Array<:Menu-Item>>
 *					callback	<function>			@param	event	<DomEvent>
 */
L.AKM.VMenuControl = L.Control.extend({
	
	options: {
		position: 'topright'
		
	},
	
	initialize: function(title, items, options){
		L.Util.setOptions(this, options);
		this._title = (title ? title : 'MENU');
		this._items = items;
	},
	
	_generate: function(itemsList, parentTitle) {
		var that = this;
		var ulistDom = L.DomUtil.create('li', 'leaflet-akm-vm-list');
		for(var i = 0; i < itemsList.length; ++i) {
			var menuItem = itemsList[i];
			var li = L.DomUtil.create('li', 'leaflet-akm-vm-item', ulistDom);
			var span = L.DomUtil.create('span', 'leaflet-akm-vm-title', li);
			span.innerHTML = menuItem.title;
			if(parentTitle)
				span._AKMvm_p = parentTitle;
			L.DomEvent.on(span, 'click', function(event) {
				//	event: DomEvent
				var span1 = event.target;
				var isShow = (ulistDom._AKMvm_sub == span1._AKMvm_sub);
				if(ulistDom._AKMvm_sub != undefined) {
					ulistDom._AKMvm_sub.style.display = "none";
					ulistDom._AKMvm_sub = undefined;
				}
				if(span1._AKMvm_sub != undefined && (!isShow)) {
					span1._AKMvm_sub.style.display = "inherit";
					ulistDom._AKMvm_sub = span1._AKMvm_sub;
					if(that.options.position.indexOf('left') >= 0)
						ulistDom._AKMvm_sub.style.left = (L.AKM.Util.getDomWidth(ulistDom._AKMvm_sub.offsetParent)) + 'px';
					if(that.options.position.indexOf('right') >= 0)
						ulistDom._AKMvm_sub.style.left = -(L.AKM.Util.getDomWidth(ulistDom._AKMvm_sub) + 1) + 'px';
					ulistDom._AKMvm_sub.style.top = '0';
				}
				if(span1._AKMvm_cbf != undefined) {
					span1._AKMvm_cbf(event);
				}
				L.DomEvent.stopPropagation(event);
			});
			if(typeof menuItem.callback == 'function') {
				span._AKMvm_cbf = menuItem.callback;
			}
			if(menuItem.sub != undefined) {
				var subspan = L.DomUtil.create('span', 'leaflet-akm-vm-submenu', li);
				subspan.appendChild(this._generate(menuItem.sub, span));
				span._AKMvm_sub = subspan;
			}
		}
		return ulistDom;
	},
	
	onAdd: function(map){
		this._container = L.DomUtil.create('div', 'leaflet-control leaflet-bar leaflet-akm-vm');
		var head = L.DomUtil.create('div', 'leaflet-akm-vm-head', this._container);
		head.innerHTML = this._title;
		var item = L.DomUtil.create('span', 'leaflet-akm-vm-menu', this._container);
		var ul = this._generate(this._items);
		item.appendChild(ul);
		L.DomEvent.on(head, 'click', function(event) {
			if(ul._AKMvm_sub != undefined) {
				L.DomEvent.stopPropagation(event);
				ul._AKMvm_sub.style.display = "none";
				ul._AKMvm_sub = undefined;
			}
		})
		return this._container;
	},
	
});
