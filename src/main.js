/**
 * Guardian visuals interactive project
 *
 * ./utils/analytics.js - Add Google analytics
 * ./utils/detect.js	- Device and env detection
 */

// var getJSON = require('./utils/getjson');
var data = require('./data/data.json');
var base = require('./html/base-with-margins.html');
var template = require('./html/template.html');
var Ractive = require('ractive');

function doStuff(data, el) {
	var app = new Ractive({
      el: '#interactive-content',
      template: template,
      data: {
      	content: data,
      	selectedTreatments: []
      }
    });

	app.on('toggleQuestion',function(e){
		var path = e.keypath + ".active";
		var newState = e.context.active === "expanded"  ? "collapsed" : "expanded";

		app.set(path, newState);

		if(e.context.active === "expanded"){
			var hiddenHeight = e.node.parentElement.querySelector('.hidden-container').getBoundingClientRect().height;
			var elHeight = e.node.parentElement.getBoundingClientRect().height;
			e.node.parentElement.style.minHeight = elHeight + hiddenHeight + "px";
		}else{
			e.node.parentElement.style.minHeight = 0;
		}
	})

	app.on('toggleTreatment',function(e){
		var path = e.keypath + ".added";
		var newState = e.context.added ? false : true;

		app.set(path, newState)
		
		// if(e.context.added){
		// 	app.push('selectedTreatments', e.context);
		// }else{
		// 	var currentIndex = app.get('selectedTreatments').indexOf(e.context);
		// 	app.splice('selectedTreatments', currentIndex, 1);
		// }
	});

	// app.observe('selectedTreatments',function(e){
	// 	console.log(app.get('selectedTreatments'))
	// })
}

function boot(el) {
	el.innerHTML = base;
	doStuff(data, el);

	// var key = '1hy65wVx-pjwjSt2ZK7y4pRDlX9wMXFQbwKN0v3XgtXM';
	// var url = 'https://interactive.guim.co.uk/spreadsheetdata/' + key + '.json';
	// getJSON(url, function(data) {
	// 	
	// });
}

module.exports = { boot: boot };
