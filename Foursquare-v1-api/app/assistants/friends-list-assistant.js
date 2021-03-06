function FriendsListAssistant(a, ud, un, pw,i,la,lo,ps,ss,what) {
	 this.auth = _globals.auth;
	 this.userData = ud;
	 this.username=un;
	 this.password=pw;
	 this.uid=i;
	 this.lat=la;
	 this.long=lo;
	 this.prevScene=ps;
	 this.metatap=false;
	 
	 switch(what) {
	 	case "feed":
	 		this.showFeed=true;
	 		break;
	 	case "list":
	 		this.showList=true;
	 		break;
	 	case "pending":
	 		this.showPending=true;
	 		break;
	 	default:
	 		this.showFeed=true;
	 		break;
	 }
	 this.showSearch=ss;
}
FriendsListAssistant.prototype.aboutToActivate = function(callback) {
	callback.defer();     //makes the setup behave like it should.
};

FriendsListAssistant.prototype.setup = function() {
	NavMenu.setup(this, {lastCommand:'do-Friends'});

	zBar.activeScene=this;
	this.textFieldAtt = {
			hintText: 'Find some friends!',
			textFieldName:	'name', 
			multiline:		false,
			disabledProperty: 'disabled',
			focus: 			true, 
			modifierState: 	Mojo.Widget.capsLock,
			limitResize: 	false, 
			holdToEnable:  false, 
			focusMode:		Mojo.Widget.focusSelectMode,
			changeOnKeyPress: true,
			textReplacement: false,
			maxLength: 30,
			requiresEnterKey: false
	};
	this.textModel = {
		value : ''
	};
	
	this.resultsModel = {items: [], listTitle: $L('Results')};
	this.controller.setupWidget('sendField', this.textFieldAtt, this.textModel);
    
	this.controller.setupWidget('results-friends-list', 
					      {itemTemplate:'listtemplates/friendItems',dividerFunction: this.groupVenues,dividerTemplate: 'listtemplates/dividertemplate'},
					      this.resultsModel);



	    var appController = Mojo.Controller.getAppController();
  	  	var cardStageController = appController.getStageController("mainStage");
		this.doc=cardStageController.document;


	this.controller.setupWidget(Mojo.Menu.appMenu,
       _globals.amattributes,
       _globals.ammodel);
        
    
	this.stageActivateBound=this.stageActivate.bind(this);
	
	Mojo.Event.listen(this.controller.stageController.document,Mojo.Event.activate, this.stageActivateBound);


    this.controller.setupWidget("spinnerId",
         this.attributes = {
             spinnerSize: 'large'
         },
         this.model = {
             spinning: true 
         });


    this.controller.setupWidget(Mojo.Menu.commandMenu,
    	this.attributes = {
	        spacerHeight: 0,
        	menuClass: 'fsq-fade'
    	},
		{
          	visible: true,
        	items: [ 
                 { iconPath: "images/map-pin.png", command: "friend-map"},
                 {},
                 {items: [
    	             { icon: "refresh", command: "do-Refresh"}
    	         ]}
                 
                 ]
    });


	this.keyDownHandlerBound=this.keyDownHandler.bind(this);
	this.keyUpHandlerBound=this.keyUpHandler.bind(this);
	this.controller.listen(this.controller.sceneElement, Mojo.Event.keydown, this.keyDownHandlerBound);
    this.doc.addEventListener("keyup", this.keyUpHandlerBound, true);


	this.showUserInfoBound=this.showUserInfo.bind(this);
	this.showVenueInfoBound=this.showVenueInfo.bind(this);
	
    
    _globals.ammodel.items[0].disabled=false;
	this.controller.modelChanged(_globals.ammodel);

    this.controller.get("message").hide();
    this.getFeed();

}

var auth;

function make_base_auth(user, pass) {
  var tok = user + ':' + pass;
  var hash = Base64.encode(tok);
  return "Basic " + hash;
}
FriendsListAssistant.prototype.keyDownHandler = function(event) {
		var key=event.originalEvent.keyCode;
		logthis("key="+key);
		if (key == 57575) {
			this.metatap = true;
		}
}

FriendsListAssistant.prototype.keyUpHandler = function(event) {
		var key=event.keyCode;
		logthis("key="+key);
		if (key == 57575) {
			this.metatap = false;
		}
}

