//this function is called to create a graph; it is a bit of a mess right now
function CreateCurrentPlot(x, y, type, log, sub){
	console.log("updating plot");
	this.type = type;
	this.points = [];							//points to graph
	this.subredditPoints = {};					//points grouped by subredit
	this.subredditSums = [];					//sorted array by total points of {label: subreddit, data: sum}
	this.r = new createRestrictionFilter();		//filter for comments
	this.rawCommentSubredditIndex = {};			//stores orginal index of comment before filtering and grouping by subreddit
	this.rawFilteredComments = [];				//stores entirety of comment responce
	this.rawFilteredSubredditComments = {};		//stores entirety of comment responce grouped by subreddit
	this.graphTitle = " ";

	this.dayORweek = (y == "Hourly" || y == "Weekly");
	if (type=="ScatterPlot" || type =="Histogram"){
		if(y == "Hourly"){
			console.log("Changing to Hourly and number");
			x = "Hourly";
			y = "NumberHourly";
		}
		else if (y == "Weekly"){
			x = "Weekly";
			y = "NumberWeekly";
		}
	}

	if (this.dayORweek || y == "ReadingLevel" || y == "Number"){
		log = false;
	}

	//finds all comments that match filter
	var cSubreddit;
	for (var i = 0; i < rawCommentArray.length; i++){	
		if (!this.r.isFiltered(rawCommentArray[i])){			
			cSubreddit = rawCommentArray[i].subreddit;

			this.rawCommentSubredditIndex[cSubreddit] = (this.rawCommentSubredditIndex[cSubreddit]) ?
				this.rawCommentSubredditIndex[cSubreddit] : [];
			this.rawCommentSubredditIndex[cSubreddit].push(i);

			this.rawFilteredComments.push(rawCommentArray[i]);

			this.rawFilteredSubredditComments[cSubreddit] = (this.rawFilteredSubredditComments[cSubreddit]) ?
				this.rawFilteredSubredditComments[cSubreddit] : [];
			this.rawFilteredSubredditComments[cSubreddit].push(rawCommentArray[i])
		}
	}

	//iterates over list of valid comments, finds their max and min time and saves time to this.points
	this.maxTime = 0;
	this.minTime = Date.now;
	for (var i = 0; i < this.rawFilteredComments.length; i++){
		this.points.push([findDataPoint(x, i, this.rawFilteredComments)]);
		this.maxTime = (this.points[i][0]<this.maxTime) ? this.maxTime : this.points[i][0];
		this.minTime = (this.points[i][0]>this.minTime) ? this.minTime : this.points[i][0];
	}
	//this.points.sort(function(a,b){return b[0]-a[0]});

	//iterates over list of valid comments, finds their y value
	for (var i = 0; i < this.rawFilteredComments.length; i++){
		this.points[i][1] = findDataPoint(y, i, this.rawFilteredComments, this.points);
		if (currentType == "Histogram" && this.dayORweek){
			this.points[i][1] = this.points[i][0];
		}
		cSubreddit = this.rawFilteredComments[i].subreddit;
		this.subredditPoints[cSubreddit] = (this.subredditPoints[cSubreddit]) ? 
				this.subredditPoints[cSubreddit] : [];
		this.subredditPoints[cSubreddit].push(this.points[i]);
	}

	//sums and sorts comment points by subreddit 
	for (var sub in this.subredditPoints) {
		if (this.subredditPoints.hasOwnProperty(sub)) {
			var sum = 0;
			for (var i = 0; i <this.subredditPoints[sub].length; i++){
				sum += this.subredditPoints[sub][i][1];
			}			 		
			this.subredditSums.push({ data: sum, label: sub});  		
		}
	}
	this.subredditSums.sort( function(a,b) {return b.data-a.data} );

	//removes old listeners
	$("#graph").unbind("plothover");
	$("#graph").unbind("plotclick");

	if (y =="ReadingLevel"){
		y = "Grade Level";
	}
	else if(y == "Length"){
		y = "Length in Characters";
	}
	else if (y == "NumberHourly"){
		y = "per Hour";
	}
	else if (y == "NumberWeekly"){
		y = "per Day of Week";
	}	
	else if (y == "Number"){
		if (!(currentType == "PieChart" || currentType == "Histograph")){
			y = "per Day";
		}
	}

	//scatter plot spefic code here
	if (this.type=="ScatterPlot"){
		if (y == "per Day")	{
			this.graphTitle = userName + "'s " + comORsub() + " " + y + " v. " +  x;

		}
		else if (this.dayORweek){
			this.graphTitle = userName + "'s " + comORsub() + " During a Typical " + ((currentData == "Hourly") ? "Day" : "Week");
		}
		else{
			this.graphTitle = userName + "'s " + comORsub() + ": " + y + " v. " +  x;
		}

		this.drawGraph = function(){
			setGraphWidth();
			var graphData = [];

			//loops over all the subreddits, adding them to the graph seperatly to enable different colored points
			for (var i = 0;  i < this.subredditSums.length; i++){
				var sub = this.subredditSums[i].label;
		 		graphData.push({ data: this.subredditPoints[sub], points: {show: true}, 
		 			label: sub}) ;  		
			}

			xmode = {mode:'time'};
			ymode = {label: y, labelPos: "high"};


			if(!this.dayORweek) {			
				if (log && !(currentData=="ReadingLevel"||currentData=="Number")){
					ymin = extremeValues["min" + currentData];
					console.log(ymin);
					ymode.transform = function (v) {
													var val = Math.log(v-ymin+1);
													if (v == 0){
														return 0;
													}
													else if (v < 0){
														return (-Math.log(-v));
													}
													else {
														return Math.log(v);
													}
												};
  					ymode.inverseTransform = function (v) { return Math.pow(v,2); };
  					ymode.min = ymin;
				}
			}
			else {
				//graphData.push({ data: smoother(currentPlot.points, 400, 100), hoverable: false, clickable: false, color: "black"});
				ymode: {};
				if (currentData == "Weekly"){
					xmode = {ticks: [[,"Sun"],[24*60*60*1000,"Mon"],[2*24*60*60*1000,"Tue"],[3*24*60*60*1000,"Wed"],[4*24*60*60*1000,"Thu"],[5*24*60*60*1000,"Fri"],[6*24*60*60*1000,"Sat"]]
							, label:"Time", labelPos: "high"}
				}
			}

			$.plot($("#graph"), graphData,
			   { 
			       xaxes: [xmode],
			       yaxes: [ymode],
			       grid: { hoverable: true, clickable: true},
			       legend: {noColumns:3, container:$("#legend")}
			   });

			centerLegend();
		}

		$("#graph").bind("plothover", function (event, pos, item) {
		    if (item) {         
		        displayCommentDetail(currentPlot.rawCommentSubredditIndex[item.series.label][item.dataIndex]);
		    }
		});

		$("#graph").bind("plotclick", function (event, pos, item) {
		    if (item) {
		    	console.log("link opened");
				window.open(generateCommentLink(currentPlot.rawCommentSubredditIndex[item.series.label][item.dataIndex]), '_blank');
		    }
		});
		displayCommentDetail(0);
	}

	if (this.type == "PieChart"){		
		this.graphTitle = y + " of " + userName + "'s " + comORsub() + " by Subreddit";

		// if (currentData == "ReadingLevel"){
		// 	for (var i = 0; i < this.subredditSums.length; i++)	{
		// 		var sub = this.subredditSums[i].label;
		// 		this.subredditSums[i].data = this.subredditSums[i].data/this.subredditPoints[sub].length;
		// 	}			
		// }
		// this.subredditSums.sort( function(a,b) {return b.data-a.data} );

		this.drawGraph = function(){
			setGraphWidth();

			graphData = this.subredditSums;

			$.plot($("#graph"), graphData,
	       	{	      
				grid: { hoverable: true, clickable:true},
		   		series:{pie:{show:true}},
		      	legend: {noColumns:3, container:$("#legend")}
		       	//sorted:function sortLabels(a,b){return subredditIndex(a) > subredditIndex(b)}}
		   	});

		   	centerLegend();
		   	displayPieDetail(this.rawFilteredComments,"All");
		}
		
	
		$("#graph").bind("plotclick", function (event, pos, item) {
		    if (item & false) {
		    	document.getElementById("prohibtSubs").checked = false;
		    	document.getElementById("requireSubs").checked = true;
		    	document.getElementById("requiredReddits").value = item.series.label;
		    	document.getElementById("graphType").selectedIndex = 3;
		    	updateGraph();
		    }
		});

		$("#graph").bind("plothover", function (event, pos, item){
			var name = (item) ? item.series.label : "All";
			var array = (item) ? currentPlot.rawFilteredSubredditComments[name] : currentPlot.rawFilteredComments;
			displayPieDetail(array, name);
		});
	}

	if (this.type == "Histogram"){
		this.graphTitle = (y == "per Day") ? 
			"Histogram of " + userName + "'s Average " + comORsub() + " per Day" : 
			"Histogram of the " + y + " of " + userName + "'s "  + comORsub();

		if (this.dayORweek){
			this.graphTitle = "Histogram of " + userName + "'s Average " + comORsub() + " " + y;
		}

		//creates histograph ready data
		var max = -10000;
		var min = 100000;
		for (var i = 0; i < this.points.length; i++){
			max = (max > this.points[i][1]) ? max : this.points[i][1];
			min = (min < this.points[i][1]) ? min : this.points[i][1];
		}	
		var stepSize = Math.max(Math.round((max - min)/100),1);

		if (currentData == "Hourly"){
			stepSize = 1000*60*60;
		}		
		if (currentData == "Weekly"){
			stepSize = 1000*60*60*24;
		}		
		if (log){
			stepSize = 1;
		}
		var savedStepSize = stepSize;
		this.histTicks = [];

		graphData = [];
		this.histLookup = {};
		for (var i = 0; i < this.subredditSums.length; i++){
			var sub = this.subredditSums[i].label;
			var bucket = [];
			var bucketIndex = 0;
			this.histLookup[sub] = [];
			stepSize = savedStepSize;

			for (var j = min; j <= max; j += stepSize){
				if (log){
					stepSize = stepInc(j);
				//	console.log(stepSize + " " + j);
				}
				if (log){
					if (typeof this.histTicks[bucketIndex] ==="undefined"){
						if (j==-100 || j== -10 || j == -1 || j == 1 || j == 10 || j == 100 || j == 1000){
							this.histTicks[bucketIndex] = [bucketIndex, j];
						}
					}				
					bucket[bucketIndex] = [bucketIndex, 0];
				}
				else{
					bucket[bucketIndex] = [j, 0];
				}
				this.histLookup[sub][bucketIndex] = [];
				for (var k = 0; k < this.subredditPoints[sub].length; k++){
					if (j <= this.subredditPoints[sub][k][1] && this.subredditPoints[sub][k][1] < j + stepSize){
						bucket[bucketIndex][1] = bucket[bucketIndex][1] + 1;
						this.histLookup[sub][bucketIndex].push(this.rawCommentSubredditIndex[sub][k]);
					}
				}
				bucketIndex++;
			}
		 	graphData.push({ data: bucket, label: sub}) ;  		
		}
		this.stepSize = savedStepSize;
		this.drawGraph = function(){
			setGraphWidth();	 		

			var xmode = (currentPlot.dayORweek) ? {mode:'time'} : {label:y, labelPos:"high"};
			var ymode = {label: "Frequency", labelPos: "high"};
			if (currentData == "Weekly"){
				xmode = {ticks: [[0,"Sun"],[24*60*60*1000,"Mon"],[2*24*60*60*1000,"Tue"],[3*24*60*60*1000,"Wed"],[4*24*60*60*1000,"Thu"],[5*24*60*60*1000,"Fri"],[6*24*60*60*1000,"Sat"]]}
			}
			if (log){
				xmode.ticks = currentPlot.histTicks;
			}

			$.plot($("#graph"), graphData,
			   { 
			   		xaxes: [ xmode ],
			   		yaxes: [ymode],
			   		series: {
			   			stack: true,
			   			bars: {show:true, barWidth :.6*currentPlot.stepSize, lineWidth:0,
			   			    fillColor: { colors: [ { opacity: 1 }, { opacity: 1 } ] }
						}
			   		},
			       grid: { hoverable: true, clickable: true},
			       legend: {noColumns:3, container:$("#legend")
			   }})

			centerLegend();
		}

		$("#graph").bind("plothover", function (event, pos, item) {
		    if (item) {
		    	lastItem = item
		    	var x = item.dataIndex;
		    	var y = Math.floor(pos.y - item.datapoint[2]); 
	            displayCommentDetail(currentPlot.histLookup[item.series.label][x][y]);
		    }
		});
		$("#graph").bind("plotclick", function (event, pos, item) {	
			if (!item) {
		    	if (lastItem){
		    		item = lastItem;
		    	}
		    }		

		    if (item) {
		    	console.log("link opened");

		    	var x = item.dataIndex;
		    	var y = Math.floor(pos.y - item.datapoint[2]); 

				window.open(generateCommentLink(currentPlot.histLookup[item.series.label][x][y]), '_blank');
		    }
		});
		displayCommentDetail(0);
	}

	if (this.type == "Histograph"){
		this.graphTitle = "Histograph of the Total " + y + " of " + userName + "'s " + comORsub();
		var max = -10000;
		var min = 1000000000000000000000000000;
		for (var i = 0; i < this.points.length; i++){
			max = (max > this.points[i][0]) ? max : this.points[i][0];
			min = (min < this.points[i][0]) ? min : this.points[i][0];
		}	
		max = max;
		min = min;
		var stepSize = Math.max(Math.round((max - min)/500),1);

		graphData = [];
		var bucketValues = [];
		this.histLookup = {}; 
		for (var i = 0; i < this.subredditSums.length; i++){
			var sub = this.subredditSums[i].label;
			var bucket = [];
			var bucketIndex = 0;
			this.histLookup[sub] = [];
			for (var j = min; j <= max; j += stepSize){
				if (bucketIndex == 0){
					bucket[0] = [j, 0];
					this.histLookup[sub][bucketIndex] = this.rawCommentSubredditIndex[sub][0];
				}
				else{
					bucket[bucketIndex] = [j, bucket[bucketIndex-1][1]];
				}

				for (var k = 0; k < this.subredditPoints[sub].length; k++){
					if (j <= this.subredditPoints[sub][k][0] && this.subredditPoints[sub][k][0] < j + stepSize){
						bucket[bucketIndex][1] = bucket[bucketIndex][1] + 1;
						this.histLookup[sub][bucketIndex] = (this.rawCommentSubredditIndex[sub][k]);
					}
				}
				if (!this.histLookup[sub][bucketIndex]){
					this.histLookup[sub][bucketIndex] = this.histLookup[sub][bucketIndex-1];
				}
				bucketIndex++;
			}
			bucketValues.push(bucket);
		}					

		var bucketSums = [];
		var temp = bucketValues[0];
		for (var i = 0; i < temp.length; i++){
			var sum = 0;
			for (var j = 0; j < bucketValues.length; j++){
				sum += bucketValues[j][i][1];
			}
			for (var j = 0; j < bucketValues.length; j++){
				bucketValues[j][i][1] = 100*bucketValues[j][i][1]/sum;
			}
			bucketSums[i] = sum;
		}
		for (var i = 0; i < this.subredditSums.length; i++){
			graphData.push({data:bucketValues[i], label:this.subredditSums[i].label})
		}

		this.stepSize = stepSize;

		ymode = {label: "Percentage", labelPos: "high"};
		this.drawGraph = function(){
			setGraphWidth();	 		

			$.plot($("#graph"), graphData,
			   { 
			   		series: {
			   			stack: true,
			   			lines: {show: true, fill:true, steps: false},
			   			bars: {show:false, barWidth :.6*currentPlot.stepSize, lineWidth:0,
			   			    fillColor: { colors: [ { opacity: 1 }, { opacity: 1 } ] }
						}
			   		},
			   		xaxes: [ { mode: 'time' } ],
			   		yaxes: [ymode],
			       grid: { hoverable: true, clickable: false},
			       legend: {noColumns:3, container:$("#legend")
			   }})

			centerLegend();
		}

		$("#graph").bind("plothover", function (event, pos, item) {
		    if (item) {
		    	lastItem = item;
		    	var x = item.dataIndex;
		    	var y = Math.floor(pos.y - item.datapoint[2]); 
	            displayCommentDetail(currentPlot.histLookup[item.series.label][x]);
		    }
		});

		$("#graph").bind("plotclick", function (event, pos, item) {
		    if (!item) {
		    	if (lastItem){
		    		item = lastItem;
		    	}
		    }
		    if (item){
		    	console.log("link opened");

		    	var x = item.dataIndex;
		    	var y = Math.floor(pos.y - item.datapoint[2]); 
	            window.open(generateCommentLink(currentPlot.histLookup[item.series.label][x]), '_blank');
		    }
		});
		displayCommentDetail(0);
	}
}

