var eventsTracked = {};

function track(eventId){
	if(window.s_gi){
		//if tracking is available
		if(!(eventId in eventsTracked)){
			//track card
			eventsTracked[eventId] = true;
			var track_event = 'gv-share-' + eventId.replace('_', '-');

			var standardProps = 'channel,prop1,prop2,prop3,prop4,prop8,prop9,prop10,prop13,prop25,prop31,prop37,prop38,prop47,' +
'prop51,prop61,prop64,prop65,prop74,prop40,prop63,eVar7,eVar37,eVar38,eVar39,eVar50,eVar24,eVar60,eVar51,' +
'eVar31,eVar18,eVar32,eVar40,list1,list2,list3,events';


			var s=s_gi('guardiangu-network');	
			s.linkTrackVars= standardProps;
			s.linkTrackEvents='event37';
			s.eVar37= track_event;
			s.events='event37';
			s.tl(true,'o', track_event);
			//console.log('event fired', track_event);
		}

	}



}




module.exports = {
	track: track
}