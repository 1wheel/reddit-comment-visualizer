var queryURL;
var rawCommentArray = [];
var currentPlot;
var userName;
var currentlyQuerying = false;
var graphDisplayed = false;
var extremeValues = {};

var currentType = "ScatterPlot";
var currentData = "Hourly";
var karmaLog = false;
var lengthLog = false;
var comments = true;
var commentsQueried;
disableImg("#PieChart");
disableImg("#Histograph");

var currentlyUpdating = false;
var updateAgain = false;
var lastSlide = 0;

var rx = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?)/

//formats and starts a query is one isn't currently running
function startQuery(){
	updateInfo("starting query");
	if (!currentlyQuerying){		

		currentPlot = null;
		rawCommentArray = [];
		commentsQueried = comments;

		userName = graphDisplayed ? $("#secoundTextBox").val() : $("#firstTextBox").val();
		var savedInfo = localStorage[userName+commentsQueried];

		if (savedInfo && JSON.parse(savedInfo).time + 30*60*1000 > Date.now()){
			rawCommentArray = JSON.parse(savedInfo).rawCommentArray;
			updateInfo("Cached Comments Loaded");
			if (!graphDisplayed){
				displayGraph();
			}
			createSliders();
			updateGraph();
		}
		else {	
			currentlyQuerying = true;
			queryURL = 'http://www.reddit.com/user/' + userName + '/'+ (commentsQueried ? 'comments' : 'submitted')
						+ '/.json?jsonp=?&limit=100&';
			queryReddit("", 0);
		}
	}
	else {
		console.log("can't run two querys at once");
	}
}

//looks up next 100 comments
function queryReddit(after, count){
	updateInfo("searching reddit...");
	$.getJSON(queryURL, {
		'after':after,
		'count':count
	}, function(data) {
		logResult(data, count);
	});

	setTimeout(function() {
		if (rawCommentArray.length == 0 && $("#info").html() == "searching reddit..."){
		 	updateInfo("No response from reddit - either the username is incorrect or servers are down");
		 	currentlyQuerying = false;
		}
	}, 4000);
}

//called after every batch of comments is downloaded; calls queryReddit if there are more comments
function logResult( result, count){
	console.log(result);
	if (count == 0 && result.data.children.length == 0){
		updateInfo("User has no comment history - try another name");
		currentlyQuerying = false;
	}

	if (!graphDisplayed){
		displayGraph();
	}

	for (var i = 0; i < result.data.children.length; i++){
		rawCommentArray.push(result.data.children[i].data);
		if (!commentsQueried){
			rawCommentArray[rawCommentArray.length-1].body = rawCommentArray[rawCommentArray.length-1].title;
			if(rawCommentArray[rawCommentArray.length-1].selftext.length>0){

			}
			rawCommentArray[rawCommentArray.length-1].body_html = (rawCommentArray[rawCommentArray.length-1].selftext.length>0) ?
			rawCommentArray[rawCommentArray.length-1].selftext_html : rawCommentArray[rawCommentArray.length-1].url;
			rawCommentArray[rawCommentArray.length-1].link_title = rawCommentArray[rawCommentArray.length-1].title;
		}
		rawCommentArray[rawCommentArray.length-1].Length = commentLength(rawCommentArray[rawCommentArray.length-1].body);
		rawCommentArray[rawCommentArray.length-1].ReadingLevel = commentReadingLevel(rawCommentArray[rawCommentArray.length-1].body);
	}

	updateInfo(count + " comments found");

	createSliders();

	if (result.data.after && count<40000){
		queryReddit(result.data.after, count+100);
	}
	else {
		try{
			localStorage.removeItem(userName+commentsQueried);
			console.log(userName+commentsQueried);
			localStorage[userName+commentsQueried] = JSON.stringify({time:Date.now(), rawCommentArray: rawCommentArray});
			console.log("successful save");
		}
		catch(e){
			console.log(e);
			localStorage.clear();
		}
		currentlyQuerying = false;
	}

	updateGraph();
}

