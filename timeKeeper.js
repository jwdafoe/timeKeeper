"use strict";

//JQUERY EVENT HANDLERS
$(document).ready(function() {
	$("#taskForm").on("submit", startTask);
	$("#resetBtn").on("click", activityManager.activityLog.clearAll);
	$("#stopBtn").on("click", function(e) {
		activityManager.activityLog.endActivity();
	});
	$("#help").on("click", function(e) {
		$("#definitions").slideToggle();
		$("#help").text($("#help").html() === 'Help' ? 'hide' : 'Help');
	});
});

//ALL PRIMARY FUNCTIONS ARE DECLARED IN THIS SECTION
function startTask() {
	//GET THE VALUES FOR THE FORM INPUTS
	const code = document.getElementById('codeSelect').value;
	const account = document.getElementById('account').value;
	const notes = document.getElementById('notes').value;
	if (!account || !notes) { //VALIDATE THAT AN ACCOUNT AND NOTES WERE ENTERED
		alert('You must enter both an Account name & Comments.');
	} else {
		activityManager.activityLog.startActivity(code, account, notes);
	}
}

function buildListItem(code, account, notes, started, total=0) { //FACTORY FOR BUILDING A TASK AS A 'LI' ELEMENT
	const item = document.createElement('li'); //CREATE THE LIST ITEM
	item.classList.add('list-group-item');
	item.innerHTML = `${code} - ${account}: ${notes} <strong>| ${total.toFixed(2)} hrs</strong>`;

	return item;
}

const activityManager = (function() {
	var active = localStorage.getItem("activetask") ? JSON.parse(localStorage.getItem("activetask")) : null; //VARIABLE TO HOLD THE ACTIVE TASK 'CODEACCT' FOR FUTURE REFERENCE
	function restoreMap() { //RE-CREATE START DATE OBJECT WHEN RESTORING FROM LOCALSTORAGE STRINGIFICATION
		const map = JSON.parse(localStorage.getItem("tasklog"));
		map[active].start = new Date(map[active].start);
		return map;
	}
		
	class Log {
		constructor() {
			this.activityMap = localStorage.getItem("tasklog") ? restoreMap() : {};
			//this.active = localStorage.getItem("activetask") ? JSON.parse(localStorage.getItem("activetask")) : null; //VARIABLE TO HOLD THE ACTIVE TASK 'CODEACCT' FOR FUTURE REFERENCE
		}
		
		startActivity(code, account, notes) {
			this.endActivity(); //END ANY EXISTING ACTIVITY AND RECORD TOTALS
			active = code + account; //UPDATE THE ACTIVE VARIABLE TO HOLD THIS NEW TASK
			if (this.activityMap[code + account]) {
				this.activityMap[code + account].start = new Date();
				this.activityMap[code + account].notes += ';\n' + notes;
				//manageActiveUI.display({code: code, account: account, notes: notes, start: this.activityMap[code + account].start})
			} else {
				this.activityMap[code + account] = new Task(code, account, notes);
				//manageActiveUI.display(this.activityMap[code + account]);
			}
			manageActiveUI.display({code: code, account: account, notes: notes, start: this.getActivity(code + account).start});
			manageForm.resetForm();
			this.backup();
		}
		
		getActivity(codeAcct) {
			return this.activityMap[codeAcct];
		}
		
		endActivity() { //CALCULATES ELAPSED TIME IN HOURS FOR THE SPECIFIED TASK OBJECT
			if (active) { //TEST THE ACTIVE VARIABLE FOR AN EXISTING TASK
				this.activityMap[active].end = new Date();
				this.activityMap[active].total += (this.activityMap[active].end - this.activityMap[active].start)/(1000*60*60);
				manageSummaryUI.display(this.activityMap);
				manageActiveUI.clear(); //CLEAR THIS UI ELEMENT; IT WILL BE REPOPULATED IF A NEW TASK IS STARTED
			} else {
				console.log('Nothing was active');
			}			
		}
		
		backup() {
			localStorage.setItem("tasklog", JSON.stringify(this.activityMap));
			localStorage.setItem("activetask", JSON.stringify(active));
		}
		
		clearAll() {
			if (confirm("This action will clear the Task Log & reset all Totals to zero.")) {
				localStorage.removeItem("tasklog");
				localStorage.removeItem("activetask");
				document.location.reload();
			}
			else {console.log('User cancelled');}
		}
	}
	
	return {
		activityLog: new Log()
	}
})();