function stepInc(x){
	var rv;
	var neg = (x>0) ? 1 : -1;
	x = x*neg;
	if (x<10){
		rv = 1;
	}
	else if (x<100){
		rv = 10;
	}
	else if (x<1000){
		rv = 100;
	}
	else {
		rv = 1000;
	}
	return rv;
}

function setGraphWidth(){	
	var sWidth = 215;
	var cWidth = 300;
	var width = Math.max($(window).width(), 800)
	gWidth = width - 40 - sWidth - cWidth;

	$('#graphContainer').css({"width":gWidth});
	$('#graph').css({"width":gWidth});
	$("#graphTitle").html(currentPlot.graphTitle);
}

function centerLegend(){
	var xOffset = ($('#graphContainer').width() - $("tbody").width())/2;
	$('#legend').css({"left":xOffset, "width":$('#graphContainer').width() - 2*xOffset, "position":"relative"});
}

function subredditIndex(name){
	for (var i = 0; i < currentPlot.subredditSums.length; i++){
		if (currentPlot.subredditSums[i].name == name){
			return i;
		}
	}
}

function createRestrictionFilter(){
	this.minKarma = getSliderValue("#karma")[0];
	this.maxKaram = getSliderValue("#karma")[1];
	this.minLength = getSliderValue("#length")[0];
	this.maxLength = getSliderValue("#length")[1];
	this.minDate = getSliderValue("#date")[0];
	this.maxDate =  getSliderValue("#date")[1];
	//this.requireReddits = $('input[@name="radioReddits"]:checked').val() === "true";
	//this.requiredReddits = $("#requiredReddits").val().split(" ");

	this.isFiltered = function(data){
		if (this.minKarma > data.ups-data.downs || this.maxKaram < data.ups-data.downs){
			return true;
		}
		if (this.minLength > commentLength(data.body) || this.maxLength < commentLength(data.body)){
			return true;
		}
		if (this.minDate > new Date(data.created*1000) || this.maxDate < new Date(data.created*1000)){
			return true;
		}
	//	if (!(subredditPresent(data.subreddit, this.requiredReddits) == this.requireReddits)){
	//		return true;
	//	}

		return false;
	}
}

