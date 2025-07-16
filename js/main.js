// data preload from JSON files
    var cases = {};
    var casesKey = [];
    // parse and get all the cases, populate dropdown at the same time
    console.log('Loading cases.json...');
    $.getJSON( "/json/cases.json", function( data ) {
      console.log('Cases data loaded:', Object.keys(data).length, 'scenarios');
      $.each( data, function( key, obj ) {
        cases[key] = obj;
        casesKey.push(""+key);
				$('#case-dropdown .menu').append('<div class="item" data-value="'+key+'">'+obj.title+'</div>');
      });
      console.log('Case dropdown menu populated with', $('#case-dropdown .menu .item').length, 'items');
      
      dataLoaded.cases = true;
      checkAllDataLoaded();
    }).fail(function(jqxhr, textStatus, error) {
      console.error('Failed to load cases.json:', textStatus, error);
    });


    var actions = {};
    var actionsKey = [];
    // parse and get all the actions
    console.log('Loading actions.json...');
    $.getJSON( "/json/actions.json", function( data ) {
      console.log('Actions data loaded:', Object.keys(data).length, 'actions');
      $.each( data, function( key, obj ) {
        actions[key] = obj;
        actionsKey.push(""+key);
         $('#action-dropdown .menu').append('<div class="item" data-value="'+key+'">'+obj.description+'</div>');
      });
      console.log('Action dropdown menu populated with', $('#action-dropdown .menu .item').length, 'items');

      dataLoaded.actions = true;
      checkAllDataLoaded();
    }).fail(function(jqxhr, textStatus, error) {
      console.error('Failed to load actions.json:', textStatus, error);
    });


    var drugs = {};
    var drugsKey = [];
    // parse and get all the drugs
    console.log('Loading drugs.json...');
    $.getJSON( "/json/drugs.json", function( data ) {
      console.log('Drugs data loaded:', Object.keys(data).length, 'drugs');
      $.each( data, function( key, value ) {
        drugs[key] = value;
        drugsKey.push(""+key);
				$('#drug-dropdown .menu').append('<div class="item" data-value="'+key+'">'+value+'</div>');
      });
      console.log('Drug dropdown menu populated with', $('#drug-dropdown .menu .item').length, 'items');

      dataLoaded.drugs = true;
      checkAllDataLoaded();
    }).fail(function(jqxhr, textStatus, error) {
      console.error('Failed to load drugs.json:', textStatus, error);
    });


    // Timer utility function
    function pad ( val ) { return val > 9 ? val : "0" + val; }

    // Functions callable from steps (most of them to control the UI behaviour)
    var cprTimer = null;
    var cprSec = 0;
    function startCPR(type) {
        var cprNummerValue = parseInt($("#cprNummerValue").html())+1; //cpr cycles+1
        $("#cprNummerValue").html(""+cprNummerValue);
        $("#cprImg").show();
        $("#cprNummer").show();
        $("#cprImg").effect( "pulsate", {
          times: 700
        }, 500000);
        $("#cprNummer").effect( "pulsate", {
          times: 700
        }, 500000);
        var bls=false;
        if(type && type=='bls'){
            bls = true;
        }
        setECG('CPR.gif', 100, bls); // standard ecg under CPR
        // set cprTimer
        cprSec = 0;
        cprTimer = setInterval( function(){
            $("#cprSeconds").html(pad(++cprSec%60));
            $("#cprMinutes").html(pad(parseInt(cprSec/60,10)));
        }, 1000);
        if($("#realtime").is(':checked'))
            $("#cprTimer").show();
    }
    function stopCPR() {
        $('#cprImg').stop(true, true).effect("pulsate", { times: 1 }, 1);
        $('#cprNummer').stop(true, true).effect("pulsate", { times: 1 }, 1);
        // set cprTimer to null
        clearInterval(cprTimer);
        $("#cprSeconds").html("00");
        $("#cprMinutes").html("00");
    }
    function completeCPR(setSec){
        var _setSec = 120; // standard CPR completion
        if (setSec!=null){
            _setSec = parseInt(setSec);
        }
        if($("#realtime").is(':checked')){
            $("#cprTimer").show();
            $("#caseTimer").show();
        }
        clearInterval(cprTimer); // stop original cprTimer
        cprTimer = setInterval( function(){ // init new setTimer (faaaaster!) up to 2 minutes
            $("#cprSeconds").html(pad(++cprSec%60));
            $("#cprMinutes").html(pad(parseInt(cprSec/60,10)));
            if(cprSec >= _setSec){
                clearInterval(cprTimer); // stop the faster cprTimer
                cprTimer = setInterval( function(){ // start the original cprTimer
                    $("#cprSeconds").html(pad(++cprSec%60));
                    $("#cprMinutes").html(pad(parseInt(cprSec/60,10)));
                }, 1000); 
            }
        }, 10);
        // update whole scenarioTimer
        var _setCaseSec = caseSec + _setSec;
        clearInterval(caseTimer); // stop original caseTimer
        caseTimer = setInterval( function(){ // init new caseTimer
            $("#caseSeconds").html(pad(++caseSec%60));
            $("#caseMinutes").html(pad(parseInt(caseSec/60,10)));
            if(caseSec >= _setCaseSec){
                clearInterval(caseTimer); // stop the faster caseTimer
                caseTimer = setInterval( function(){ // start the original caseTimer
                    $("#caseSeconds").html(pad(++caseSec%60));
                    $("#caseMinutes").html(pad(parseInt(caseSec/60,10)));
                }, 1000); 
            }
        }, 10);
    }

    var myIntervalECG;
    var bls = true;
    function setECG(rythm, frequenz, bls) {
        $("#hfvalue").html(frequenz);
        // dynamically changing herz frequenz in the given interval to simulate a live situation
        if(frequenz!=0){
            clearInterval(myIntervalECG);
            var minimum = frequenz-7;
            var maximum = frequenz+9;
            myIntervalECG = setInterval(function(){
                var randomValue = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
                $("#hfvalue").html(randomValue);
            }, 1500);
        }else{
            clearInterval(myIntervalECG);
        }
        // UI
        $("#hf").css('color', '#00ff00');
        // blinking effect by hf > 100
        if(frequenz>150 || frequenz<35){
            var properties = {
               color: "#252525"
            };
            $("#hf").pulse(properties, {pulses:-1, duration:750});
            //alarmSound.play();
        }else{
            $("#hf").pulse('destroy');
            $("#hf").css('color', '#00ff00');
        }
        $("#ecgImg").attr("src", "img/"+rythm);
        if(bls && bls==true){
        }else{
            $('#ecgImg').show();
            $("#vitalParam").fadeIn();
        }
    }
    // handle destroy pulse effect on click
    $( "#hf" ).hover(function() {
      $("#hf").pulse('destroy');
      $("#hf").css('color', '#00ff00');
    });

    function setBP(max, min) {
        if (max==0 || min==0){
            $("#bpvalue").html("-/-");
        }else{
            $("#bpvalue").html(max+"/"+min);
        }
        $("#bp").css('color', 'red');
        if(max>200 || max <=80){
            var properties = {
               color: "#252525"
            };
            $("#bp").pulse(properties, {pulses:-1, duration:750});
            //alarmSound.play();
        }else{
            $("#bp").pulse('destroy');
            $("#bp").css('color', 'red');
        }
    }
    // handle destroy pulse effect on click
    $( "#bp" ).hover(function() {
      $("#bp").pulse('destroy');
      $("#bp").css('color', 'red');
        //alarmSound.pause();
    });

    var myIntervalO2;
    function setO2(sat) {
        $("#satvalue").html(sat);
        if(sat!=0){
            clearInterval(myIntervalO2);
            var minimum = sat-9;
            var maximum = sat+3;
            if(maximum>100){
                maximum=100;
            }
            myIntervalO2 = setInterval(function(){
                var randomValue = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
                $("#satvalue").html(randomValue);
            }, 2400);
        }else{
            clearInterval(myIntervalO2);
        }
        // UI
        $("#sat").css('color', '#00ffff');
        if(sat<=85){
            var properties = {
               color: "#252525"
            };
            $("#sat").pulse(properties, {pulses:-1, duration:750});
            //alarmSound.play();
        }else{
            $("#sat").pulse('destroy'); 
            $("#sat").css('color', '#00ffff');
        }
    }
    // handle destroy pulse effect on click
    $( "#sat" ).hover(function() {
      $("#sat").pulse('destroy');
        $("#sat").css('color', '#00ffff');
    });

    var myIntervalCO2;
    function setCO2(co2) {
        $("#co2value").html(co2);
        $("#co2").fadeIn();
        if(co2!=0){
            clearInterval(myIntervalCO2);
            var minimum = co2-0.25;
            var maximum = co2+0.45;
            myIntervalCO2 = setInterval(function(){
                var randomValue = (Math.round((Math.random() * (maximum - minimum + 0.2) + minimum)*10)/10).toFixed(1);
                $("#co2value").html(randomValue);
            }, 2400);
        }else{
            clearInterval(myIntervalCO2);
        }
    }

    function setTemp(temp) {
        $("#tempvalue").html(temp);
        $("#temp").fadeIn();
    }

    function defibrillation() {
        stopCPR();
        var defiNummerValue = parseInt($("#defiNummerValue").html())+1;
        $("#defiNummerValue").html(""+defiNummerValue);
        $("#defiLogo").fadeIn();
        $("#defiNummer").fadeIn();
    }


    function setLabor(param, value, unit){
        paramId = param.replace(/ /g,'');
        $("#"+paramId+"").remove(); // remove it if already exists
        $('#laborTable tbody').append("<tr id='"+paramId+"'><td>"+param+"</td><td>"+value+" "+unit+"</td></tr>");
        $("#labor").fadeIn();
    }

    function setLabors(params){
				params.forEach(param => {
					let [name, value, unit] = param;
					paramId = name.replace(/ /g,'');
					$("#"+paramId+"").remove(); // remove it if already exists
					$("#labor").show();
					$('#laborTable tbody').append("<tr id='"+paramId+"'><td>"+name+"</td><td>"+value+" "+unit+"</td></tr>");
					$("tr#"+paramId).hide().fadeIn();
					//$("#labor").fadeIn();
				});
    }

		var player
		function onYouTubeIframeAPIReady() {
				var videoId = $("#player").attr("src");
				player = new YT.Player('player', {
						videoId: videoId,
						playerVars: {
								'playsinline': 1
						},
						events: {
								'onReady': onPlayerReady,
								'onStateChange': onPlayerStateChange
						}
				})
		}

		function onPlayerReady(event) {
				event.target.playVideo() // autostart
		}

		function onPlayerStateChange(event) {
				// do other custom stuff here by watching the YT.PlayerState
		}

		var pauseBtn = document.getElementById('modal-video-close')
		pauseBtn.addEventListener('click', function (event) {
				player.pauseVideo()
		})

		var Youtube = (function () {
		    'use strict';

		    var video, results;

		    var getThumb = function (url, size) {
		        if (url === null) {
		            return '';
		        }
		        size    = (size === null) ? 'big' : size;
		        results = url.match('[\\?&]v=([^&#]*)');
		        video   = (results === null) ? url : results[1];

		        if (size === 'small') {
		            return 'https://img.youtube.com/vi/' + video + '/2.jpg';
		        }
		        return 'https://img.youtube.com/vi/' + video + '/0.jpg';
		    };

		    return {
		        thumb: getThumb
		    };
		}());

		function loadVideo(videoId){
			var thumb = Youtube.thumb('https://www.youtube.com/watch?v='+videoId);
			var response = '<a id="video-button" href="#" data-bs-toggle="modal" data-bs-target="#dynamicVideoModal"><img id="video-thumbnail" class="rounded d-block my-2" width="250px" src="'+thumb+'"/></a>';
			$("#player").attr("src", videoId);
			printOut(response);

			function loadYouTubeVideo() {
			    // 2. This code loads the IFrame Player API code asynchronously.
			    var tag = document.createElement('script');
			    tag.src = "https://www.youtube.com/iframe_api";
			    var firstScriptTag = document.getElementsByTagName('script')[0];
			    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

			}

			var myModalEl = document.getElementById('dynamicVideoModal')
			myModalEl.addEventListener('show.bs.modal', function (event) {
			    // dynamically create video when modal is opened
			    loadYouTubeVideo();
			})
		}

		function loadImg(imgName){
			var response = `<a id="img-button" href="#" data-bs-toggle="modal" data-bs-target="#dynamicImgModal"><img id="img-thumbnail" class="rounded d-block my-2" width="250px" src="/img/${imgName}"/></a>`;
			$("#img-modal").attr("src", `/img/${imgName}`);
			printOut(response);
		}



    // custom function to print-out in div shell-panel
    function printOut(response, simple){
        if(simple){
            $(response).appendTo("#shell-panel").fadeIn();
        }else{ // standard print-out mit highlight!
            $(response).appendTo("#shell-panel").hide().toggle("highlight", {color: 'white'}, 600);
        }
        $('#shell-panel').animate({"scrollTop": $('#shell-panel')[0].scrollHeight}, "fast");
    }


    // Command handler
    var caseObj = null;
    var steps = {};
    var onceTimeStepsActions = []; // track the onceTimeSteps actions
    var caseTimer = null;
    // Note: Change handlers are now set up in checkAllDataLoaded() function

    // Cases
    $('#case').on('change', function(evt, params) {
        var arg = $(this).val();
        caseObj = cases[arg];
        steps = caseObj.steps;
        onceTimeStepsActions = [];
        clearInterval(cprTimer);
        clearInterval(caseTimer);
        caseObj.stepCount = 1;
        caseObj.errorCount = 0; // track fails number!
        // response case description
        response = "<strong>"+caseObj.title+"</strong>";
        response = response + "<p>" + caseObj.description + "</p>";
        // clean UI
        $("#cprTimer").hide();
        $("#caseTimer").hide();
        $("#log").html("");
        $("#vitalParam").hide()
        $('#ecgImg').trigger('zoom.destroy');
        $('#ecgImg').attr({'src':''});
        $("#labor").hide();
				$("#laborTable tbody").empty();
        $("#defiLogo").hide();
        $("#defiNummer").hide();
        $("#defiNummerValue").html("0");
        $("#cprImg").hide();
        $("#cprNummer").hide();
        $("#cprNummerValue").html("0");
        $("#co2").hide();
				$("#temp").hide();
        $("#menu").hide();
        $("#shell-panel").empty();
        // set caseTimer
        caseSec = 0;
        caseTimer = setInterval( function(){
            $("#caseSeconds").html(pad(++caseSec%60));
            $("#caseMinutes").html(pad(parseInt(caseSec/60,10)));
        }, 1000);
        if($("#realtime").is(':checked'))
            $("#caseTimer").show();
        // print-out
        printOut(response);
        // show menu and monitor container
        $("#menu").fadeIn();
        $("#monitor-container").fadeIn();
    });


    // lazy highlight for action Steps
    function doSetTimeout(id, time, failure) {
      setTimeout(function() {
          if(failure==false){
            $('#img_'+id).attr({'src':'img/done.png'}).hide().fadeIn();
            $('#'+id).css("color", "white").hide().fadeIn();
          }else{
            $('#img_'+id).attr({'src':'img/fail.png'}).hide().fadeIn();
          }
      }, time);
    }


    var id=0;
    var calledOptions = []; // track completed options in step with multiple options
    // functions to manage different step types (do/give/answer) response
    function abstractStepHandler(abstractStepKey, abstractStepType, arg){
        // check if the stepCount is initialized, if not => restart from 1
        if(caseObj.stepCount && caseObj.stepCount>0){}else{caseObj.stepCount=1};
        // check if the given action matches with the current step
        var check = false;
        var stepObj = steps[caseObj.stepCount];
        if(abstractStepType && (abstractStepType===arg || abstractStepType.indexOf(arg)>=0)){
            // is the right option! => return msgOk + go to next step!
            check = true;
            var wholetime = 0;
            // check if real-time context && the current action has substeps to print-out
            if(($("#realtime").is(':checked') && actions[arg] && actions[arg].steps) || ($("#realtime").is(':checked') && drugs[arg] && drugs[arg].steps)){
                // check if the substeps are to shown everytime or just the first time
                // if true but not in the array, once is run => push in it!
                if(!actions[arg].onceTimeSteps || (actions[arg].onceTimeSteps && onceTimeStepsActions.indexOf(arg)==-1)){
                    var actionSteps = actions[arg].steps;
                    // manage programmatic failure
                    var c=1; // internal counter to check for programmatic failure while executing the current action (i.e.: problem while trying placing the tube/IV access) => if define I break the lazy print-out for the current action
                    var cFailure = 100;
                    if(stepObj.failureStep){
                        cFailure = stepObj.failureStep;
                    }
                    var actionStepTime = 0;
                    for(var i in actionSteps){
                        var failure=false;
                        var actionStepDescription = actionSteps[i][0];
                        if(c>=cFailure){ // check for any programmating failure
                            failure=true;
                        }else{
                            actionStepTime = actionSteps[i][1];
                        }
                        id=id+1;
                        printOut("<img id='img_"+id+"' src='img/ripple.gif'/><span class='text-light' id='"+id+"'>&nbsp;"+actionStepDescription+"</span><br/>", true);
                        doSetTimeout(id, actionStepTime, failure);
                        wholetime = actionStepTime+500;
                        c++;
                    }
                    // push the current onceTimeAction in the array to track it is already run
                    if(actions[arg].onceTimeSteps && onceTimeStepsActions.indexOf(arg)==-1)
                        onceTimeStepsActions.push(arg);
                }
            }
            // after the substeps I call the main action
            setTimeout(function(){
                // if step with multiple options where all are requested to complete it
                // => stay in this step until all the options (actions/drugs) are called!
                if($.isArray(abstractStepType) && stepObj.allrequest && stepObj.allrequest==true){
                    if(calledOptions.indexOf(arg)==-1){
                        calledOptions.push(arg);
                    }
                    for(var i in abstractStepType){
                        if(calledOptions.indexOf(abstractStepType[i])==-1){
                            response = "That's ok but not enough! What else?";
                            printOut("<div class='alert alert-success my-1'>"+response+"</div>");
                            return // exit
                        }
                    }
                }

                response = stepObj.msgOk;
                caseObj.stepCount++;
                calledOptions = []; // clear the calledOptions array for this step

								// response printout
                printOut("<p class='mt-1'>"+response+"</p>");
                // check if for the current action is defined any Function to execute
                if(stepObj.callFunc){
                  // execute defined Functions
									for (var funcName in stepObj.callFunc) {
										//console.log("calling: "+funcName+"("+stepObj.callFunc[funcName]+")");
										eval(""+funcName+"("+stepObj.callFunc[funcName]+")");
									}
                }
                // check for questions to add at the response
                if(stepObj.quiz){
                    response = "<form>";
                    for (var option in stepObj.quiz) {
                        response = response + "<input type='radio' name='test' value="+option+" onclick='choose(\""+option+"\");'/>&nbsp;("+option+") "+stepObj.quiz[option]+"<br/>";   
                    }
                    response = response +"</form>";
										printOut(response);
                }

								if(stepObj.msgAfter){
									printOut("<p class='mt-1'>"+stepObj.msgAfter+"</p>");
								}
            }, wholetime);
        }else{
            // not the right one => return msgKo
            response = "<div class='alert alert-danger my-1'>"+stepObj.msgKo+"<div>";
            check = false;
            caseObj.errorCount++;
            printOut(response);
        }

        // append log
        var checkLog = "KO";
        if(check)
            checkLog = "OK";
        if(actions[arg])
            $("<log>["+checkLog+"] "+actions[arg].description+"</log>").appendTo("#log").hide().fadeIn();
        if(drugs[arg])
            $("<log>["+checkLog+"] "+drugs[arg]+"</log>").appendTo("#log").hide().fadeIn();
        // if is the last step => print final score (log OK / step totali)
        if(caseObj.stepCount>Object.keys(steps).length){
            $("<h3>You failed " + caseObj.errorCount + " on " + Object.keys(steps).length + "</h3>").appendTo("#log").hide().fadeIn();
        }
    }

    // Actions
    $('#action').on('change', function(evt, params) {
        var arg = $(this).val();
        var stepObj = steps[caseObj.stepCount];
        abstractStepHandler(actionsKey, stepObj.action, arg);
        $('#action').val('').trigger('chosen:updated');
        if($("#realtime").is(':checked')){
            $("#caseTimer").show();
        }else{
            $("#caseTimer").hide();
        }
    });

    // Quiz
    function choose(arg){
        var optionsKey = ['a','b','c','d'];
        var stepObj = steps[caseObj.stepCount];
        abstractStepHandler(optionsKey, stepObj.choose, arg);
    }

    // Drugs
    $('#drug').on('change', function(evt, params) {
        var arg = $(this).val();
        var stepObj = steps[caseObj.stepCount];
        abstractStepHandler(drugsKey, stepObj.give, arg);
        $('#drug').val('').trigger('chosen:updated');
    });