FriendsListAssistant.prototype.stageActivate = function(event) {
			NavMenu.setup(this,{buttons: 'navOnly'});
			this.metatap=false;
	if(_globals.showShout){
    	var thisauth="";
		this.controller.stageController.pushScene({name: "shout", transition: Mojo.Transition.zoomFade},thisauth,"",this,_globals.jtShout);
	}


};


FriendsListAssistant.prototype.groupVenues = function(data){
	return data.grouping;
}


FriendsListAssistant.prototype.relativeTime = function(offset){
	// got this from: http://github.com/trek/thoughtbox/blob/master/js_relative_dates/src/relative_date.js
    var distanceInMinutes = (offset.abs() / 60000).round();
    if (distanceInMinutes == 0) { return 'less than a minute'; }
    else if ($R(0,1).include(distanceInMinutes)) { return 'about a minute'; }
    else if ($R(2,44).include(distanceInMinutes)) { return distanceInMinutes + ' minutes';}
    else if ($R(45,89).include(distanceInMinutes)) { return 'about 1 hour';}
    else if ($R(90,1439).include(distanceInMinutes)) { return 'about ' + (distanceInMinutes / 60).round() + ' hours'; }
    else if ($R(1440,2879).include(distanceInMinutes)) {return '1 day'; }
    else if ($R(2880,43199).include(distanceInMinutes)) {return 'about ' + (distanceInMinutes / 1440).round() + ' days'; }
    else if ($R( 43200,86399).include(distanceInMinutes)) {return 'about a month' }
    else if ($R(86400,525599).include(distanceInMinutes)) {return 'about ' + (distanceInMinutes / 43200).round() + ' months'; }
    else if ($R(525600,1051199).include(distanceInMinutes)) {return 'about a year';}
    else return 'over ' + (distanceInMinutes / 525600).round() + ' years';
  }


FriendsListAssistant.prototype.getFriendsFailed = function(event) {
		this.controller.get("spinnerId").mojo.stop();
		this.controller.get("spinnerId").hide();
		this.controller.get('resultListBox').style.display = 'block';
		this.controller.get("spinnerId").mojo.stop();
		this.controller.get("spinnerId").hide();
		this.controller.get('resultListBox').style.display = 'block';

}



FriendsListAssistant.prototype.showMap = function(event) {
		this.controller.stageController.pushScene({name: "friends-map", transition: Mojo.Transition.crossFade,disableSceneScroller:true},this.lat,this.long,this.resultsModel.items,this.username,this.password,this.uid,this);

}
FriendsListAssistant.prototype.hardRefresh = function(event) {
	_globals.friendList=undefined;
	this.controller.stageController.swapScene({name: "friends-list", transition: Mojo.Transition.crossFade},this.auth,_globals.userData,this.username,this.password,this.uid,this.lat,this.long,this);
}

FriendsListAssistant.prototype.listWasTapped = function(event) {
	
	//see if there's a link in the shout
	var shout=event.item.shout || "";
	var urlmatch=/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
	
	

	if(shout.match(urlmatch)) {
		var url=RegExp['$&'];
					this.controller.popupSubmenu({
			             onChoose:function(choice){
			             	switch(choice){
			             		case "url":
			             			this.controller.serviceRequest('palm://com.palm.applicationManager', {
										 method: 'open',
										 parameters: {
											 target: url
										 }
									 });
			             			break;
			             		case "profile":
			             			this.controller.stageController.pushScene({name: "user-info", transition: Mojo.Transition.crossFade, disableSceneScroller: false},this.auth,event.item.id,null,true);
			             			break;
			             	}
			             }.bind(this),
            			 placeNear:this.controller.get(event.target),
			             items: [{label: event.item.firstname+"'s Profile", command: 'profile'},
				           {label: url.substr(0,20)+"...", command: 'url'}]
		             });
			
	}else{
		this.controller.stageController.pushScene({name: "user-info", transition: Mojo.Transition.crossFade, disableSceneScroller: false},this.auth,event.item.id,null,true);
	}
}


FriendsListAssistant.prototype.setBools = function(what) {
	this.showFeed=(what=="feed")? true: false;
	this.showList=(what=="list")? true: false;
	this.showPending=(what=="pending")? true: false;
	this.showSearch=(what=="search")? true: false;
}

