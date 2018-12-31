/// #require L from leaflet.js
/// #require Vue from Vue.js

(function(){
	
	L.Control.VueContainer = L.Control.extend({
		
		options: {
			
		},
		
		initialize: function(vue, options) {
			L.Util.setOptions(this, options);
			var template = (vue.el instanceof HTMLElement) ? vue.el : document.querySelector(vue.el);
			delete vue.el;
			this.el = document.createElement("div");
			this.el.innerHTML = template.innerHTML;
			this.vm = new Vue(vue);
		},
		
		onAdd: function(map) {
			var vm = this.vm;
			var el = this.el;
			if(!vm.$el)
				setTimeout(function(){vm.$mount(el);}, 1);
			var container = document.createElement("div");
			container.appendChild(el);
			return container;
		},
		
		onRemove: function(map) {
			
		},
	});
	
})();
