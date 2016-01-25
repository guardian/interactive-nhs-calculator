/**
 * Guardian visuals interactive project
 *
 * ./utils/analytics.js - Add Google analytics
 * ./utils/detect.js	- Device and env detection
 */

var getJSON = require('./utils/getjson');
var testdata = require('./data/data.json');
var dataset = {procedures:[]};
var base = require('./html/base-with-margins.html');
var template = require('./html/template.html');
var Ractive = require('ractive');
var app;

function initLayout(data, el) {
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
		console.log(e.keypath);
		var path = e.keypath + ".added";
		console.log(path);
		var newState = e.context.added ? false : true;

		app.set(path, newState)
		// calculateReceipt();
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
	
	var key = '1LMCyB22vqx-dF3n4zAGEra7eNZX3duWstDbZf-ST2js';
	var url = 'http://interactive.guim.co.uk/docsdata-test/' + key + '.json';
	getJSON(url, function(resp) {
		processData(resp,el);
		
	});
}

function processData(resp,el){
	console.log(resp);
	resp.sheets.questions.forEach(function(question){
		question.treatments = [];
		question.treatments = resp.sheets.treatments.filter(function(treatment){
			if(question.id === treatment.id){
				treatment.added = false
				return true
			}
		})
		dataset.procedures.push(question);
	})
	console.log(dataset);
	initLayout(dataset, el);
}

module.exports = { boot: boot };
