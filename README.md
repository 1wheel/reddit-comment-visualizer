Downloads user's comment history from reddit and generates several graphs.

Currently live on redditgraphs.com

wrapper.js interacts with the reddit api and the ui, while plot.js formats the raw data and creates a flot chart. I've added more graph types and data than originally anticipated, so the main constructor in plot.js is a bit of a mess right now.