FriendsListAssistant.prototype.getFeed = function(event) {
	if(this.feedList==undefined) {
		_globals.reloadFriends=false;
		_globals.friendList=undefined;
	 	foursquareGet(this, {
	 		endpoint: 'checkins.json',
	 		requiresAuth: true,
		   parameters: {geolat:_globals.lat, geolong:_globals.long, geohacc:_globals.hacc,geovacc:_globals.vacc, geoalt:_globals.altitude},
		   onSuccess: this.feedSuccess.bind(this),
		   onFailure: this.getFriendsFailed.bind(this)	 		
	 	});
	}else{
		if(this.showList){
			var l=_globals.friendList;
			this.controller.get("fmenu-caption").update("List");
			if(l==undefined){this.getFriends();}
		}
		if(this.showPending){
			var l=_globals.requestList;
			this.controller.get("fmenu-caption").update("Pending");
			if(l==undefined){this.onPendingFriends();}
		}
		if(this.showFeed){
			var l=_globals.feedList;
			this.controller.get("fmenu-caption").update("Feed");
		}
		this.resultsModel.items=l;
		this.controller.modelChanged(this.resultsModel);
		this.lat=_globals.lat;
		this.long=_globals.long;

		this.controller.get("spinnerId").mojo.stop();
		this.controller.get("spinnerId").hide();
		this.controller.get('resultListBox').style.display = 'block';
	}
	
}

FriendsListAssistant.prototype.feedSuccess = function(response) {


	if (response.responseJSON == undefined) {
		this.controller.get('message').innerHTML = 'No Results Found';
		logthis("undefined feed stuffs");
	}
	else {
		//Got Results... JSON responses vary based on result set, so I'm doing my best to catch all circumstances
		this.feedList = [];
		this.looping=false;
		if(response.responseJSON.checkins != undefined && response.responseJSON.checkins != null && response.responseJSON.checkins.length>0) {
			for(var f=0;f<response.responseJSON.checkins.length;f++) {
				this.feedList.push(response.responseJSON.checkins[f]);
				this.feedList[f].id=response.responseJSON.checkins[f].user.id;
				this.feedList[f].idx=f;
				this.feedList[f].firstname=response.responseJSON.checkins[f].user.firstname;
				this.feedList[f].lastname=response.responseJSON.checkins[f].user.lastname;
				this.feedList[f].photo=response.responseJSON.checkins[f].user.photo;
				this.feedList[f].checkin=(response.responseJSON.checkins[f].venue != undefined)? response.responseJSON.checkins[f].venue.name: "";
				this.feedList[f].at=(response.responseJSON.checkins[f].venue != undefined)? "@ ": "";
				this.feedList[f].geolat=(response.responseJSON.checkins[f].venue != undefined)? response.responseJSON.checkins[f].venue.geolat: "";
				this.feedList[f].geolong=(response.responseJSON.checkins[f].venue != undefined)? response.responseJSON.checkins[f].venue.geolong: "";
				
				this.feedList[f].shout=(response.responseJSON.checkins[f].shout != undefined)? "\n"+response.responseJSON.checkins[f].shout: "";
				var urlmatch=/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
				this.feedList[f].shout=this.feedList[f].shout.replace(urlmatch,'<a href="$1" class="listlink">$1</a>');
				
				this.feedList[f].mayorcrown=(response.responseJSON.checkins[f].ismayor=="true")? '<img src="images/crown_smallgrey.png"/> ': "";
				
				//handle time
				if(response.responseJSON.checkins[f].created != undefined) {
					var now = new Date;
					var later = new Date(response.responseJSON.checkins[f].created);
					var offset = later.getTime() - now.getTime();
					this.feedList[f].when=this.relativeTime(offset) + " ago";
					
					//group this based on time
					var minsago=(Math.abs(offset)/1000)/60;
					logthis("minsago="+minsago);
					if(minsago<=180){
						this.feedList[f].grouping="Recently";
					}else if(minsago>180 && later.getMonth()==now.getMonth() && later.getDate()==now.getDate()){
						this.feedList[f].grouping="Earlier Today";
					}else if((Math.abs(offset)/1000)/86400>30){ //more than 30 days ago
						this.feedList[f].grouping="A Long, Long Time Ago...";
					}else{
						this.feedList[f].grouping="Older";
					}
				}else{
					this.feedList[f].when="";
				}
				
				
			}
			_globals.feedList=this.feedList;
			this.resultsModel.items =this.feedList; //update list with basic user info
			this.controller.modelChanged(this.resultsModel);
			this.controller.get('resultListBox').style.display = 'block';
			
			
			this.userlinks=this.controller.document.querySelectorAll(".userLink");
			for(var e=0;e<this.userlinks.length;e++) {
				var eid=this.userlinks[e].id;
				Mojo.Event.listen(this.controller.get(eid),Mojo.Event.tap,this.showUserInfoBound);
			}
			
			this.venuelinks=this.controller.document.querySelectorAll(".venueLink");
			for(var e=0;e<this.venuelinks.length;e++) {
				var eid=this.venuelinks[e].id;
				Mojo.Event.listen(this.controller.get(eid),Mojo.Event.tap,this.showVenueInfoBound);
				logthis("#########added event to "+eid)
			}

		}else{
			this.controller.get("search-msg").innerHTML="No recent check-ins";
			this.controller.get('resultListBox').style.display = 'none';
		}
		
		
		this.controller.get("spinnerId").mojo.stop();
		this.controller.get("spinnerId").hide();
		this.controller.get('resultListBox').style.display = 'block';

	}
		

}

