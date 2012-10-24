var queryURL;
var rawCommentArray = [];
var currentPlot;
var userName;
var currentlyQuerying = false;
var graphDisplayed = false;
var extremeValues = {};

var currentType = "ScatterPlot";
var currentData = "Length";

var currentlyUpdating = false;
var updateAgain = false;
var lastSlide = 0;

var rx = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?)/


//formats and starts a query is one isn't currently running
function startQuery(){
	updateInfo("starting query");
	if (!currentlyQuerying){
		currentPlot = null;
		currentlyQuerying = true;
		rawCommentArray = [];
		userName = graphDisplayed ? $("#secoundTextBox").val() : $("#firstTextBox").val();
		updateInfo("trying history.pushState");
		history.pushState({}, userName + "'s redditgraphs", window.location.pathname+"?"+userName);
		updateInfo("history.pushState worked");
		queryURL = 'http://www.reddit.com/user/' + userName + '/comments/.json?jsonp=?&limit=100&';
		queryReddit("", 0);
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
	if (count == 0 && result.data.children.length == 0){
		updateInfo("User has no comment history - try another name");
		currentlyQuerying = false;
	}

	if (!graphDisplayed){
		displayGraph();
	}
	for (var i = 0; i < result.data.children.length; i++){
		rawCommentArray.push(result.data.children[i].data);
		rawCommentArray[rawCommentArray.length-1].Length = commentLength(rawCommentArray[rawCommentArray.length-1].body);
		rawCommentArray[rawCommentArray.length-1].ReadingLevel = commentReadingLevel(rawCommentArray[rawCommentArray.length-1].body);
	}

	extremeValues = findExtremeValues(rawCommentArray);
	createSlider("#karma", function(x){return x;}, extremeValues.minKarma, extremeValues.maxKarma);
	createSlider("#length", function(x){return x;}, extremeValues.minLength, extremeValues.maxLength);
	createSlider("#date", intToDateStr, extremeValues.minDate, extremeValues.maxDate);

	updateInfo(count + " comments found");

	if (result.data.after && count<40000){
		queryReddit(result.data.after, count+100);
	}
	else {
		currentlyQuerying = false;
	}

	updateGraph();
}

//formats and graphs raw data from reddit
function updateGraph(){
	if (userName != $("#secoundTextBox").val()){
		console.log("CurrentPlot exists and user names do not match");
		startQuery();
	}
	else if (rawCommentArray.length == 0){
		updateInfo("No info to graph - try another user name");
	}
	else{
		currentlyUpdating = true;
		updateAgain - false;
		currentPlot = {};
		currentPlot = new CreateCurrentPlot("Time", currentData,currentType);
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

function changeSelectedType(newType){
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
	updateGraphQueue();
}

$("#ScatterPlot").click(function(){changeSelectedType("ScatterPlot");});
$("#PieChart").click(function(){changeSelectedType("PieChart");});
$("#Histograph").click(function(){changeSelectedType("Histograph");});
$("#Histogram").click(function(){changeSelectedType("Histogram");});

function changeSelectedData(newData){
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
}

$("#Karma").click(function(){changeSelectedData("Karma");});
$("#Length").click(function(){changeSelectedData("Length");});
$("#Number").click(function(){changeSelectedData("Number");});
$("#ReadingLevel").click(function(){changeSelectedData("ReadingLevel");});
$("#Hourly").click(function(){changeSelectedData("Hourly");});
$("#Weekly").click(function(){changeSelectedData("Weekly");});

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
		console.log("sliiide");
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
	if (window.location.search.substr(1).length>0 && window.location.search.substr(1) != userName){
		document.getElementById("secoundTextBox").value = window.location.search.substr(1);
		document.getElementById("firstTextBox").value = window.location.search.substr(1);		
		startQuery();
	}
}