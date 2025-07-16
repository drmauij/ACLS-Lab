
// Scenario Generator JavaScript
class ScenarioGenerator {
    constructor() {
        this.generatedScenario = null;
        this.stepCounter = 1;
        
        // Template patterns for different conditions
        this.conditionTemplates = {
            cardiac_arrest: {
                initialSteps: ['callHelp', 'patientCheck', 'startCPR'],
                commonRhythms: ['VF', 'VT', 'Asystole'],
                medications: ['adrenaline', 'amiodarone'],
                procedures: ['intubate', 'venousAccess', 'defibrillation']
            },
            stemi: {
                initialSteps: ['vitalParams', 'ecg'],
                commonRhythms: ['stemi', 'Brady'],
                medications: ['oxygen', 'morphine', 'nitrospray', 'heparine5000'],
                procedures: ['venousAccess']
            },
            choking: {
                initialSteps: ['callHelp', 'backBlows', 'heimlichManeuver'],
                commonRhythms: ['VT', 'VF'],
                medications: ['adrenaline', 'amiodarone'],
                procedures: ['airwayCheck', 'airwayFree', 'intubate']
            },
            trauma: {
                initialSteps: ['vitalParams', 'venousAccess', 'bodyCheck', 'immobilization'],
                commonRhythms: ['SVT', 'VT'],
                medications: ['fentanyl', 'tranexam', 'colloid', 'noradrenaline'],
                procedures: ['arterialAccess', 'centralAccess']
            }
        };
        
        // Common ECG patterns
        this.ecgPatterns = {
            'VF': "'VF.gif', 0",
            'VT': "'VT.gif', 180",
            'Asystole': "'Asystole.gif', 0",
            'Brady': "'Brady.gif', 40",
            'SR': "'SR.gif', 90",
            'SVT': "'SVT.gif', 150",
            'stemi': "'stemi.gif', 80"
        };
    }
    
    generateScenario() {
        const title = document.getElementById('scenarioTitle').value;
        const description = document.getElementById('scenarioDescription').value;
        const age = document.getElementById('patientAge').value;
        const condition = document.getElementById('primaryCondition').value;
        const complications = document.getElementById('complications').value;
        const initialRhythm = document.getElementById('initialRhythm').value;
        
        if (!title || !description || !condition) {
            alert('Please fill in the required fields (Title, Description, and Primary Condition)');
            return;
        }
        
        this.stepCounter = 1;
        const scenario = this.buildScenario(title, description, age, condition, complications, initialRhythm);
        
        this.generatedScenario = scenario;
        this.displayScenario(scenario);
    }
    
    buildScenario(title, description, age, condition, complications, initialRhythm) {
        const template = this.conditionTemplates[condition];
        const scenarioKey = `acls${Math.floor(Math.random() * 1000)}`;
        
        const scenario = {
            [scenarioKey]: {
                title: title,
                description: description,
                steps: {}
            }
        };
        
        // Build steps based on condition
        this.addInitialSteps(scenario[scenarioKey].steps, template, initialRhythm);
        
        if (condition === 'cardiac_arrest') {
            this.addCardiacArrestSteps(scenario[scenarioKey].steps, initialRhythm);
        } else if (condition === 'stemi') {
            this.addSTEMISteps(scenario[scenarioKey].steps);
        } else if (condition === 'choking') {
            this.addChokingSteps(scenario[scenarioKey].steps);
        } else if (condition === 'trauma') {
            this.addTraumaSteps(scenario[scenarioKey].steps);
        }
        
        return scenario;
    }
    
    addInitialSteps(steps, template, initialRhythm) {
        // First step - usually call for help or assess patient
        steps[this.stepCounter] = {
            action: template.initialSteps[0],
            msgOk: "Good! What's your next step?",
            msgKo: "Think about the first priority in this situation!"
        };
        this.stepCounter++;
        
        // Add assessment steps
        if (template.initialSteps.includes('patientCheck')) {
            steps[this.stepCounter] = {
                action: "patientCheck",
                msgOk: "The patient is unresponsive with no pulse. What next?",
                msgKo: "You should assess the patient's condition first!"
            };
            this.stepCounter++;
        }
        
        if (template.initialSteps.includes('vitalParams') || template.initialSteps.includes('ecg')) {
            steps[this.stepCounter] = {
                action: ["vitalParams", "ecg"],
                allrequest: false,
                msgOk: "Vital signs obtained. What's your assessment?",
                msgKo: "Get the patient's vital signs and ECG!",
                callFunc: this.generateVitalSigns(initialRhythm)
            };
            this.stepCounter++;
        }
    }
    
