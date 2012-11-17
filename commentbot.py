import feedparser
import json
import urllib
import urllib2
from HTMLParser import HTMLParser
from sets import Set
import requests
import time

##using metareddit, responds to reddit comments about commenting history with a link to their redditgraph
##reddit admins will shadowban accounts doing this

def urlOpener(url):
    time.sleep(2)
    req = urllib2.Request(url, None, {'user-agent':'redditgraphs bot'})
    opener = urllib2.build_opener()
    f = opener.open(req)
    return f.read();

#takes rss url and returns comment dic
def commentReader(url):
    url = url[:-10] + '.json'
    content = urlOpener(url)        commentData = json.loads(content)[1]['data']['children'][0]['data']
    commentData['body'] = HTMLParser.unescape.__func__(HTMLParser, commentData['body'])
    commentData['op'] = json.loads(content)[0]['data']['children'][0]['data']['author']
    return commentData

#given comment data, finds the parent's user name
def parentUsername(commentData):
    if commentData['parent_id'][0:2] == 't1':
        print "comment is parent"
        url = "http://www.reddit.com/r/" + commentData['subreddit'] + "/comments/" + commentData['link_id'][3:] + '/threadName/' + commentData['parent_id'][3:] +".json"
        content = urlOpener(url)
        return json.loads(content)[1].get('data').get('children')[0].get('data').get('author')
    else:
        print "submission is parent"
        url = 'http://www.reddit.com/by_id/' + commentData['parent_id'] + ".json"
        content = json.loads(urlOpener(url))
        return content['data']['children'][0]['data']['author']

#takes comment string, returns sentance contain searched string and who it refers to
def findQuote(commentString, foundstr):
    who = -1
    quote = -1
    
    sentences = commentString.replace('\n', ' ').split('. ')
    for sentence in sentences:
        index = sentence.find(foundstr)
        if index != -1:
            quote = sentence
            if sentence[index-5:index-1].lower()== "OP's".lower():
                who = "op"
            if sentence[index-5:index-1].lower()== "your":
                who = "your"
            if sentence[index-3:index-1].lower()== "my":
                who = "my"
    return {'who': who, 'text': quote}

#returns reddit user name whose comment history will be linked
def findName(commentData, who, text):
    if who == "op":
        return commentData["op"]
    if who == 'your':
        return parentUsername(commentData)
    if who == 'my':
        return commentData["author"]
    print "NO VALID WHO: " + text
    return -1

#posts comment as a reply
def postComment(commentData, quoteText, name):
    if (quoteText != -1) and (name != -1) and (name != '[deleted]'):
        text = ">" + quoteText + "\n\n" + "www.redditgraphs.com?" + name
        print text
        if not commentData['link_id'] in threadPosted:
            threadPosted.add(commentData['link_id'])
            data = {'thing_id': 't1_' + commentData['id'], 'text': text, 'uh': modhash, 'api_type': 'json'}
            r = client.post('http://www.reddit.com/api/comment', data=data)
            print r.status_code
            return data
        print "ALREADY POSTED HERE"

#process rss url - download feed and try to post to linked comments
def proccessRSS(rssURL, foundStr, hours):
    #download list of recent 'comment history' posts from rss
    d = feedparser.parse(rssURL)
    print "\n" + foundStr + "\n"
    for entry in d.entries:
        try:
            if time.mktime(time.gmtime()) - time.mktime(entry['published_parsed']) < 3600*hours:
                surl = entry.link
                print "\n"+surl
                commentData = commentReader(surl)
                quote = findQuote(commentData['body'], foundStr)
                name = findName(commentData, quote["who"], quote["text"])
                postComment(commentData, quote["text"], name)
        except Exception:
                print "EXCEPTION"
        
#download set of thread ids previously posted in 
threadPosted = Set()
oldComments = json.loads(urlOpener('http://www.reddit.com/user/redditgraphs/comments.json?limit=100'))
for comment in oldComments['data']['children']:
    threadPosted.add(comment['data']['link_id'])

#login to reddit                                                                                                
client = requests.session(headers={'User-Agent': 'redditgraphs bot'})
data = {'user': 'redditgraphs', 'passwd': passwd, 'api_type': 'json'}
r = client.post('https://ssl.reddit.com/api/login', data=data)
modhash = r.json['json']['data']['modhash']

while True: 
	print "SCANNING RSS FEEDS"
	proccessRSS('http://metareddit.com/monitor/t5YZI/your_comments.rss', 'comments', 1)
	proccessRSS('http://metareddit.com/monitor/QyJJZ/comment_history.rss', 'comment history', 1)
	proccessRSS('http://metareddit.com/monitor/878e6/post_history.rss', 'post history', 1)
	proccessRSS('http://metareddit.com/monitor/fzMWP/posting_history.rss', 'posting history', 1)
	proccessRSS('http://metareddit.com/monitor/t5YZI/submission_history.rss', 'submission history', 1)
	print "SLEEPING"
	time.sleep(1000)
