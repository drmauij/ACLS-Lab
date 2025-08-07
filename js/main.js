// Global variables
var dataLoaded = {};
var selectedCase = null;
var caseTimer = null;
var cprTimer = null;
var caseSeconds = 0;
var caseMinutes = 0;
var cprSeconds = 0;
var cprMinutes = 0;
var cprNummer = 0;
var defiNummer = 0;
var caseObj = {};
var calledOptions = [];
var realtime = true; // Default to true, can be changed by scenario data
var quizAnsweredSteps = new Set(); // Track which steps have had their quiz answered

// Function to load all data
function loadAllData() {
    console.log('Loading all data...');
    $.when(
        $.getJSON('/data/cases.json'),
        $.getJSON('/data/actions.json'),
        $.getJSON('/data/drugs.json')
    ).done(function(cases, actions, drugs) {
        dataLoaded.cases = cases[0];
        dataLoaded.actions = actions[0];
        dataLoaded.drugs = drugs[0];
        console.log('All data loaded successfully');

        // Populate dropdowns
        populateDropdown('case-dropdown', dataLoaded.cases);
        populateDropdown('action-dropdown', dataLoaded.actions);
        populateDropdown('drug-dropdown', dataLoaded.drugs);

        // Show the action/drug menu once data is loaded
        $('#menu').show();

        // Show scenario selection modal only if no case is selected yet
        if (!selectedCase) {
            $('#scenarioSelectionModal').modal({
                closable: false,
                onApprove: function() {
                    var selectedCaseId = $('#case-dropdown').dropdown('get value');
                    if (selectedCaseId) {
                        startScenario(selectedCaseId);
                    }
                    return false;
                }
            }).modal('show');
        }
    }).fail(function(jqxhr, textStatus, error) {
        console.error('Error loading data:', textStatus, error);
    });
}

// Function to populate dropdowns
function populateDropdown(dropdownId, data) {
    var $dropdown = $('#' + dropdownId);
    $dropdown.empty(); // Clear existing options
    $.each(data, function(key, value) {
        $dropdown.append('<div class="item" data-value="' + key + '">' + value.title + '</div>');
    });
}

// Function to handle scenario selection
function startScenario(caseId) {
    console.log('Starting scenario from modal:', caseId);
    selectedCase = caseId;
    var caseName = dataLoaded.cases[caseId] ? dataLoaded.cases[caseId].title : 'Unknown Case';
    console.log('Starting case:', caseName);

    $('#scenarioSelectionModal').modal('hide');

    clearInterval(caseTimer);
    clearInterval(cprTimer);

    // Reset all counters and timers
    caseSeconds = 0;
    caseMinutes = 0;
    cprSeconds = 0;
    cprMinutes = 0;
    cprNummer = 0;
    defiNummer = 0;

    // Update display
    $('#caseMinutes').text('00');
    $('#caseSeconds').text('00');
    $('#cprMinutes').text('00');
    $('#cprSeconds').text('00');
    $('#cprNummerValue').text('0');
    $('#defiNummerValue').text('0');

    // Hide all monitoring elements initially
    $('#caseTimer, #cprTimer, #cprCounter, #defiCounter').hide();
    $('#vitalParam, #labor, #logBox').hide();

    // Clear previous scenario data
    $("#shell-panel, #shell-panel-mobile").empty();
    $("#log").empty();
    $("#laborTable tbody").empty();
    calledOptions = [];

    // Reset quiz state - clear all answered steps
    quizAnsweredSteps.clear();

    // Initialize case
    caseObj = {
        caseId: caseId,
        stepCount: 1
    };

    // Start case timer
    if (realtime) {
        caseTimer = setInterval(updateCaseTimer, 1000);
        $('#caseTimer').show();
    }

    // Load and start the scenario
    loadScenario(caseId);
}

// Function to load a specific scenario
function loadScenario(caseId) {
    console.log('Loading scenario:', caseId);
    $.getJSON('/data/cases/' + caseId + '.json', function(scenarioData) {
        console.log('Scenario data loaded:', scenarioData);
        if (scenarioData.realtime !== undefined) {
            realtime = scenarioData.realtime;
        }
        displayStep(scenarioData.steps[0]); // Start with the first step
    }).fail(function(jqxhr, textStatus, error) {
        console.error('Error loading scenario data:', textStatus, error);
    });
}