function getSliderValue(name){
	try{
		return $(name + "Slider").slider("values");
	}
	catch(e){
		return [2350853047704, -1350853047704];
	}
}

function subredditPresent(name, list){
	var rv = false;
	for(var i = 0; i < list.length ; i++){
		rv = (list[i]==name) ? true : rv;
	}
	return rv;
}

function findDataPoint (type, i, array, pointArray){
	switch(type){
		case "Time" 			: return array[i].created*1000;		
		case "Hourly"			: return commentHour(array[i].created*1000);
		case "Weekly"			: return commentWeek(array[i].created*1000);

		case "Length" 			: return array[i].Length;
		case "ReadingLevel"		: return array[i].ReadingLevel;
		case "Karma"			: return array[i].ups - array[i].downs;

		case "Number"			: return commentNumber(i, pointArray, 604800*1000, 	 14, 	false);
		case "NumberHourly"		: return commentNumber(i, pointArray, 60*60*1000, 	 2, 	60*60*1000*24);
		case "NumberWeekly"		: return commentNumber(i, pointArray, 60*60*1000*24, 2, 	60*60*1000*24*7);
	}
}

function commentWeek(int){
	var date = new Date(int);
	return date.getDay()*60*60*1000*24 + date.getHours()*60*60*1000+date.getMinutes()*60*1000+date.getSeconds()*1000;
}

