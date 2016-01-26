/**
 * Guardian visuals interactive project
 *
 * ./utils/analytics.js - Add Google analytics
 * ./utils/detect.js	- Device and env detection
 */

var getJSON = require('./utils/getjson');
var throttle = require('./utils/throttle');
var receiptContainer;
var sticky = false;
// var testdata = require('./data/data.json');
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
      	},
      	elOffset: 200,
      	format: function(cost){
      		var convertedCost = Number(cost);
      		if(!isNaN(convertedCost)){
      			if(convertedCost >= 1000){
      				var costString = String(convertedCost);

  				    var rgx = /(\d+)(\d{3})/;
  				    while (rgx.test(costString)) {
  				            costString = costString.replace(rgx, '$1' + '.' + '$2');
  				    }
  				    cost = costString;
      			}
      		}
      		return cost
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
		var newState = e.context.added ? false : true;

		app.set(path, newState)
		calculateReceipt();
	});

	receiptContainer = document.querySelector('#receipt-holder');
	window.onscroll = function(){ checkReceiptPos(); }
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
		total += Number(treatment.cost);
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
	resp.sheets.questions.forEach(function(question){
		question.treatments = [];
		question.total =  0;
		question.treatments = resp.sheets.treatments.filter(function(treatment){
			if(question.id === treatment.id){
				treatment.added = false
				question.total += Number(treatment.cost);
				return true
			}
		})
		question.average = Math.round(question.total / question.treatments.length);
		dataset.procedures.push(question);
	})
	initLayout(dataset, el);
}

var checkReceiptPos = throttle(function(){
	var elOffset = receiptContainer.getBoundingClientRect().top;
    if(elOffset < 10 && !sticky){
    	document.querySelector('#receipt-container').className = " sticky"
    	sticky = true;
    }else if(elOffset > 10 && sticky){
    	document.querySelector('#receipt-container').className = ""
    	sticky = false;
    }
},{delay:100})

module.exports = { boot: boot };