// Function to display a step
function displayStep(stepData) {
    console.log('Displaying step:', stepData);
    $('#log').empty(); // Clear previous log entries

    if (stepData.description) {
        $('#log').append('<li>' + stepData.description + '</li>');
    }

    if (stepData.options) {
        var optionsHtml = '';
        stepData.options.forEach(function(option) {
            optionsHtml += '<button class="ui button fluid labeled icon quiz-option" data-option="' + option.nextStep + '">' + option.text + '</button>';
        });
        $('#log').append('<div class="ui stackable grid">' + optionsHtml + '</div>');
    }

    if (stepData.action) {
        var actionDetail = dataLoaded.actions[stepData.action];
        if (actionDetail) {
            $('#log').append('<li>Action: ' + actionDetail.title + ' - ' + actionDetail.description + '</li>');
        }
    }

    if (stepData.drug) {
        var drugDetail = dataLoaded.drugs[stepData.drug];
        if (drugDetail) {
            $('#log').append('<li>Drug: ' + drugDetail.title + ' - ' + drugDetail.description + '</li>');
        }
    }

    if (stepData.vitalParams) {
        $('#vitalParam').show();
        $('#heartRate').text(stepData.vitalParams.heartRate);
        $('#bloodPressure').text(stepData.vitalParams.bloodPressure);
        $('#respirationRate').text(stepData.vitalParams.respirationRate);
    } else {
        $('#vitalParam').hide();
    }

    if (stepData.labor) {
        $('#labor').show();
        var $laborTableBody = $('#laborTable tbody');
        $laborTableBody.empty();
        stepData.labor.forEach(function(item) {
            $laborTableBody.append('<tr><td>' + item.time + '</td><td>' + item.description + '</td></tr>');
        });
    } else {
        $('#labor').hide();
    }

    if (stepData.showCprCounter) {
        $('#cprCounter, #cprMinutes, #cprSeconds').show();
        if (!cprTimer) { // Start CPR timer only if not already running
            cprTimer = setInterval(updateCprTimer, 1000);
        }
    } else {
        $('#cprCounter, #cprMinutes, #cprSeconds').hide();
        clearInterval(cprTimer); // Stop CPR timer if not needed
        cprTimer = null;
    }

    if (stepData.showDefibrillator) {
        $('#defiCounter').show();
    } else {
        $('#defiCounter').hide();
    }

    $('#logBox').show();
}

// Function to update case timer
function updateCaseTimer() {
    caseSeconds++;
    if (caseSeconds >= 60) {
        caseSeconds = 0;
        caseMinutes++;
    }
    $('#caseMinutes').text(String(caseMinutes).padStart(2, '0'));
    $('#caseSeconds').text(String(caseSeconds).padStart(2, '0'));
}

// Function to update CPR timer
function updateCprTimer() {
    cprSeconds++;
    if (cprSeconds >= 60) {
        cprSeconds = 0;
        cprMinutes++;
    }
    $('#cprMinutes').text(String(cprMinutes).padStart(2, '0'));
    $('#cprSeconds').text(String(cprSeconds).padStart(2, '0'));
}