function commentHour(int){
	var date = new Date(int);
	return date.getHours()*60*60*1000+date.getMinutes()*60*1000+date.getSeconds()*1000;
}

function displayCommentDetail(index){
	$('#scatterDetails').css({"visibility":"visible", "height":"auto"});
	$('#pieDetails').css({"visibility":"hidden"});

	var date = new Date(rawCommentArray[index].created*1000);

	document.getElementById("cText").innerHTML = htmlDecode(rawCommentArray[index].body_html);
	document.getElementById("cSubreddit").innerHTML = rawCommentArray[index].subreddit;
	document.getElementById("cThreadTitle").innerHTML = rawCommentArray[index].link_title;
	document.getElementById("cPosted").innerHTML = date.toDateString() + " " + toHoursMinutes(date);
	document.getElementById("cKarma").innerHTML = rawCommentArray[index].ups-rawCommentArray[index].downs;
	document.getElementById("cReadingLevel").innerHTML = Math.floor(rawCommentArray[index].ReadingLevel*1000)/1000;
}

function toHoursMinutes(date){
	var rv = date.getHours() + ":";
	if (date.getMinutes()<10){
		rv += "0"
	}
	rv += date.getMinutes();
	return rv;
}

function htmlDecode(input){
	var e = document.createElement('div');
	e.innerHTML = input;
	return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}