    addCardiacArrestSteps(steps, initialRhythm) {
        // CPR initiation
        steps[this.stepCounter] = {
            action: "startCPR",
            msgOk: "CPR initiated. The emergency team arrives. What do you need?",
            msgKo: "Start CPR immediately!",
            callFunc: {
                startCPR: "'bls'"
            }
        };
        this.stepCounter++;
        
        // Rhythm assessment
        steps[this.stepCounter] = {
            action: ["vitalParams", "ecg"],
            allrequest: false,
            msgOk: "What rhythm do you see?",
            msgKo: "Assess the cardiac rhythm!",
            callFunc: {
                stopCPR: null,
                setECG: this.ecgPatterns[initialRhythm] || "'VF.gif', 0",
                setBP: "0, 0",
                setO2: "75"
            },
            quiz: {
                a: "Ventricular Fibrillation",
                b: "Ventricular Tachycardia", 
                c: "Asystole",
                d: "PEA"
            }
        };
        this.stepCounter++;
        
        // Treatment based on rhythm
        if (initialRhythm === 'VF' || initialRhythm === 'VT') {
            this.addShockableRhythmSteps(steps);
        } else {
            this.addNonShockableRhythmSteps(steps);
        }
    }
    
    addShockableRhythmSteps(steps) {
        // Defibrillation
        steps[this.stepCounter] = {
            action: "defibrillation",
            msgOk: "Shock delivered. What next?",
            msgKo: "This rhythm requires defibrillation!",
            callFunc: {
                defibrillation: null
            }
        };
        this.stepCounter++;
        
        // Resume CPR
        steps[this.stepCounter] = {
            action: "startCPR",
            msgOk: "CPR resumed. What should you do during CPR?",
            msgKo: "Resume CPR immediately after the shock!",
            callFunc: {
                startCPR: null
            }
        };
        this.stepCounter++;
        
        // Medications after 3rd shock
        steps[this.stepCounter] = {
            give: ["adrenaline", "amiodarone"],
            allrequest: true,
            msgOk: "Medications administered. Continue CPR and reassess.",
            msgKo: "After the third shock, give epinephrine and amiodarone!"
        };
        this.stepCounter++;
        
        // ROSC
        this.addROSCSteps(steps);
    }
    
    addNonShockableRhythmSteps(steps) {
        // CPR for non-shockable
        steps[this.stepCounter] = {
            action: "startCPR",
            msgOk: "CPR continued. What medication should you give?",
            msgKo: "Continue CPR for non-shockable rhythms!",
            callFunc: {
                startCPR: null
            }
        };
        this.stepCounter++;
        
        // Epinephrine
        steps[this.stepCounter] = {
            give: "adrenaline",
            msgOk: "Epinephrine given. Continue CPR and look for reversible causes.",
            msgKo: "Give epinephrine for non-shockable rhythms!"
        };
        this.stepCounter++;
        
        this.addROSCSteps(steps);
    }
    
    addROSCSteps(steps) {
        // Check for ROSC
        steps[this.stepCounter] = {
            action: "ecg",
            msgOk: "The rhythm has changed. How do you confirm ROSC?",
            msgKo: "Check the rhythm again!",
            callFunc: {
                stopCPR: null,
                setECG: "'SR.gif', 90",
                setBP: "100, 60",
                setO2: "95"
            }
        };
        this.stepCounter++;
        
        // Pulse check
        steps[this.stepCounter] = {
            action: "pulseCheck",
            msgOk: "Pulse present! ROSC achieved. Transport to hospital. End of simulation.",
            msgKo: "Check for a pulse to confirm ROSC!"
        };
    }
    
