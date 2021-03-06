/**
 * Guardian visuals interactive project
 *
 * ./utils/analytics.js - Add Google analytics
 * ./utils/detect.js	- Device and env detection
 */

var guAnalytics =  require('./utils/guAnalytics');
// example share call: guAnalytics.track('facebook')
var getJSON = require('./utils/getjson');
var throttle = require('./utils/throttle');
var base = require('./html/base-with-margins.html');
var template = require('./html/template.html');
var Ractive = require('ractive');
var app;
var receiptContainer;
var sticky = false;
var bottomHidden = false;
var dataset = {procedures:[]};
var rawData;

function initLayout(data, el) {
	Ractive.DEBUG = false;
	app = new Ractive({
      el: '#interactive-content',
      template: template,
      data: {
      	content: data,
      	receipt: {
      		total: 0,
      		amount:0
      	},
      	elOffset: 200,
      	format: function(cost){
      		var convertedCost = Number(cost);
      		if(!isNaN(convertedCost)){
      			if(convertedCost >= 1000){
      				var costString = String(convertedCost);

  				    var rgx = /(\d+)(\d{3})/;
  				    while (rgx.test(costString)) {
  				            costString = costString.replace(rgx, '$1' + ',' + '$2');
  				    }
  				    cost = costString;
      			}
      		}
      		return cost
      	},
      	shareQuestionHidden: function(){
      		if(Math.random() < 0.5){
      			guAnalytics.track('didn\'t show question before sharing')
      			return true
      		}else{
      			guAnalytics.track('showed question before sharing')
      			return false
      		}
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
		if(e.original.target.nodeName !== "INPUT"){
			var path = e.keypath + ".added";
			var newState = e.context.added ? false : true;

			app.set(path, newState)
			calculateReceipt();
		}
	});

	app.on('changeTreatmentAmount',function(e){
		var path = e.keypath + ".amount";
		app.set(path, e.node.value);
		calculateReceipt();
	});

	app.on('answerQuestion',function(e,answer){
		guAnalytics.track('answered question with ' + answer);
		app.set('shareAnswer',answer)
	})

	receiptContainer = document.querySelector('#receipt-holder');
	window.onscroll = function(){ checkReceiptPos(); }
}

function boot(el) {
	el.innerHTML = base;
	
	var key = '1LMCyB22vqx-dF3n4zAGEra7eNZX3duWstDbZf-ST2js';
	var url = 'https://interactive.guim.co.uk/docsdata-test/' + key + '.json';

	getJSON(url, function(resp) {
		initHeader(resp);
		processData(resp,el);
		initShare();
	});
}

function initHeader(resp){
	var selectEls = document.querySelectorAll('.action-sentence select');
	var genderButtons = document.querySelectorAll('.action-sentence #gender-select button');
	var selection = {
		"gender": undefined,
		"age": "25 to 29",
		"visits": "6"
	}

	for(i=0; i<genderButtons.length; i++){
		genderButtons[i].addEventListener('click',function(e){
			selection["gender"] = e.target.getAttribute('data-value');
			genderButtons[0].id = ""; genderButtons[1].id = "";
			e.target.id = "selected";
			calculateAverage();
		})
	}

	for(i=0; i<selectEls.length; i++){
		selectEls[i].addEventListener('change',function(e){
			selection[e.target.className] = e.target.value;
			calculateAverage();
		})
	}

	calculateAverage();

	function calculateAverage(){
		if(selection.gender && selection.age && selection.visits){
			var gpCost = 59.9;
			var costBand = resp.sheets.conversiontable.filter(function(cost){
				return selection.age === cost.age
			})[0]
			var ageCost = selection.gender === "woman" ? costBand["female"] : costBand["male"];

			var totalNumber = Number(ageCost) + (gpCost * Number(selection.visits))

			var totalString = String(Math.round(totalNumber));

		    var rgx = /(\d+)(\d{3})/;
		    while (rgx.test(totalString)) {
	            totalString = totalString.replace(rgx, '$1' + ',' + '$2');
		    }

			document.querySelector('#total-number').innerHTML = "£" + totalString + "<span id='price-disclaimer'> (This is an expected yearly average)</span>" ;
		}else{
			document.querySelector('#total-number').innerHTML = "£";
		}
	}
}

function initShare(){
	var shareButtons = document.querySelectorAll('.shareButtons button');
	for(i=0; i<shareButtons.length; i++){
		shareButtons[i].addEventListener('click',function(e){
			var sharePosition = e.target.parentElement.parentElement.className === "header-wrapper" ? "header" : "footer";
			share(e.target.className,sharePosition);
		})
	}
}

function processData(resp,el){
	resp.sheets.questions.forEach(function(question){
		question.treatments = [];
		question.total =  0;
		question.treatments = resp.sheets.treatments.filter(function(treatment){
			if(isNaN(treatment.cost)){
				treatment.minCost = treatment.cost.split('-')[0];
			}else{
				treatment.minCost = treatment.cost;
			}

			if(question.id === treatment.id){
				treatment.added = false
				if(treatment.repeat === "many"){
					treatment.amount = 1;
				}else{
					treatment.amount = 1;
				}
				question.total += Number(treatment.minCost);
				return true
			}
		})
		question.average = Math.round(question.total / question.treatments.length);
		dataset.procedures.push(question);
	})
	initLayout(dataset, el);
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
		total += Number(treatment.minCost) * treatment.amount;
	})

	var orderedTreatments = selectedTreatments.sort(function(a, b) {
	    return (a.minCost * a.amount) - (b.minCost * b.amount);
	});

	app.set('receipt',{
		total: total,
		min: orderedTreatments[0],
		max: orderedTreatments[orderedTreatments.length-1],
		amount: orderedTreatments.length
	})

	app.set('receipt.total', total);
}