function displayPieDetail(array, name){
	$('#scatterDetails').css({"visibility":"hidden", "height":"0px"});
	$('#pieDetails').css({"visibility":"visible"});

	var maxDate = 0;
	var minDate = 100000000000000000000000;
	for (var i = 0; i<array.length;i++){
		maxDate = (array[i].created > maxDate) ? array[i].created : maxDate;
		minDate = (array[i].created < minDate) ? array[i].created : minDate;
	}

	document.getElementById("pSubreddit").innerHTML = name;
	document.getElementById("pFirst").innerHTML = (new Date(minDate*1000)).toDateString();
	document.getElementById("pLast").innerHTML = (new Date(maxDate*1000)).toDateString();
	document.getElementById("pTPost").innerHTML = array.length;
	document.getElementById("pTKarma").innerHTML = sumComment(array, "Karma");
	document.getElementById("pTChar").innerHTML = sumComment(array, "Length");
	document.getElementById("pKarmaPerPost").innerHTML = Math.floor(sumComment(array, "Karma")/ array.length*1000)/1000;
	document.getElementById("pCharPerPost").innerHTML = Math.floor(sumComment(array, "Length") / array.length*1000)/1000;
	document.getElementById("pReadingLevelPerPost").innerHTML = Math.floor(sumComment(array, "ReadingLevel") / array.length*1000)/1000;
}