FriendsListAssistant.prototype.showUserInfo = function(event) {
	var uid=event.target.readAttribute("data");
	if(!this.metatap){
		this.controller.stageController.pushScene({name: "user-info", transition: Mojo.Transition.zoomFade, disableSceneScroller: false},this.auth,uid,this,true);
	}else{
         var stageArguments = {name: "mainStage"+uid, lightweight: true};
         var pushMainScene=function(stage){
         	this.metatap=false;
			stage.pushScene({name: "user-info", transition: Mojo.Transition.zoomFade, disableSceneScroller: false},this.auth,uid,null,false);      
         };
        var appController = Mojo.Controller.getAppController();
		appController.createStageWithCallback(stageArguments, pushMainScene.bind(this), "card");	
	}
}

FriendsListAssistant.prototype.showVenueInfo = function(event){
	var vid=event.target.readAttribute("data");
	logthis("venue clicked: "+vid);
	if(!this.metatap){
		this.controller.stageController.pushScene({name: "venuedetail", transition: Mojo.Transition.crossFade, disableSceneScroller: false},this.feedList[vid].venue,_globals.username,_globals.password,_globals.uid,true);
	}else{
         var stageArguments = {name: "mainStage"+vid, lightweight: true};
         var pushMainScene=function(stage){
         	this.metatap=false;
			stage.pushScene({name: "venuedetail", transition: Mojo.Transition.crossFade, disableSceneScroller: false},this.feedList[vid].venue,_globals.username,_globals.password,_globals.uid,true);    
         };
        var appController = Mojo.Controller.getAppController();
		appController.createStageWithCallback(stageArguments, pushMainScene.bind(this), "card");		
	}

}

FriendsListAssistant.prototype.showMenu = function(event){
					this.controller.popupSubmenu({
			             onChoose:this.popupChoose,
            			 placeNear:this.controller.get('menuhere'),
			             items: [{secondaryIconPath: 'images/feed.png',label: 'Feed', command: 'friends-feed'},
				           {secondaryIconPath: 'images/marker-icon.png',label: 'Map', command: 'friend-map'},
            	           {secondaryIconPath: 'images/search-black.png',label: 'Search', command: 'friend-search'},
                	       {secondaryIconPath: 'images/friends-black.png',label: 'Friends List', command: 'friends-list'},
                    	   {secondaryIconPath: 'images/clock.png',label: 'Pending Requests', command: 'friends-pending'}]
		             });
}