var checkReceiptPos = throttle(function(){
	var elOffset = receiptContainer.getBoundingClientRect().top;
	var footerOffset = document.querySelector('#summary-container').getBoundingClientRect().top;
    if(elOffset < 10 && !sticky){
    	document.querySelector('#receipt-container').className = " sticky"
    	sticky = true;
    }else if(elOffset > 10 && sticky){
    	document.querySelector('#receipt-container').className = ""
    	sticky = false;
    }

    if(footerOffset < (window.innerHeight/1.5) && !bottomHidden){
    	document.querySelector('#receipt-container').className = "";
    	bottomHidden = true;
    }else if(footerOffset > (window.innerHeight/1.5) && bottomHidden){
    	document.querySelector('#receipt-container').className = " sticky";
    	bottomHidden = false;
    }

},{delay:100})


function share(platform, sharePosition){
	var shareWindow;
    var twitterBaseUrl = "http://twitter.com/share?text=";
    var facebookBaseUrl = "https://www.facebook.com/dialog/feed?display=popup&app_id=741666719251986&link=";
    var articleUrl = "http://gu.com/p/4g8zz";
    var shareUrl = articleUrl;

    var message = "How much have I cost the NHS?"
    
    var facebookImage = "";
    var twitterImage = "";
     
    if(platform === "twitter"){
        shareWindow = 
            twitterBaseUrl + 
            encodeURIComponent(message + twitterImage) + 
            "&url=" + 
            encodeURIComponent(shareUrl + '/stw')   
    }else if(platform === "facebook"){
        shareWindow = 
            facebookBaseUrl + 
            encodeURIComponent(shareUrl) + 
            "&picture=" + 
            encodeURIComponent(facebookImage) + 
            "&redirect_uri=http://www.theguardian.com";
    }else if(platform === "mail"){
        shareWindow =
            "mailto:" +
            "?subject=" + message +
            "&body=" + shareUrl 
    }
    window.open(shareWindow, platform + "share", "width=640,height=320");
    guAnalytics.track('shared on ' + platform + ' via ' + sharePosition + ' buttons');
}

module.exports = { boot: boot };
