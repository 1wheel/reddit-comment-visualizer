Downloads user's comment history from reddit and generates several graphs.

Currently live on redditgraphs.com

wrapper.js interacts with the reddit api and the ui, while plot.js formats the raw data and creates a flot chart. I've added more graph types and data than originally anticipated, so the main constructor in plot.js is a bit of a mess right now.

read.js uses code from http://www.online-utility.org/ to estimate (very roughly) the grade level of the comment text. 



Icons by Omer Cetin, PC Unleashed, and myself