//formats and graphs raw data from reddit
function updateGraph(){
	if (userName != $("#secoundTextBox").val()  || comments != commentsQueried){
		console.log("CurrentPlot exists and user names or data type do not match");
		startQuery();
	}
	else if (rawCommentArray.length == 0){
		console.log("No user info");
	}
	else{
		currentlyUpdating = true;
		var URLsearch = "?"+userName+"&"+currentType+"&"+currentData;
		if (URLsearch != window.location.search){
			history.pushState({}, userName + "'s redditgraphs",window.location.pathname + URLsearch);
		}
		updateAgain - false;
		currentPlot = {};
		currentPlot = new CreateCurrentPlot("Time", currentData, currentType, checkLog(), commentsQueried);
		currentPlot.drawGraph();
		resizeElements();	
		if(!currentlyQuerying){
			var infoString = "";
			infoString = infoString + "Graph completed with " + currentPlot.points.length + " of " + rawCommentArray.length + " possible comments used";
			infoString += (rawCommentArray.length > 999 ) ? " (a max of 1000 comments can be downloaded from reddit)." : ".";
			updateInfo(infoString);
		}
		if (updateAgain){
			"setTimeout(updateGraph(),50)";
		}
		currentlyUpdating = false;
	}
}

function createSliders(){
	extremeValues = findExtremeValues(rawCommentArray);
	createSlider("#karma", function(x){return x;}, extremeValues.minKarma, extremeValues.maxKarma);
	createSlider("#length", function(x){return x;}, extremeValues.minLength, extremeValues.maxLength);
	createSlider("#date", intToDateStr, extremeValues.minDate, extremeValues.maxDate);
}

//called first time query is successful; shows graph and settings while hidding the initial title
function displayGraph(){
	$('.hidden').css({"visibility":"visible"});
	$('#commentDL').css({"visibility":"hidden","height":"0px","padding-top":"0px"});
	document.getElementById("secoundTextBox").value = $("#firstTextBox").val();

	graphDisplayed = true;
}

//changes css so different containers line up with each other
function resizeElements(){
	$('#settingsContainer').css({"top":$("#graphTitle").height()+10+"px"});
	$('#commentTextContainer').css({"top":$("#graphTitle").height()+10+"px"});
}

//stops enter keystroke from reloading page
$("#userNameForm").submit(function(e){
	e.preventDefault();
	console.log("enter pressed");
    return false;
});

$("#userNameForm2").submit(function(e){
	e.preventDefault();
	console.log("enter pressed");
    return false;
});

$(window).resize(function() {
	if (currentPlot){
		currentPlot.drawGraph();
	}
	resizeElements();
	console.log("page resized");
});

function updateInfo(str){
	$("#info").html(str);
	$("#info2").html(str);
	//console.log(str);
}

function createSlider(name, prnt, min, max){
	$(name+"Slider").unbind("change");
    $(name+"Slider").slider({
        range: true,
        min: min,
        max: max,
        values: [min, max],
        step: 1,
        slide: function( event, ui ) {
            $(name+"Range").text(" " + prnt(ui.values[0]) + " to " + prnt(ui.values[1]));
            updateSliderQueue();
        }
    });
    $(name+"Range").text(prnt(min) + " to " + prnt(max));
}

function intToDateStr(int){
    var date = new Date(int);
    return "" + (date.getMonth()+1)+ "/" + date.getDate() + "/" + date.getFullYear();
}

function disableImg(id){
	$(id).removeClass("graphimg");
	$(id).addClass("disabledgraphimg");	
}

function enableImg(id){
	$(id).removeClass("disabledgraphimg");
	$(id).addClass("graphimg");	
}

$("#logKarma").button();
$("#logKarma").click(function(){
								karmaLog = !karmaLog;
								updateGraphQueue();});

$("#logLength").button();
$("#logLength").click(function(){
								lengthLog = !lengthLog;
								updateGraphQueue();});

$("#commentsRadio").buttonset();
$("#commentsRadio").click(function(){
								comments = document.getElementById("radio1").checked;
								updateGraphQueue();});

function fixLogButtons(){		
	$("#LengthLogBox").hide();
	$("#KarmaLogBox").hide();

	if (currentType == "ScatterPlot" || currentType == "Histogram"){
		if (currentData == "Karma"){
			$("#KarmaLogBox").show();
		}
		if (currentData == "Length"){
			$("#LengthLogBox").show();
		}
	}
}

function checkLog () {
	if (currentType == "ScatterPlot" || currentType == "Histogram"){
		return ((currentData=="Karma" && karmaLog)||(currentData=="Length"&&lengthLog))
	}
	return false;
}

