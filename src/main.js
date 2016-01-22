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
var app;

function doStuff(data, el) {
	app = new Ractive({
      el: '#interactive-content',
      template: template,
      data: {
      	content: data,
      	receipt: {
      		total: 0
      	}
      }
    });

	app.on('toggleQuestion',function(e){
		var path = e.keypath + ".active";
		var newState = e.context.active === "expanded"  ? "collapsed" : "expanded";

		if(newState === "expanded"){
			var hiddenHeight = e.node.parentElement.querySelector('.hidden-container').getBoundingClientRect().height;
			var elHeight = e.node.parentElement.querySelector('.question-intro').getBoundingClientRect().height;
			e.node.parentElement.style.minHeight = elHeight + hiddenHeight + "px";
		}else{
			e.node.parentElement.style.minHeight = 0;
		}

		app.set(path, newState);
	})

	app.on('toggleTreatment',function(e){
		var path = e.keypath + ".added";
		var newState = e.context.added ? false : true;

		app.set(path, newState)
		calculateReceipt();
	});
}

function calculateReceipt(){
	var selectedTreatments = [];
	var total = 0;

	app.get('content.procedures').forEach(function(procedure){
		procedure.treatments.forEach(function(treatment){
			if(treatment.added){
				selectedTreatments.push(treatment);
			}
		})
	})

	selectedTreatments.forEach(function(treatment){
		total += treatment.price;
	})

	app.set('receipt.total', total);
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