// Function to choose an option (move to next step)
function choose(option) {
    console.log('Choosing option:', option);
    if (!caseObj || !dataLoaded.cases || !dataLoaded.cases[caseObj.caseId]) {
        console.error('Case data not available for choosing option.');
        return;
    }

    var scenarioData = dataLoaded.cases[caseObj.caseId];
    var currentStepIndex = scenarioData.steps.findIndex(step => {
        // This assumes the 'option' directly corresponds to the 'nextStep' value
        // If the 'nextStep' is a string like "quiz_step_1_option_A", we need to match it.
        // For simplicity, let's assume 'option' is the identifier of the next step.
        // A more robust solution might involve mapping options to step indices.
        return step.id === option; // Assuming steps have unique IDs
    });

    if (currentStepIndex === -1) {
        // If the direct mapping fails, try to find the step that *leads* to this option.
        // This requires iterating through all steps and their options.
        for (const step of scenarioData.steps) {
            if (step.options) {
                const matchingOption = step.options.find(opt => opt.nextStep === option);
                if (matchingOption) {
                    // Found the step that has this option. Now find the index of that step.
                    currentStepIndex = scenarioData.steps.indexOf(step);
                    break;
                }
            }
        }
    }

    if (currentStepIndex === -1) {
        console.error('Could not find the step corresponding to option:', option);
        return;
    }

    // Increment step count and find the next step's data
    caseObj.stepCount++; // Increment for the next step
    var nextStepData = scenarioData.steps[currentStepIndex + 1]; // Get the actual next step data

    if (nextStepData) {
        displayStep(nextStepData);
    } else {
        console.log('Scenario completed!');
        // Handle scenario completion, e.g., show a completion message or modal
        $('#log').append('<li>Scenario completed!</li>');
        $('#caseTimer, #cprCounter, #defiCounter, #vitalParam, #logBox, #labor').hide();
        clearInterval(caseTimer);
        clearInterval(cprTimer);
    }
}


// Initialize dropdowns and event listeners
$(document).ready(function() {
    console.log('Document ready - starting initialization');
    loadAllData();

    // Ensure modal can be shown
    setTimeout(function() {
        if (!selectedCase) {
            console.log('Showing scenario selection modal');
            $('#scenarioSelectionModal').modal({
                closable: false,
                onApprove: function() {
                    var selectedCaseId = $('#case-dropdown').dropdown('get value');
                    if (selectedCaseId) {
                        startScenario(selectedCaseId);
                    }
                    return false;
                }
            }).modal('show');
        }
    }, 500);

    // Event listener for quiz options
    $(document).off('click', '.quiz-option').on('click', '.quiz-option', function(e) {
        e.preventDefault();
        e.stopPropagation();

        var option = $(this).data('option');
        var currentStep = caseObj.stepCount;
        console.log('Quiz label clicked for option:', option);

        if (quizAnsweredSteps.has(currentStep)) {
            console.log('Quiz already answered for step', currentStep, ', ignoring click');
            return;
        }

        console.log('Quiz selection triggered for option:', option);
        quizAnsweredSteps.add(currentStep);

        console.log('Calling choose() with option:', option);
        choose(option);
    });

    // Event listener for action dropdown
    $('#action-dropdown').dropdown({
        onChange: function(value, text, $choice) {
            console.log('Action selected:', value);
            // Find the current step data to see if an action is associated
            if (caseObj && dataLoaded.cases && dataLoaded.cases[caseObj.caseId]) {
                var scenarioData = dataLoaded.cases[caseObj.caseId];
                var currentStep = scenarioData.steps[caseObj.stepCount - 1]; // -1 because stepCount is 1-based for display

                if (currentStep && currentStep.action === value) {
                    // This is the correct action for the current step
                    console.log('Correct action chosen. Moving to next step.');
                    choose(value); // Assuming 'value' is the identifier for the next step
                } else {
                    console.log('Incorrect action chosen or action not tied to current step.');
                    // Optionally provide feedback for incorrect action
                }
            }
        }
    });

    // Event listener for drug dropdown
    $('#drug-dropdown').dropdown({
        onChange: function(value, text, $choice) {
            console.log('Drug selected:', value);
            // Similar logic to action dropdown, check if it's the correct drug for the current step
            if (caseObj && dataLoaded.cases && dataLoaded.cases[caseObj.caseId]) {
                var scenarioData = dataLoaded.cases[caseObj.caseId];
                var currentStep = scenarioData.steps[caseObj.stepCount - 1];

                if (currentStep && currentStep.drug === value) {
                    console.log('Correct drug chosen. Moving to next step.');
                    choose(value); // Assuming 'value' is the identifier for the next step
                } else {
                    console.log('Incorrect drug chosen or drug not tied to current step.');
                    // Optionally provide feedback for incorrect drug
                }
            }
        }
    });
});