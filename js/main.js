// data preload from JSON files - Load all in parallel
    var cases = {};
    var casesKey = [];
    var actions = {};
    var actionsKey = [];
    var drugs = {};
    var drugsKey = [];

    console.log('Loading all JSON data in parallel...');

    Promise.all([
        $.getJSON("/json/cases.json"),
        $.getJSON("/json/actions.json"),
        $.getJSON("/json/drugs.json")
    ]).then(function([casesData, actionsData, drugsData]) {
        console.log('All data loaded successfully');

        // Process cases
        $.each(casesData, function(key, obj) {
            cases[key] = obj;
            casesKey.push(""+key);
            $('#case-dropdown .menu').append('<div class="item" data-value="'+key+'">'+obj.title+'</div>');
        });

        // Process actions
        $.each(actionsData, function(key, obj) {
            actions[key] = obj;
            actionsKey.push(""+key);
            $('#action-dropdown .menu').append('<div class="item" data-value="'+key+'">'+obj.description+'</div>');
        });

        // Process drugs
        $.each(drugsData, function(key, value) {
            drugs[key] = value;
            drugsKey.push(""+key);
            $('#drug-dropdown .menu').append('<div class="item" data-value="'+key+'">'+value+'</div>');
        });

        console.log('All dropdowns populated - Cases:', casesKey.length, 'Actions:', actionsKey.length, 'Drugs:', drugsKey.length);

        dataLoaded.cases = true;
        dataLoaded.actions = true;
        dataLoaded.drugs = true;

        checkAllDataLoaded();

    }).catch(function(error) {
        console.error('Failed to load JSON data:', error);
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
        $("#cprCounter").show();
        $("#cprImg").effect( "pulsate", {
          times: 700
        }, 500000);
        $("#cprCounter").effect( "pulsate", {
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
        if($("#realtime-toggle").hasClass('active'))
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
        if($("#realtime-toggle").hasClass('active')){
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
        $("#defiCounter").fadeIn();
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
    // Note: Change handlers are now set up in attachChangeHandlers() function


    // lazy highlight for action Steps
    function doSetTimeout(id, time, failure) {
      setTimeout(function() {
          if(failure==false){
            $('#loader_'+id).removeClass('ui active inline mini loader').html('<i class="ui check green icon"></i>').hide().fadeIn();
            $('#'+id).css("color", "white").hide().fadeIn();
          }else{
            $('#loader_'+id).removeClass('ui active inline mini loader').html('<i class="ui times red icon"></i>').hide().fadeIn();
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
            if(($("#realtime-toggle").hasClass('active') && actions[arg] && actions[arg].steps) || ($("#realtime-toggle").hasClass('active') && drugs[arg] && drugs[arg].steps)){
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
        printOut("<span class='text-light' id='"+id+"'><span id='loader_"+id+"' class='ui active inline mini loader'></span>&nbsp;"+actionStepDescription+"</span><br/>", true);
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
        if(actions[arg]) {
            $("<log>["+checkLog+"] "+actions[arg].description+"</log>").appendTo("#log").hide().fadeIn();
            $("#logBox").fadeIn(); // Show log box when first entry is added
        }
        if(drugs[arg]) {
            $("<log>["+checkLog+"] "+drugs[arg]+"</log>").appendTo("#log").hide().fadeIn();
            $("#logBox").fadeIn(); // Show log box when first entry is added
        }
        // if is the last step => print final score (log OK / step totali)
        if(caseObj.stepCount>Object.keys(steps).length){
            $("<h3>You failed " + caseObj.errorCount + " on " + Object.keys(steps).length + "</h3>").appendTo("#log").hide().fadeIn();
        }
    }

    // Quiz
    function choose(arg){
        var optionsKey = ['a','b','c','d'];
        var stepObj = steps[caseObj.stepCount];
        abstractStepHandler(optionsKey, stepObj.choose, arg);
    }

var dataLoaded = {
    cases: false,
    actions: false,
    drugs: false
};

function checkAllDataLoaded() {
    if (dataLoaded.cases && dataLoaded.actions && dataLoaded.drugs) {
        console.log('All data loaded - initializing dropdowns');

        // Hide loading indicator if present
        $('.loading-indicator').fadeOut();

        initializeDropdowns();

        // Refresh all dropdowns after items are populated to fix scrolling
        setTimeout(() => {
            $('#case-dropdown, #action-dropdown, #drug-dropdown').dropdown('refresh');
            console.log('Dropdowns refreshed after dynamic content loaded');
        }, 50); // Reduced timeout
    }
}

function attachChangeHandlers() {
    // Prevent multiple attachments
    if (window.handlersAttached) {
        return;
    }
    window.handlersAttached = true;

    // Remove existing handlers to prevent duplicates
    $('#case, #action, #drug').off('change.acls');

    // Cases with debouncing to prevent rapid triggers
    let caseChangeTimeout;
    $('#case').on('change.acls', function(evt, params) {
        var arg = $(this).val();
        console.log('Case change event triggered with value:', arg);

        // Clear any existing timeout
        if (caseChangeTimeout) {
            clearTimeout(caseChangeTimeout);
        }

        // Debounce the case change
        caseChangeTimeout = setTimeout(() => {
            if (!arg || arg === '') {
                console.log('No case selected, returning');
                return;
            }

            caseObj = cases[arg];
            if (!caseObj) {
                console.error('Case not found:', arg);
                return;
            }

            console.log('Starting case:', caseObj.title);
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
        $("#logBox").hide(); // Hide log box when case is reset
        $("#vitalParam").hide()
        $('#ecgImg').trigger('zoom.destroy');
        $('#ecgImg').attr({'src':''});
        $("#labor").hide();
        $("#laborTable tbody").empty();
        $("#defiLogo").hide();
        $("#defiCounter").hide();
        $("#defiNummerValue").html("0");
        $("#cprImg").hide();
        $("#cprCounter").hide();
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
        if($("#realtime-toggle").hasClass('active'))
            $("#caseTimer").show();
        // print-out
        printOut(response);
        // show menu and monitor container
        $("#menu").fadeIn();
        $("#monitor-container").fadeIn();
        $("#monitor-container-mobile").fadeIn();
        // Add class to body to adjust layout
        $('body').addClass('monitor-visible');
        // Update sidebar trigger visibility
        if (typeof updateSidebarVisibility === 'function') {
            updateSidebarVisibility();
        }

        // Mirror content for mobile layout
        updateMobileLayout();
        }, 150); // 150ms debounce delay
    });

    // Function to update mobile layout content
    function updateMobileLayout() {
        if ($(window).width() <= 768) {
            // Mirror shell panel content - force update even if empty
            var shellContent = $("#shell-panel").html();
            $("#shell-panel-mobile").html(shellContent || 'ACLS (Advanced Cardiac Life Support) lab is an easy-to-go application to learn and simulate different ACLS scenarios. Choose a scenario from above to start your simulation. Have fun!');

            // Show the mobile shell panel
            $("#shell-panel-mobile").show();
        }
    }

    // Sidebar functionality
    function initializeSidebar() {
        const sidebar = $('.sidebar');
        const sidebarTrigger = $('.sidebar-trigger');
        const sidebarOverlay = $('.sidebar-overlay');

        // Show/hide sidebar trigger based on screen size and scenario state
        function updateSidebarVisibility() {
            if ($(window).width() <= 768) {
                // Show trigger on mobile when scenario is started
                if ($('body').hasClass('monitor-visible')) {
                    sidebarTrigger.show().removeClass('hidden');
                    console.log('Sidebar trigger shown on mobile');
                } else {
                    sidebarTrigger.hide().addClass('hidden');
                }
            } else {
                sidebarTrigger.hide();
                sidebar.removeClass('active');
                sidebarOverlay.removeClass('active').hide();
            }
        }

        // Remove any existing event handlers to prevent duplicates
        $(document).off('click.sidebar');
        $(document).off('keydown.sidebar');

        // Toggle sidebar on mobile - use event delegation
        $(document).on('click.sidebar', '.sidebar-trigger', function(e) {
            e.preventDefault();
            e.stopPropagation();

            if (sidebar.hasClass('active')) {
                console.log('Sidebar trigger clicked - closing sidebar');
                sidebar.removeClass('active');
                sidebarOverlay.removeClass('active').fadeOut(300);
            } else {
                console.log('Sidebar trigger clicked - opening sidebar');
                sidebar.addClass('active');
                sidebarOverlay.addClass('active').show();
                // Show monitor and log content
                $('.sidebar-monitor').show();
                $('.sidebar-log').show();
            }
        });

        // Close sidebar when clicking overlay
        $(document).on('click.sidebar', '.sidebar-overlay', function(e) {
            console.log('Sidebar overlay clicked - closing sidebar');
            sidebar.removeClass('active');
            sidebarOverlay.removeClass('active').fadeOut(300);
        });

        // Close sidebar when clicking collapse button
        $(document).on('click.sidebar', '.sidebar-collapse-btn', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Sidebar collapse button clicked - closing sidebar');
            sidebar.removeClass('active');
            sidebarOverlay.removeClass('active').fadeOut(300);
        });

        // Close sidebar on escape key
        $(document).on('keydown.sidebar', function(e) {
            if (e.key === 'Escape' && sidebar.hasClass('active')) {
                sidebar.removeClass('active');
                sidebarOverlay.removeClass('active').fadeOut(300);
            }
        });

        // Update on window resize
        $(window).on('resize', updateSidebarVisibility);
        updateSidebarVisibility();

        return updateSidebarVisibility;
    }

    // Initialize sidebar
    const updateSidebarVisibility = initializeSidebar();

    // Update mobile content when main content changes
    function syncMobileContent() {
        if ($(window).width() <= 768) {
            updateMobileLayout();
        }
    }

    // Handle window resize
    $(window).resize(function() {
        if ($(window).width() <= 768) {
            updateMobileLayout();
        }
    });

    // Auto-scroll function for shell panels
    function autoScrollToBottom(element) {
        if (element && element.scrollHeight > element.clientHeight) {
            element.scrollTop = element.scrollHeight;
        }
    }

    // Sync content on any major updates using MutationObserver with throttling
    if (typeof MutationObserver !== 'undefined' && !window.observerAttached) {
        window.observerAttached = true;
        let throttleTimeout;

        const observer = new MutationObserver(function(mutations) {
            // Throttle the observer to prevent excessive calls
            if (throttleTimeout) return;

            throttleTimeout = setTimeout(() => {
                throttleTimeout = null;
                syncMobileContent();

                // Auto-scroll shell panels when content is added
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        const target = mutation.target;

                        // Check if the mutation happened in shell panel or its descendants
                        if (target.id === 'shell-panel' || target.closest('#shell-panel')) {
                            setTimeout(() => {
                                autoScrollToBottom(document.getElementById('shell-panel'));
                                autoScrollToBottom(document.getElementById('shell-panel-mobile'));
                            }, 100);
                        }

                        // Also handle log auto-scroll
                        if (target.id === 'log' || target.closest('#log')) {
                            setTimeout(() => {
                                autoScrollToBottom(document.getElementById('log'));
                            }, 100);
                        }
                    }
                });
            }, 250); // Throttle to 250ms
        });

        // Observe changes to shell panel, monitor, and log
        const elementsToObserve = ['#shell-panel', '#shell-panel-mobile', '#monitor', '#log'];
        elementsToObserve.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                observer.observe(element, {
                    childList: true,
                    subtree: false, // Don't observe subtree to reduce callbacks
                    characterData: false
                });
            }
        });
    }

    // Remove problematic auto-refresh interval that was causing loops

    // Additional trigger for scenario changes
    $(document).on('change', '#case', function() {
        setTimeout(function() {
            updateMobileLayout();
            // Auto-scroll to bottom when scenario content changes
            autoScrollToBottom(document.getElementById('shell-panel'));
            autoScrollToBottom(document.getElementById('shell-panel-mobile'));
        }, 100);
    });

    // Auto-scroll when actions are performed
    $(document).on('change', '#action, #drug', function() {
        setTimeout(function() {
            autoScrollToBottom(document.getElementById('shell-panel'));
            autoScrollToBottom(document.getElementById('shell-panel-mobile'));
        }, 500); // Longer delay to allow content to be processed
    });

    // Actions
    var processingAction = false;
    $('#action').on('change', function(evt, params) {
        var arg = $(this).val();
        console.log('Action change triggered:', arg);
        if (arg && caseObj && steps[caseObj.stepCount] && !processingAction) {
            processingAction = true;
            var stepObj = steps[caseObj.stepCount];
            abstractStepHandler(actionsKey, stepObj.action, arg);

            if($("#realtime-toggle").hasClass('active')){
                $("#caseTimer").show();
            }else{
                $("#caseTimer").hide();
            }

            // Reset processing flag after a short delay
            setTimeout(() => {
                processingAction = false;
            }, 500);
        }
    });

    // Drugs
    var processingDrug = false;
    $('#drug').on('change', function(evt, params) {
        var arg = $(this).val();
        console.log('Drug change triggered:', arg);
        if (arg && caseObj && steps[caseObj.stepCount] && !processingDrug) {
            processingDrug = true;
            var stepObj = steps[caseObj.stepCount];
            abstractStepHandler(drugsKey, stepObj.give, arg);

            // Reset processing flag after a short delay
            setTimeout(() => {
                processingDrug = false;
            }, 500);
        }
    });
}

function initializeDropdowns() {
    // Prevent multiple initializations
    if (window.dropdownsInitialized) {
        return;
    }
    window.dropdownsInitialized = true;

    // Clear any existing dropdown instances and event handlers
    try {
        $('.ui.dropdown').dropdown('destroy');
    } catch(e) {
        // Ignore errors if dropdowns weren't initialized
    }
    $('#action, #drug, #case').off('change');

    // Re-attach the change event handlers first
    attachChangeHandlers();

    // Add flag to prevent recursive calls
    let processingCaseChange = false;
    let processingActionChange = false;
    let processingDrugChange = false;

    // Standard dropdown for case selection in modal with proper scrolling
    $('#case-dropdown').dropdown({
        direction: 'downward',
        fullTextSearch: true,
        forceSelection: false,
        allowAdditions: false,
        showOnFocus: false,
        onChange: function(value, text, $selectedItem) {
            console.log('Case dropdown onChange triggered:', value, text);
            if (value && value !== '' && value !== null && !processingCaseChange) {
                processingCaseChange = true;
                console.log('Starting scenario from modal:', value);
                $('#case').val(value).trigger('change');
                $('#scenarioSelectionModal').modal('hide');
                setTimeout(() => {
                    processingCaseChange = false;
                }, 100);
            }
        },
        onShow: function() {
            // Refresh dropdown to handle dynamically added items
            $(this).dropdown('refresh');

            // Ensure proper positioning and scrolling
            var $menu = $(this).find('.menu');
            var isMobile = window.innerWidth <= 768;

            if (isMobile) {
                $menu.css({
                    'max-height': '50vh',
                    'overflow-y': 'auto',
                    'overflow-x': 'hidden',
                    'z-index': '10001',
                    'position': 'absolute',
                    'top': '100%',
                    'left': '0',
                    'right': '0',
                    '-webkit-overflow-scrolling': 'touch',
                    'touch-action': 'pan-y'
                });

                // Force enable scrolling on mobile
                $menu.on('touchstart', function(e) {
                    e.stopPropagation();
                });

                $menu.on('touchmove', function(e) {
                    e.stopPropagation();
                });

                // Prevent modal from interfering with dropdown scrolling
                $menu.on('scroll', function(e) {
                    e.stopPropagation();
                });
            } else {
                $menu.css({
                    'max-height': '250px',
                    'overflow-y': 'auto',
                    'overflow-x': 'hidden',
                    'z-index': '10001'
                });
            }
        },
        onHide: function() {
            // Clean up any custom styles and event handlers
            var $menu = $(this).find('.menu');
            $menu.off('touchstart touchmove scroll');
            $menu.removeAttr('style');
        }
    });

    // Show modal on page load if no scenario is selected
    if (!$('#case').val()) {
        setTimeout(() => {
            $('#scenarioSelectionModal').modal({
                closable: false,
                allowMultiple: false,
                onDeny: function() {
                    return false; // Prevent closing
                },
                onApprove: function() {
                    return false; // Prevent closing
                }
            }).modal('show');
        }, 500);
    }

    // Action and Drug dropdowns with upward direction and full viewport width
    $('#action-dropdown, #drug-dropdown').dropdown({
        direction: 'upward',
        fullTextSearch: true,
        forceSelection: false,
        allowAdditions: false,
        showOnFocus: false,
        onChange: function(value, text, $selectedItem) {
            var dropdownId = $(this).attr('id');
            var $dropdown = $(this);
            console.log(dropdownId + ' onChange:', value, text);

            if (value && value !== '' && value !== null) {
                if (dropdownId === 'action-dropdown' && !processingActionChange) {
                    processingActionChange = true;
                    $('#action').val(value).trigger('change');
                    
                    // Reset dropdown after action is processed
                    setTimeout(() => {
                        $dropdown.dropdown('clear');
                        $dropdown.dropdown('set text', 'Select an action...');
                        processingActionChange = false;
                    }, 500);
                } else if (dropdownId === 'drug-dropdown' && !processingDrugChange) {
                    processingDrugChange = true;
                    $('#drug').val(value).trigger('change');
                    
                    // Reset dropdown after drug is processed
                    setTimeout(() => {
                        $dropdown.dropdown('clear');
                        $dropdown.dropdown('set text', 'Select a drug...');
                        processingDrugChange = false;
                    }, 500);
                }
            }
        },
        onShow: function() {
            var $dropdown = $(this);
            var $menu = $dropdown.find('.menu');

            // Force upward positioning and full viewport width
            $menu.css({
                'position': 'fixed',
                'bottom': $('#app-footer').outerHeight() + 'px',
                'top': 'auto',
                'left': '0',
                'right': '0',
                'width': '100vw',
                'max-width': '100vw',
                'margin': '0',
                'z-index': '10002',
                'max-height': '50vh',
                'overflow-y': 'auto',
                'overflow-x': 'hidden',
                'border-radius': '8px 8px 0 0',
                'box-shadow': '0 -4px 12px rgba(0, 0, 0, 0.3)',
                'backdrop-filter': 'blur(10px)',
                'background': 'rgba(0, 0, 0, 0.95)',
                'border': '1px solid rgba(255, 255, 255, 0.1)',
                'border-bottom': 'none'
            });

            // Ensure proper scrolling behavior
            $menu.off('touchstart touchmove scroll').on('touchstart', function(e) {
                e.stopPropagation();
            }).on('touchmove', function(e) {
                e.stopPropagation();
            }).on('scroll', function(e) {
                e.stopPropagation();
            });
        },
        onHide: function() {
            var $menu = $(this).find('.menu');
            $menu.off('touchstart touchmove scroll');
        }
    });

    console.log('All dropdowns initialized as standard Semantic UI dropdowns');
}

$(document).ready(function() {
    console.log('DOM ready - waiting for data to load');

    // Initialize Semantic UI toggle button
    $('#realtime-toggle').on('click', function() {
        $(this).toggleClass('active');
        if ($(this).hasClass('active')) {
            $(this).find('i').removeClass('bolt').addClass('clock');
            $(this).find('.toggle-text').text('Realtime');
            console.log("Realtime enabled");
        } else {
            $(this).find('i').removeClass('clock').addClass('bolt');
            $(this).find('.toggle-text').text('Instant');
            console.log("Instant mode enabled");
        }
    });

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