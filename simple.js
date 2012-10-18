var queryURL;

var rawCommentArray = [];
var currentPlot;
var userName;
var currentlyQuerying = false;

var graphDisplayed = false;
var lastItem;

function startQuery(){
	if (!currentlyQuerying){
		currentPlot = null;
		currentlyQuerying = true;
		rawCommentArray = [];
		userName = graphDisplayed ? $("#secoundTextBox").val() : $("#firstTextBox").val();
		queryURL = 'http://www.reddit.com/user/' + userName + '/comments/.json?jsonp=?&limit=100&';
		queryReddit("", 0);
	}
	else {
		console.log("can't run two querys at once");
	}
}

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
	}, 3000);
}

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
	}

	updateInfo(count + " comments found");

	if (result.data.after && count<4000){
		queryReddit(result.data.after, count+100);
	}
	else {
		currentlyQuerying = false;
	}

	updateGraph();
}

function updateGraph(){
	updateInfo("Drawing Graph");
	if (userName != $("#secoundTextBox").val()){
		console.log("CurrentPlot exists and user names do not match");
		startQuery();
	}
	else if (rawCommentArray.length == 0){
		updateInfo("No info to graph - try another user name");
	}
	else{
		currentPlot = {};

		currentPlot = new CreateCurrentPlot("Time", $("#graphData").val(),$("#graphType").val());
		currentPlot.drawGraph();
		resizeElements();	
		updateInfo("Graph completed with " + rawCommentArray.length + " comments (max of 1000).")
	}
}

//called first time query is successful; shows graph and settings
function displayGraph(){
	$('.hidden').css({"visibility":"visible"});
	$('#commentDL').css({"visibility":"hidden","height":"0px"});
	document.getElementById("secoundTextBox").value = value = $("#firstTextBox").val();
	var inputs = ["graphType", "graphData", "minKaram", "maxKarma", "minLength", "maxLength", "minDate", "maxDate"];
	for (var id in inputs){
		if (inputs.hasOwnProperty(id)) {
			$("#"+inputs[id]).bind("input", function() {updateGraph()});
		}
	}

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
}