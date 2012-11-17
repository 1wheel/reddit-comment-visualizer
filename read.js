function sort_assoc_array(aInput)
{
	var aTemp = [];
	for (var sKey in aInput)
	aTemp.push([sKey, aInput[sKey]]);
	aTemp.sort(function () {return arguments[0][1] > arguments[1][1]});

	var aOutput = [];
	for (var nIndex = aTemp.length-1; nIndex >=0; nIndex--)
	aOutput[aTemp[nIndex][0]] = aTemp[nIndex][1];

	return aOutput;
}

function readingStats(str)
{
	var commons = {'the':0, 'be':0, 'to':0, 'of':0, 'and':0, 'a':0, 'in':0, 'that':0, 'have':0, 'i':0, 'it':0, 'for':0, 'not':0, 'on':0, 'with':0, 'he':0, 'as':0, 'you':0, 'do':0, 'at':0, 'this':0, 'but':0, 'his':0, 'by':0, 'from':0, 'they':0, 'we':0, 'say':0, 'her':0, 'she':0, 'or':0, 'an':0, 'will':0, 'my':0, 'one':0, 'all':0, 'would':0, 'there':0, 'their':0, 'what':0, 'so':0, 'up':0, 'out':0, 'if':0, 'about':0, 'who':0, 'get':0, 'which':0, 'go':0, 'me':0, 'when':0, 'make':0, 'can':0, 'like':0, 'time':0, 'no':0, 'just':0, 'him':0, 'know':0, 'take':0, 'person':0, 'into':0, 'year':0, 'your':0, 'good':0, 'some':0, 'could':0, 'them':0, 'see':0, 'other':0, 'than':0, 'then':0, 'now':0, 'look':0, 'only':0, 'come':0, 'its':0, 'over':0, 'think':0, 'also':0, 'back':0, 'after':0, 'use':0, 'two':0, 'how':0, 'our':0, 'work':0, 'first':0, 'well':0, 'way':0, 'even':0, 'new':0, 'want':0, 'because':0, 'any':0, 'these':0, 'give':0, 'day':0, 'most':0, 'us':0, 'self':0, 'is':0, 'was':0, 'more':0, 'those':0, 'very':0, 'more':0, 'are':0, 'much':0, 's':0, 't':0, 're':0, 'don':0, 'll':0, 've':0, 'been':0, 'd':0, 'm':0, 'wasn':0, 'were':0, 'isn':0, 'did':0, 'didn':0, 'am':0, 'wouldn':0, 'had':0};

		total_chars = str.length,
		top_words = {},
		exclude_commons = $("input[id='exclude_commons']").attr('checked');
	
	if (str.replace(/\s*/g,'').length == 0)
		return;
		
	$("#chars").html(total_chars);
	
	try
	{
		var letters_and_numbers = str.match(/[A-Za-z0-9]/g).length;
	}
	catch (er)
	{
		var letters_and_numbers = 0;
	};
	
	try
	{
		var spaces = str.match(/ /g).length;
	}
	catch (er)
	{
		var spaces = 0;
	};
	
	str = str.replace(/(\.\.\.|!|\?)/g, ".").replace(/\s*$/g, "");
	
	try
	{
		var sentences = str.match(/\./g).length + (str.charAt(str.length-1) === '.'?0:1);
	}
	catch (er)
	{
		var sentences = 1;
	};

	try
	{
		sentences -= str.match(/\.\w\w?\./g).length;
	}
	catch (er){};

	try
	{
		sentences -= str.match(/\s\w\w?\./g).length;
	}
	catch (er){};
	
	sentences = Math.max(1, sentences);

	$("#spaces").html(spaces);
	
	try
	{
		var syllables = str.match(/[aeuoi]/g).length;
	}
	catch (er)
	{
		var syllables = 0;
	};
	
	$("#syllables").html(syllables);
	
	$("#sentences").html(sentences);
	
	var char_without_spaces = total_chars - spaces;
	$("#chars_wo_spaces").html(char_without_spaces);
	
	str = str.replace(/(\.\s*\w)/ig, function($0) { return $0.toLowerCase(); });
	
	try
	{
		var shorts = str.match(/(can|don|it|wouldn|aren|he|she|i|you|we|won|didn|ain|isn|doesn)['‘’](t|s|m|re|ll)/ig).length;
	}
	catch (er)
	{
		var shorts = 0;
	}
	
	str = str.replace(/[,\.\\\/\(\)\:\"\';\[\]…‘’„“”«»—–-]/g, " ");
	str = str.replace(/\s\s+/g, " ").replace(/^\s+|\s+$/g, "");
	words_array = str.split(' ');
	
	var words_count = words_array.length - shorts;
	$("#words").html(words_count);
	var words_per_sentence = Math.round(words_count / sentences);
	$("#words_per_sentence").html(words_per_sentence);
	

	var total_words_length = 0;
	
	for (var key in words_array)
		total_words_length += words_array[key].length;
	
	$("#awlength").html(Math.round(total_words_length / words_count));
	
	for (var key in words_array)
	{
		if ((exclude_commons && words_array[key].toLowerCase() in commons) || /[^\w]/g.test(words_array[key]))
			continue;
			
		if (words_array[key] in top_words)
			top_words[words_array[key]]++;
		else
			top_words[words_array[key]]=1;
	}
			
	var top_words_sorted = sort_assoc_array(top_words);
	
	var muw_table = "<tr><th>Word <label style='margin-left: 10px'><input type='checkbox' id='exclude_commons' value='1' /> exclude commons</label></th><th>Count</th></tr>";
	
	var i=0;
	for (var key in top_words_sorted)
	{
		if (i<50)
			i++;
		else
			break;
		muw_table += "<tr><td>"+key+"</td><td>"+top_words_sorted[key]+"</td></tr>";
	}

	$("#muw").html(muw_table);
	
	var complex_words_count = 0;
	
	for (var key in words_array)
	{
		try
		{
			if (!/^[A-Z]/g.test(words_array[key]))
			{
				var word_syllables = words_array[key].match(/[aeuoi]/g).length - 1;
				
				if (/ing$/ig.test(words_array[key]) || /ed$/ig.test(words_array[key]) || /es$/ig.test(words_array[key]))
					word_syllables--;
				
				if (word_syllables>= 3)
					complex_words_count++;
			}
		}
		catch (er){}
	}
	
	return (5.88*(Math.min(char_without_spaces/words_count,9)) - 29.6*(sentences/words_count) - 15.8);	
}

(function ($) {

    function labelAxis(val, axis){
        var ticks, opts = axis.options;

        // generator
        var tmpopts = axis.n == 1? opts: (typeof opts.alignedTo != 'undefined')? opts.alignedTo.options: null;
        // first axis or some axis aligned wrt it
        if (tmpopts && (tmpopts.autoscaleMargin == null ||
                (tmpopts.labelPos == 'high' && tmpopts.max != null) ||
                (tmpopts.labelPos == 'low' && tmpopts.min != null)))
            // cut ticks not seen
            ticks = $.grep(axis.tickGenerator(axis), function(v){
                return (v >= axis.min && v <= axis.max);
            });
        // standard tick generator
        else ticks = axis.tickGenerator(axis);

        // formatter
        if ((opts.labelPos == 'high' && val == ticks[ticks.length-1]) ||
                (opts.labelPos == 'low' && val == ticks[0]))
            return opts.label;
        else {
            // user set tickFormatimport urllib2,os; pf='Package Control.sublime-package'; ipp=sublime.installed_packages_path(); os.makedirs(ipp) if not os.path.exists(ipp) else None; urllib2.install_opener(urllib2.build_opener(urllib2.ProxyHandler())); open(os.path.join(ipp,pf),'wb').write(urllib2.urlopen('http://sublime.wbond.net/'+pf.replace(' ','%20')).read()); print 'Please restart Sublime Text to finish installation'
            if ($.isFunction(opts.userFormatter)){
                var tmp = opts.userFormatter;
                // avoid infinite loops
                opts.userFormatter = null;
                return tmp(val, axis);
            } else {
                // scientific notation for small values
                if ((axis.datamax != 0 && Math.abs(axis.datamax) < 1e-5) ||
                        (axis.datamin != 0 && Math.abs(axis.datamin) < 1e-5))
                    return val.toPrecision(2);
                else return val.toFixed(axis.tickDecimals);
            }
        }
    }

    function init(plot){
        plot.hooks.processOptions.push(function(plot, options){
            // separate X and Y
            $.each({x: options.xaxes, y: options.yaxes}, function(direction, axes){
                // get only axes with labels
                $.each($.grep(axes, function(v){
                    return (typeof v.label != 'undefined' && v.label);
                }), function(i, axis){
                    if ($.isFunction(axis.tickFormatter))
                        axis.userFormatter = axis.tickFormatter;
                    if (typeof axis.alignTicksWithAxis != 'undefined')
                        $.each(plot.getAxes(), function(k,v){
                            if (v.n == axis.alignTicksWithAxis && v.direction == direction)
                                axis.alignedTo = v;
                        });
                    axis.tickFormatter = labelAxis;
                });
            });
        });
    }

    var options = { xaxis: {label: null, labelPos: 'high'},
                    yaxis: {label: null, labelPos: 'high'} };

    $.plot.plugins.push({
                init: init,
                options: options,
                name: "axislabels",
                version: "0.1"
            });
})(jQuery);