function sumComment(array, dataType){
	var rv = 0;
	for (var i = 0; i<array.length; i++){
		if (dataType == "Length") {
			rv +=array[i].Length;
		}
		else if(dataType == "ReadingLevel"){
			rv +=array[i].ReadingLevel;
		}
		else if(dataType == "Karma"){
			rv += array[i].ups - array[i].downs;
		}
	}
	return rv;
}

function generateCommentLink(index){
	var comment = rawCommentArray[index];
	if (commentsQueried){
		var rv = "http://www.reddit.com/r/";
		rv += comment.subreddit;
		rv += "/comments/";
		rv += comment.link_id.substring(3);
		//rv += "/";
		//rv += comment.link_title.substring(3);
		rv += "/threadName/";
		rv += comment.id;
		rv += "?context=3";
	}
	else {
		var rv = "http://www.reddit.com" + comment.permalink;
	}
	return rv;
}

function removeQuotes(str){
	var start;
	var stop;
	str = str.replace(rx," ");
	while (str.indexOf("&gt") != -1){
		start = str.indexOf("&gt");
		stop = str.indexOf("\n\n", start);
		if (stop != -1){
			str = str.substring(0,start) + str.substring(stop+2,str.length);
		}
		else {
			//no ending line return; return start of quotation
			return str.substring(0,str.indexOf("&gt"));
		}
	}
	return str;
}

