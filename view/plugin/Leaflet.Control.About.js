/// #require L from leaflet.js

(function() {

	if(L.AKM === undefined)
		L.AKM = {};
		
	L.AKM.PointerControl = L.Control.extend({
	
		options: {
			
			position: "topleft",
			
			size: [300, 300],	//target size
			
			limit: [0.75, 0.75],	//ratio of max size to innerSize 

			
		},
		
		initialize: function(options) {
			L.setOptions(this, options);
			this.content = null;
		},
	
	});

})();