var dataLoaded = {
    cases: false,
    actions: false,
    drugs: false
};

function checkAllDataLoaded() {
    if (dataLoaded.cases && dataLoaded.actions && dataLoaded.drugs) {
        console.log('All data loaded - initializing all dropdowns');
        
        // Clear any existing initializations
        $('.ui.dropdown').dropdown('destroy');
        
        // Initialize all dropdowns with default settings
        $('.ui.dropdown').dropdown();
        
        console.log('All dropdowns initialized successfully');
    }
}

$(document).ready(function() {
    console.log('DOM ready - waiting for data to load before dropdown initialization');

    // Add modern UI enhancements
    initializeModernUI();
});

function initializeModernUI() {
    // Add slide-in animation to main elements
    $('.ui.grid, #shell-panel, #monitor-container, #logBox').addClass('slide-in');

    // Add smooth scrolling and focus effects
    $('input, select, textarea').focus(function() {
        $(this).parent().addClass('focused');
    }).blur(function() {
        $(this).parent().removeClass('focused');
    });

    // Add click feedback to buttons
    $('.ui.button, .modern-button').on('click', function() {
        $(this).addClass('clicked');
        setTimeout(() => {
            $(this).removeClass('clicked');
        }, 200);
    });

    // Progressive enhancement for better mobile experience
    if (window.innerWidth <= 768) {
        $('body').addClass('mobile-enhanced');
    }
}