FriendsListAssistant.prototype.handleCommand = function(event) {
        if (event.type === Mojo.Event.command) {
            switch (event.command) {
                case "friend-search":
					//get the scroller for your scene
					var scroller = this.controller.getSceneScroller();
					//call the widget method for scrolling to the top
					scroller.mojo.revealTop(0);
					this.controller.get("drawerId").mojo.toggleState();
					this.controller.modelChanged(this.drawerModel);
                	break;
				case "friend-map":
					this.controller.stageController.pushScene({name: "friends-map", transition: Mojo.Transition.crossFade,disableSceneScroller:true},this.lat,this.long,this.resultsModel.items,this.username,this.password,this.uid,this);
					break;
				case "friends-list":
					this.controller.get("drawerId").mojo.setOpenState(false);
					this.resultsModel.items =this.friendList;
					this.controller.modelChanged(this.resultsModel);
					break;
				case "do-Venues":
                	var thisauth=auth;
					this.controller.stageController.swapScene({name: "nearby-venues", transition: Mojo.Transition.crossFade},thisauth,_globals.userData,this.username,this.password,this.uid);
					break;
				case "do-Friends":
					break;
				case "do-Profile":
                case "do-Badges":
                	var thisauth=auth;
					this.controller.stageController.swapScene({name: "user-info", transition: Mojo.Transition.crossFade},thisauth,"");
                	break;
                case "do-Shout":
                	var thisauth=auth;
					this.controller.stageController.swapScene({name: "shout", transition: Mojo.Transition.crossFade},thisauth,"",this);
                	break;
                case "do-Tips":
                	var thisauth=auth;
					this.controller.stageController.swapScene({name: "nearby-tips", transition: Mojo.Transition.crossFade},thisauth,"",this);
                	break;
                case "do-Todos":
                	var thisauth=auth;
					this.controller.stageController.swapScene({name: "todos", transition: Mojo.Transition.crossFade},thisauth,"",this);
                	break;
                case "do-Leaderboard":
                	var thisauth=auth;
					this.controller.stageController.swapScene({name: "leaderboard", transition: Mojo.Transition.crossFade},thisauth,"",this);
                	break;
                case "do-About":
					this.controller.stageController.pushScene({name: "about", transition: Mojo.Transition.crossFade});
                	break;
                case "do-Donate":
                	_globals.doDonate();
                	break;
                case "do-Prefs":
					this.controller.stageController.pushScene({name: "preferences", transition: Mojo.Transition.zoomFade},this);
                	break;
                case "do-Refresh":
                	_globals.friendList=undefined;
					this.controller.stageController.swapScene({name: "friends-list", transition: Mojo.Transition.crossFade},thisauth,_globals.userData,this.username,this.password,this.uid,this.lat,this.long,this);
                	break;
                case "do-Update":
                	_globals.checkUpdate(this);
                	break;
      			case "do-Nothing":
      				break;
                case "toggleMenu":
                	NavMenu.toggleMenu();
                	break;
                case "gototop":
					var scroller=this.controller.getSceneScroller();
					scroller.mojo.scrollTo(0,0,true);
					break;
            }
        }else if(event.type===Mojo.Event.forward){
           	var thisauth=auth;
			this.controller.stageController.swapScene({name: "friends-list", transition: Mojo.Transition.crossFade},thisauth,_globals.userData,_globals.username,_globals.password,_globals.uid,_globals.lat,_globals.long,this);

        }else if(event.type===Mojo.Event.back){
			if(NavMenu.showing==true){
				event.preventDefault();
				NavMenu.hideMenu();
			}        
        }
    }


FriendsListAssistant.prototype.activate = function(event) {
	NavMenu.setThat(this);
    this.controller.get("sendField").mojo.blur();
	this.controller.window.setTimeout(function(){_globals.GPS.stop();}.bind(this),5000);

	if(_globals.friendList!=undefined) {
		this.controller.get("spinnerId").mojo.stop();
		this.controller.get("spinnerId").hide();
		this.controller.get('resultListBox').style.display = 'block';
	}
	if(this.showSearch) {
		var scroller = this.controller.getSceneScroller();
		scroller.mojo.revealTop(0);
		this.controller.get("drawerId").mojo.setOpenState(true);
		this.controller.modelChanged(this.drawerModel);
	}
	
	if(_globals.reloadFriends) {
                	this.controller.get("spinnerId").mojo.start();
					this.controller.get("spinnerId").show();
					this.controller.get("resultListBox").style.display = 'none';
                	_globals.friendList=undefined;
					this.getFriends();
	
	}
}


FriendsListAssistant.prototype.deactivate = function(event) {
}

FriendsListAssistant.prototype.cleanup = function(event) {
			for(var e=0;e<this.userlinks.length;e++) {
				var eid=this.userlinks[e].id;
				Mojo.Event.stopListening(this.controller.get(eid),Mojo.Event.tap,this.showUserInfoBound);
			}
			
			for(var e=0;e<this.venuelinks.length;e++) {
				var eid=this.venuelinks[e].id;
				Mojo.Event.stopListening(this.controller.get(eid),Mojo.Event.tap,this.showVenueInfoBound);
			}
}