function commentLength(str){
	return removeQuotes(str).length;
}

//thanks http://multitoolbox.com/text/statistics/
function commentReadingLevel(str){
	str = removeQuotes(str);
	var rv = readingStats(str);
	rv = (rv<5) ? 5 + sigmoid((rv-5)/5)*5 : rv;
	rv = (rv>20) ? 15 + sigmoid((rv-15)/5)*5 : rv;
	if (isNaN(rv)){
		rv = 6 + Math.random();
	}
	return rv;
}

function sigmoid(t){
	return t/(1+Math.abs(t));
}

function regexCatch(str, reg, defaultValue){
	try {return str.match(reg).length;}
	catch (er) {return defaultValue;}
}

//finds the number of comments posted within a week if scatter OR returns 1 for all other graph types
function commentNumber(index, array, radius, period, mod){
	sv = index;
	sd = array;
	r = radius;
	p = period;
	if ((currentType == "ScatterPlot" || currentType == "Histogram") || (currentData == "Weekly" || currentData == "Hourly")){
		var rv = 0;
		for(var i = 0; i<array.length; i++){
			if(Math.abs(array[index][0] - array[i][0]) < radius){
				rv ++;	
			}
			else if (mod){
				if (mod - Math.abs(array[index] - array[i]) < radius){
					rv++;
				}
			}
		}

		return rv/period;
	}
	return 1;
}

function smoother(data, points, radius){
	rv = [];

	var max = Number.NEGATIVE_INFINITY;
	var min = Number.POSITIVE_INFINITY;
	for (var i = 0; i < data.length; i++){
		max = (data[i][0]>max) ? data[i][0] : max;
		min = (data[i][0]<min) ? data[i][0] : min;
	}	

	var ix;
	for (var i = 0; i <= points; i++){
		ix = i/(points-1)*(max-min) + min;

		var start = 0;
		while (data[start] && data[start][0] >= ix){
			start++;
		}

		var weight;
		var numerator = 0;
		var denominator = 0;
		for (var j = -radius; j<=radius; j++){
			if (0<=start+j && start+j<data.length){
				weight = tricubicKenral(ix, data[start+j][0], max, min);
				//console.log(weight);
				numerator += weight*data[start+j][1];
				denominator += weight;
			}
		}

		rv[i] = [ix, numerator/denominator];
	}

	return rv;
}

function epanechnikovKernal(x, x0, max, min){
	var u = (x - x0) / (max - min);
	return 3/4*(1 - Math.pow(u,2));
}

function tricubicKenral(x, x0, max, min){
	var u = Math.min(1,Math.abs((x - x0) / ((max - min)/10)));
	if (70/81*Math.pow((1 - Math.pow(u,8)),3)<-1){
		sv = {u:u,x:x,x0:x0,max:max,min:min};
		console.log(sv);
		sv.car = sv.dog;
		throw 3;
	}
	return 70/81*Math.pow((1 - Math.pow(u,3)),3);
}

function findExtremeValues(array){
	var rv = 	{minKarma: 99999, maxKarma: -99999, minLength: 9999999, maxLength: 0,
				minDate: 10000000000000, maxDate: 0};
	var karma;
	var length;
	var date;
	for (var i = 0; i < array.length; i++){
		karma = array[i].ups - array[i].downs;
		rv.minKarma = (rv.minKarma < karma) ? rv.minKarma : karma;
		rv.maxKarma = (rv.maxKarma > karma) ? rv.maxKarma : karma;

		length = commentLength(array[i].body);
		rv.minLength = (rv.minLength < length) ? rv.minLength : length;
		rv.maxLength = (rv.maxLength > length) ? rv.maxLength : length;

		date = array[i].created*1000;		
		rv.minDate = (rv.minDate < date) ? rv.minDate : date;
		rv.maxDate = (rv.maxDate > date) ? rv.maxDate : date;
	}
	return rv;
}

function comORsub(){
	return (commentsQueried) ? "Comments" : "Submissions"
}

// var re = /gawker/;
// for (var i = 0; i < rawCommentArray.length; i++){
// 	if(re.test(rawCommentArray[i].body)){
// 		console.log(rawCommentArray[i]);
// 	}
// }