//THIS SECTIONS CONTAINS THE MODULES THAT MANAGE THE UI
const manageForm = (function() { //INSTANTIATE A MODULE FOR MANAGING THE FORM & IMMEDIATELY INVOKE
	const codes = [ //ARRAY OF CODE OBJECTS FOR SELECT ELEMENT
				{name: 'CSD1', description: 'Customer Support', definition: 'To be used for all time spent in front of your customers'},
				{name: 'CSD2', description: 'Administrative Tasks', optDefault: true, definition: 'To be used to track and report all administrative time: Compliance Training/Time Entry/Performance Review/Manager One on One etc.'},
				{name: 'CSD4', description: 'Sales Support', definition: 'To be used for time spent helping the Sales organization respond/present in RFPs; participate in orals; general support for sales work.'},
				{name: 'CSD5', description: 'Internal Delivery Management', definition: 'Working with CC teams to provide support to the customer: Reviewing SLAs/Working with Service Lines for Support/Red Teams/Watchlist, staffing, etc.'},
				{name: 'CSD6', description: 'CE Duties', definition: 'Preparing and/or Submitting Billing/Revenue Forecasting/When you are actually dual hatted and doing All the CE functions/SFDC Entries/Deal Reviews'},
				{name: 'CSD7', description: 'Financial Support', definition: 'To be used for all time spent reviewing P&Ls/COPQ/DPA/Financial reporting/ financial analysis/profitibilty meetings/financial watchlist participation/building cost savings plans'},
				{name: 'Q2204-38728', description: 'Air Products - ISE Upgrade Project Q2204-38728', definition: 'APCI'},
				{name: 'Q2108-34895', description: 'CCHS - Christiana Renewal Q2108-34895', definition: 'CCHS'},
				{name: 'Q1905-17031', description: 'OD - Student Transportation-Infrastructure Modernization Lifecycle - Q1905-17031', definition: 'STA'},
				{name: 'Q2208-40208', description: 'Organon & CO - 2023 Data Center renewal Q2208-40208', definition: 'Organon'},
				{name: 'Q1908-19344', description: 'Alabama Agricultural and Mechanical University - WiFi for Dorms Q1908-19344', definition: 'AAMU'}
			];
	const select = document.getElementById('codeSelect'); //REFERENCE THE SELECT ELEMENT FOR THE CODES
	const account = document.getElementById('account'); //REFERENCE THE ACCOUNT INPUT ELEMENT
	const definitions = document.getElementById('definitions'); //REFERENCE THE DEFINITIONS ELEMENT
	(function loadSelect() { //POPULATES THE SELECT ELEMENT WITH ALL OF THE CODES
		codes.forEach(function(code) {
			const opt = document.createElement('option');
			opt.value = code.name;
			opt.innerHTML = code.name + ' - ' + code.description;
			opt.selected = code.optDefault; //SET ELEMENT TO THIS OPTION IF IT HAS 'optDefault' PROPERTY
			select.appendChild(opt);
		})
	})();
	(function loadHelp() { //POPULATES THE HELP/DEFINITIONS ELEMENT
		codes.forEach(function(code) {
			const p = document.createElement('p');
			const h6 = document.createElement('h6');
			h6.textContent = code.name + ' - ' + code.description;
			p.appendChild(h6);
			p.appendChild(document.createTextNode(code.definition));				
			definitions.appendChild(p); //APPEND TO THE DEFINITIONS ELEMENT
		})
		definitions.style.display = 'none'; //HIDE THE ELEMENT INITIALLY
	})();
	function resetForm() { //RESET THE FORM INPUT FIELDS
		select.selectedIndex = 1; //SET 'CSD2' AS THE DEFAULT SELECTION
		account.value = 'Compucom'; //'COMPUCOM' IS DEFAULT ACCOUNT NAME FOR 'CSD2' CODE
		document.getElementById('notes').value = null;
		document.getElementById('notes').focus();
	}
	resetForm();
	
	return {
		checkSelect: function() { //INITIATED WHEN A SELECT OPTION IS SELECTED
			const code = select.value;
			account.value = code === 'CSD2' ? 'Compucom' : null; //IF 'CSD2' IS SELECTED, THEN SET ACCOUNT TO 'Compucom'
		},		
		resetForm: resetForm,
/*		toggleDefinitions: function() {
			const help = document.getElementById('help'); //REFERENCE THE HELP 'A' ELEMENT
			if (definitions.style.display === 'block') { //TEST IF DEFINITIONS DIV IS CURRENTLY DISPLAYED
				definitions.style.display = 'none';
				help.textContent = 'Help';
			} else {
				definitions.style.display = 'block';
				help.textContent = 'hide';
			}
		}
*/
	}
})();