    addSTEMISteps(steps) {
        // Oxygen for low saturation
        steps[this.stepCounter] = {
            give: "oxygen",
            msgOk: "Oxygen administered. The patient complains of chest pain.",
            msgKo: "The patient's oxygen saturation is low!",
            callFunc: {
                setO2: "95"
            }
        };
        this.stepCounter++;
        
        // Pain management
        steps[this.stepCounter] = {
            give: ["morphine", "nitrospray"],
            allrequest: true,
            msgOk: "Pain relieved. What immediate treatment does this patient need?",
            msgKo: "Treat the patient's pain!",
            quiz: {
                a: "Emergency catheterization and metoprolol",
                b: "Aspirin, heparin, emergent catheterization",
                c: "Aspirin and rtPA",
                d: "Atorvastatin and nitrospray"
            }
        };
        this.stepCounter++;
        
        // Final step
        steps[this.stepCounter] = {
            choose: "b",
            msgOk: "Correct! Patient prepared for cardiac catheterization. End of simulation.",
            msgKo: "This patient needs immediate cardiac catheterization!"
        };
    }
    
    addChokingSteps(steps) {
        // Heimlich maneuver
        steps[this.stepCounter] = {
            action: "heimlichManeuver",
            msgOk: "Abdominal thrusts performed. Patient becomes unconscious.",
            msgKo: "Perform the Heimlich maneuver!"
        };
        this.stepCounter++;
        
        // Airway check
        steps[this.stepCounter] = {
            action: "airwayCheck",
            msgOk: "No visible obstruction. Patient not breathing.",
            msgKo: "Check the airway for obstructions!"
        };
        this.stepCounter++;
        
        // CPR for unconscious choking
        steps[this.stepCounter] = {
            action: "startCPR",
            msgOk: "CPR started. Emergency team arrives. Get monitoring.",
            msgKo: "Start CPR for unconscious choking victim!",
            callFunc: {
                startCPR: "'bls'"
            }
        };
        this.stepCounter++;
        
        this.addROSCSteps(steps);
    }
    
    addTraumaSteps(steps) {
        // IV access
        steps[this.stepCounter] = {
            action: "venousAccess",
            msgOk: "IV access obtained. Patient complains of increasing pain.",
            msgKo: "Establish IV access for fluid resuscitation!",
            callFunc: {
                setLabors: "[['Blood sugar', 5.7, 'mmol/l']]",
                setO2: "98",
                setTemp: "35.7"
            }
        };
        this.stepCounter++;
        
        // Pain management and bleeding control
        steps[this.stepCounter] = {
            give: ["fentanyl", "tranexam"],
            allrequest: true,
            msgOk: "Pain controlled and bleeding management initiated.",
            msgKo: "Provide pain relief and control bleeding!"
        };
        this.stepCounter++;
        
        // Final stabilization
        steps[this.stepCounter] = {
            action: "warming",
            msgOk: "Patient stabilized. Prepare for transport to trauma center. End of simulation.",
            msgKo: "Prevent hypothermia in trauma patients!"
        };
    }
    
    generateVitalSigns(rhythm) {
        const vitalSigns = {
            stopCPR: null,
            setBP: "120, 80",
            setO2: "98"
        };
        
        if (rhythm) {
            vitalSigns.setECG = this.ecgPatterns[rhythm] || "'SR.gif', 90";
        }
        
        return vitalSigns;
    }
    
    displayScenario(scenario) {
        const preview = document.getElementById('scenarioPreview');
        const output = document.getElementById('scenarioOutput');
        const copyBtn = document.getElementById('copyBtn');
        
        // Create preview
        const key = Object.keys(scenario)[0];
        const data = scenario[key];
        let previewHTML = `<div class="step-preview">
            <strong>Title:</strong> ${data.title}<br>
            <strong>Description:</strong> ${data.description}<br>
            <strong>Total Steps:</strong> ${Object.keys(data.steps).length}
        </div>`;
        
        preview.innerHTML = previewHTML;
        
        // Display JSON
        output.textContent = JSON.stringify(scenario, null, 2);
        copyBtn.style.display = 'block';
    }
}

// Initialize generator
const generator = new ScenarioGenerator();

function generateScenario() {
    generator.generateScenario();
}

function copyToClipboard() {
    const output = document.getElementById('scenarioOutput');
    navigator.clipboard.writeText(output.textContent).then(() => {
        const copyBtn = document.getElementById('copyBtn');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('btn-success');
        copyBtn.classList.remove('btn-primary');
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.classList.remove('btn-success');
            copyBtn.classList.add('btn-primary');
        }, 2000);
    });
}