function changeSelectedType(newType, redraw){
	console.log(newType);
	$("#" + currentType).removeClass("selected");	
	$("#" + newType).addClass("selected");
	currentType = newType;

	if ((currentType == "PieChart") || currentType == "Histograph"){
		disableImg("#Hourly");
		disableImg("#Weekly");
	}
	else {
		enableImg("#Hourly");
		enableImg("#Weekly");
	}
	if (redraw){
		updateGraphQueue();
	}
	fixLogButtons();
}

$("#ScatterPlot").click(function(){changeSelectedType("ScatterPlot",true);});
$("#PieChart").click(function(){changeSelectedType("PieChart",true);});
$("#Histograph").click(function(){changeSelectedType("Histograph",true);});
$("#Histogram").click(function(){changeSelectedType("Histogram",true);});

function changeSelectedData(newData, redraw){
	console.log(newData);
	$("#" + currentData).removeClass("selected");	
	$("#" + newData).addClass("selected");
	currentData = newData;
	updateGraphQueue();

	if ((currentData == "Hourly") || currentData == "Weekly"){
		disableImg("#PieChart");
		disableImg("#Histograph");
	}
	else {
		enableImg("#PieChart");
		enableImg("#Histograph");
	}
	if (redraw){
		updateGraphQueue();
	}
	fixLogButtons();
}

$("#Karma").click(function(){changeSelectedData("Karma",true);});
$("#Length").click(function(){changeSelectedData("Length",true);});
$("#Number").click(function(){changeSelectedData("Number",true);});
$("#ReadingLevel").click(function(){changeSelectedData("ReadingLevel",true);});
$("#Hourly").click(function(){changeSelectedData("Hourly",true);});
$("#Weekly").click(function(){changeSelectedData("Weekly",true);});

function updateGraphQueue(){
	//if ($("#"+currentData).hasClass("graphimg") 
		if (currentlyUpdating){
			updateAgain = true;
		}
		else {
			currentlyUpdating = true;
			setTimeout("updateGraph()",100);
		}
}

function updateSliderQueue(){
	lastSlide = new Date().getTime();
	setTimeout("checkSliderRefesh()",100);
}

function checkSliderRefesh(){
	var currentTime = new Date().getTime();
	if (80 < currentTime - lastSlide) {
		console.log("slider update allowed");
		updateGraphQueue();
	}
	else{
		console.log("too soon to slide");
	}
}

window.onpopstate = function(event){
	console.log(event);
	window.onload();
};

window.onload = function(){
	console.log("page loaded");
	if (window.location.search.substr(1).length>0){
		var parameters = window.location.search.substr(1).split("&");
		var newData = "";
		var newType = "";
		var newUserName = "";
		updateGraphRequired = false;
		updateUserNameRequired = false;

		//this won't work for usernames that match data or graph types
		for (var i = 0; i < parameters.length; i++){
			if ((parameters[i] == "ScatterPlot" || parameters[i] == "Histograph") || (parameters[i] == "PieChart" || parameters[i] == "Histogram")){
				if (currentType != parameters[i]){
					changeSelectedType(parameters[i],false);
					updateGraphRequired = true;
					console.log(parameters[i]);

				}
			}
			else if ((parameters[i] == "Karma" || parameters[i] == "Length") || ((parameters[i] == "Number" || parameters[i] == "ReadingLevel") || (parameters[i] == "Hourly" || parameters[i] == "Weekly"))) {
				if (currentData != parameters[i]){
					changeSelectedData(parameters[i],false);
					updateGraphRequired = true;
					console.log(parameters[i]);
				}
			}
			//else if (parameters[i] == "Comments" || parameters[i] == "Submissions"){}
			else {
				if (userName != parameters[i]){
					userName = parameters[i];
					updateUserNameRequired = true;
					console.log(parameters[i]);
				}
			}  
		}

		if (updateUserNameRequired){
			document.getElementById("secoundTextBox").value = userName;
			document.getElementById("firstTextBox").value = userName;	
			console.log("query start");
			setTimeout("startQuery()",100);
		}
		else if (updateGraphRequired){
			console.log("graph updated");
			updateGraphQueue();
		}
	}
}

function showfaq(){
	$(function() {

        $( "#faq" ).dialog(
        	{title: "FAQ",
        	minWidth:600,
        	position: [230,70]}
        );
    });
}