const manageActiveUI = (function() { //INSTANTIATE A MODULE TO MANAGE THE ACTIVE TASK & INVOKE IMMEDIATELY
	const activeTask = localStorage.getItem("activetask") ? activityManager.activityLog.activityMap[JSON.parse(localStorage.getItem("activetask"))] : null;
	const runningTask = document.getElementById('runningTasks'); //GET A REFERENCE TO THE ELEMENT IN THE DOM

	function display(activeObj=activeTask) { //UPDATES THE TASK LOG ELEMENT FOR THE CURRENT/ACTIVE TASK
		if (activeObj) { //ONLY RUN IF THERE IS AN ACTIVE TASK PRESENT
			//runningTask.replaceChildren(buildListItem(activeObj.code, activeObj.account, activeObj.notes, activeObj.start));
			runningTask.innerHTML = `<strong>${activeObj.code} - ${activeObj.account}</strong><br> ${activeObj.notes} started @${activeObj.start.toLocaleString()}`;
		}
	}
	display();
	
	return {
		display: display,
		clear: function() {
			runningTask.innerHTML = '';
		}
	}
})();

const manageSummaryUI = (function() {
	const taskLog = localStorage.getItem("tasklog") ? JSON.parse(localStorage.getItem("tasklog")) : new Object();
	const summary = document.getElementById('todaysTotals'); //REFERENCE THE UL ELEMENT
	const displayTotal = document.getElementById('totaltime'); //REFERENCE THE DISPLAYED TOTAL ELEMENT

	function display(logObj=taskLog) { //BUILDS & DISPLAYS THE 'TODAY' SUMMARY
		let totalTime = 0; //CREATE VARIABLE TO HOLD THE TOTAL TIME
		while (summary.firstChild) { //CLEAR OUT ANY EXISTING ENTRIES IN THE SUMMARY ELEMENT
			summary.removeChild(summary.firstChild);
		}
		for (let codeAcct of Object.keys(logObj).sort()) { //PROCESS THE LOG OBJECT TO POPULATE THE 'TODAY' LIST
			const code = logObj[codeAcct].code;
			const acct = logObj[codeAcct].account;
			const notes = logObj[codeAcct].notes;
			const total = logObj[codeAcct].total;
			if (total) { //DON'T UPDATE THE TOTAL VARIABLE IF NaN
				totalTime += total
			}
			summary.appendChild(buildListItem(code, acct, notes, null, total));
		}
		displayTotal.textContent = 'Today:  '  + totalTime.toFixed(2) + ' hrs';
	}
	display();
		
	return {
		display: display,
	}
})();

class Task{ //FACTORY FOR BUILDING A NEW TASK OBJECT
	constructor(code, account, notes) {
		this.code = code;
		this.account = account;
		this.notes = notes;
		this.start = new Date();
		this.end = null; //PLACEHOLDER FOR RECORDING THE ENDING TIME
		this.total = 0; //PLACEHOLDER TO STORE THE TOTAL ELAPSED TIME
		this.codeAcct = code + account;
	}
}

//MAIN EXECUTION BEGINS HERE
document.getElementById('pageTitle').innerHTML += 'v2.0'; //ADD THE VERSION NUMBER TO THE TITLE
