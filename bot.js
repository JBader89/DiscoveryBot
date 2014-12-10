//TODO: 1. add messages, 2. add comments, 3. fix !clearchat, 4. add !status, 5. make cooldown, 6. make BAs bouncers
var PlugAPI = require('plugbotapi'); //Use 'git clone git@github.com:plugCubed/plugAPI.git' in your node_modules
var request = require('request'); //Use 'npm install request'

var bot = new PlugAPI({
    "email": "badaskbros@gmail.com",
    "password": "xxx"
});
var ROOM = 'showcase';
bot.connect(ROOM); // The part after https://plug.dj

var reconnect = function() { 
    bot.connect(ROOM); 
};

bot.on('close', reconnect);
bot.on('error', reconnect);

var media = null;
var waitlist = null;
var dj = null;
var admins = null;
var brandAmbassadors = null;
var staff = null;
var users = null;
var roomScore = null;
var afkList = {};
var theme = "nothing yet.";
var lockskip = null;
var reinstatedStats = null;
var bouncerCommandsEnabled = true;
var userCommandsEnabled = true;
var autoskipEnabled = false;
var lockdownEnabled = false;
var chatQueue = [];
var waitlistArray = [];

//Event which triggers when the bot joins the room
bot.on('roomJoin', function(data) {
    bot.getMedia(function(plugMedia){
        media = plugMedia;
        if (media != null){
            bot.getTimeRemaining(function(timeRemaining){
                var timer = setInterval(
                    function() {
                        if (autoskipEnabled){
                            bot.moderateForceSkip(dj.id);
                            bot.chat("Autoskip!");
                        }
                        clearInterval(timer);
                    }, (timeRemaining * 1000)
                );
            });
        }
    });
    bot.getWaitList(function(plugWaitlist){
        waitlist = plugWaitlist;
        waitlistArray.push(waitlist);
    });
    bot.getDJ(function(plugDJ){
        dj = plugDJ;
        if (dj == null){
            bot.djJoin();
            bot.chat("Autojoining booth!");
        }
    });
    bot.getStaff(function(plugStaff){
        staff = plugStaff;
    });
    bot.getUsers(function(plugUsers){
        users = plugUsers;
    });
    bot.getAdmins(function(plugAdmins){
        admins = plugAdmins;
    });
    bot.getAmbassadors(function(plugBAs){
        brandAmbassadors = plugBAs;
    });
    console.log("I'm live!");
});

//Event which triggers when new DJ starts playing a song
bot.on('advance', function(data) {
    bot.getMedia(function(plugMedia){
        media = plugMedia;
        if (media != null){
            var timer = setInterval(
                function() {
                    if (autoskipEnabled){
                        bot.moderateForceSkip(dj.id);
                        bot.chat("Autoskip!");
                    }
                    clearInterval(timer);
                }, (media.duration * 1000)
            );
        }
    });
    bot.getWaitList(function(plugWaitlist){
        waitlist = plugWaitlist;
    });
    bot.getDJ(function(plugDJ){
        dj = plugDJ;
        if (dj == null){
            bot.djJoin();
            bot.chat("Autojoining booth!");
        }
    });
    // if (data.lastPlay.score != null) {
    //     bot.chat("Last song: :thumbsup: " + data.lastPlay.score.positive + " :star: " + data.lastPlay.score.grabs + " :thumbsdown: " + data.lastPlay.score.negative);
    //     bot.chat(":musical_note: " + data.dj.username + " started playing \"" + data.media.title + "\" by " + data.media.author + " :musical_note:");
    // }
});

//Event which triggers when the waitlist changes
bot.on('waitListUpdate', function(data) {
    bot.getWaitList(function(plugWaitlist){
        waitlist = plugWaitlist;
        waitlistArray.push(waitlist);
        if (waitlistArray.length > 100){
            waitlistArray.shift();
        }
        if (reinstatedStats != null){
            bot.moderateMoveDJ(reinstatedStats[0], reinstatedStats[1]);
            reinstatedStats = null;
        }
    });
    bot.getStaff(function(plugStaff){
        staff = plugStaff;
    });
    bot.getUsers(function(plugUsers){
        users = plugUsers;
    });
    //console.log(data);
});

//Event which triggers when user skips his song
bot.on('skip', function(data) {
    bot.getMedia(function(plugMedia){
        media = plugMedia;
    });
    bot.getWaitList(function(plugWaitlist){
        waitlist = plugWaitlist;
    });
    bot.getDJ(function(plugDJ){
        dj = plugDJ;
    });
    bot.getStaff(function(plugStaff){
        staff = plugStaff;
    });
    bot.getUsers(function(plugUsers){
        users = plugUsers;
    });
});

//Event which triggers when a mod skips the song
bot.on('modSkip', function(data) {
    bot.getMedia(function(plugMedia){
        media = plugMedia;
    });
    bot.getWaitList(function(plugWaitlist){
        waitlist = plugWaitlist;
    });
    bot.getDJ(function(plugDJ){
        dj = plugDJ;
    });
    bot.getStaff(function(plugStaff){
        staff = plugStaff;
    });
    bot.getUsers(function(plugUsers){
        users = plugUsers;
    });
    if (lockskip!=null){
        bot.moderateAddDJ(lockskip[0]);
        bot.moderateMoveDJ(lockskip[0], Number(lockskip[1]));
        lockskip = null;
    }
    //console.log(data);
});

//Still figuring out how this works
bot.on('floodChat', function(data) {
    bot.chat("flood!");
});

//Event which triggers with a user joins the room
bot.on('userJoin', function(data) {
    bot.getStaff(function(plugStaff){
        staff = plugStaff;
    });
    bot.getUsers(function(plugUsers){
        users = plugUsers;
    });
    bot.getAdmins(function(plugAdmins){
        admins = plugAdmins;
    });
    bot.getAmbassadors(function(plugBAs){
        brandAmbassadors = plugBAs;
    });
    var notReinstated = true;
    for (var i=waitlistArray.length - 1; i > -1; i--){
        for (var j=0; j < waitlistArray[i].length; j++){
            if (waitlistArray[i][j].username == data.username && notReinstated){
                bot.moderateAddDJ(waitlistArray[i][j].id);
                bot.chat("@" + data.username + " is reinstated!");
                notReinstated = false;
                reinstatedStats = [waitlistArray[i][j].id, j+1];
            }
        }
    }
});

//Event which triggers when anyone chats
bot.on('chat', function(data) {
    //console.log(data);
    if (lockdownEnabled){
        var isInRoom = false;
        var isStaffMember = false;
        for (var j=0; j<users.length; j++){
            if (users[j].username == data.un){
                isInRoom = true;
            }
        }
        for (var k=0; k<staff.length; k++){
            if (staff[k].username == data.un){
                isStaffMember = true;
            }
        }
        if (isInRoom && !(isStaffMember)){
            bot.moderateDeleteChat(data.chatID);
        }
    }
    chatQueue.push(data.chatID);
    if (chatQueue.length > 100){
        chatQueue.shift();
    }
    var command=data.message.split(' ')[0];
    var firstIndex=data.message.indexOf(' ');
    var qualifier="";
    if (firstIndex!=-1){
        qualifier = data.message.substring(firstIndex+1, data.message.length);
    }
    switch (command)
    {
        //Easter Eggs
        case "!badask":
            if (data.id == 3537523 || data.id == 3566839){
                bot.chat("THIS SHIT IS BADASK BRO");
            }
            break;

        //User Commands
        case "!theme":
        case ".theme":
            if (userCommandsEnabled){
                bot.chat("We're using a custom theme for the event which is currently set to " + theme);
            }
            break;
        case "!rules":
        case ".rules":
            if (userCommandsEnabled){
                bot.chat("Check out the room's rules here: http://rdjshowcase.net/rules");
            }
            break;
        case "!commands":
        case ".commands":
            if (userCommandsEnabled){
                bot.chat("Check out my commands here: http://rdjshowcase.net/commands");
            }
            break;
        case "!fb":
        case "!facebook":
        case ".fb":
        case ".facebook":
            if (userCommandsEnabled){
                bot.chat("Check out plug's Facebook here: https://www.facebook.com/plugdj");
            }
            break;
        case "!twitter":
        case ".twitter":
            if (userCommandsEnabled){
                bot.chat("Check out plug's Twitter here: https://twitter.com/plugdj");
            }
            break;
        case "!support":
        case ".support":
            if (userCommandsEnabled){
                bot.chat("For plug's support, go here: http://support.plug.dj/");
            }
            break;
        case "!blog":
        case ".blog":
            if (userCommandsEnabled){
                bot.chat("For plug's blog, go here: http://blog.plug.dj/");
            }
            break;
        case "!soundcloud":
        case ".soundcloud":
            if (userCommandsEnabled){
                var link = 'http://api.soundcloud.com/users.json?q=' + dj.username + '&consumer_key=apigee';
                request(link, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var info = JSON.parse(body);
                        if (info[0] != undefined){
                            bot.chat("Check out " + dj.username + "'s soundcloud here: " + info[0].permalink_url);
                        }
                    }
                });
            }
            break;
        case "!website":
        case ".website":
            if (userCommandsEnabled){
                bot.chat("Check out our website here: http://rdjshowcase.net/");
            }
            break;
        case "!register":
        case ".register":
            if (userCommandsEnabled){
                bot.chat("Register for the Showcase here: http://rdjshowcase.net/register");
            }
            break;
        case "!lateregister":
        case ".lateregister":
            if (userCommandsEnabled){
                bot.chat("Currently there is no late registry.");
            }
            break;
        case "!info":
        case ".info":
            if (userCommandsEnabled){
                bot.chat("For info on Showcase, go here: http://rdjshowcase.net/event");
            }
            break;
        case "!afk":
        case ".afk":
            if (userCommandsEnabled){
                bot.setStatus(qualifier, function() {
                    afkList[data.un] = qualifier;
                    bot.chat(data.un + " is afk: " + qualifier);
                });
            }
            break;
        case "!back":
        case ".back":
            if (userCommandsEnabled){
                delete afkList[data.un];
                bot.chat(data.un + " is back!");
            }
            break;

        //Res DJ+ Commands
        case "!rdj":
        case "!resdj":
        case "!residentdj":
        case ".rdj":
        case ".resdj":
        case ".residentdj":
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 0){
                    bot.chat("To become a Resident DJ, you must register here: http://rdjshowcase.net/register");
                }
            }
            break;
        case "!event":
        case ".event":
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 0){
                    bot.chat("The Resident DJ Showcase was created to help appreciate plug's producers and artists.");
                }
            }
            break;
        case "!ba":
        case "!brandambassador":
        case ".ba":
        case ".brandambassador":
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 0){
                    bot.chat("A Brand Ambassador is a global moderator which helps out plug. More info here: http://blog.plug.dj/brand-ambassadors/");
                }
            }
            break;
        case "!basoundcloud":
        case ".basoundcloud":
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 0){
                    bot.chat("Check out the BA's soundcloud here: https://soundcloud.com/plug-dj-bas");                
                }
            }
            break;
        case "!admin":
        case ".admin":
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 0){
                    bot.chat("An Admin is someone who works for plug. They're what keeps this site running.");
                }
            }
            break;
        case "!waitlist":
        case ".waitlist":
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 0){
                    bot.chat("To get on the waitlist, you must be a Resident DJ and part of the current event.");
                }
            }
            break;
        case "!staff":
        case ".staff":
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 0){
                    bot.chat("Staff members are chosen by the room's hosts/founders. Please do not ask for a rank.");
                }
            }
            break;

        //Bouncer+ Commands
        case "!bot":
        case ".bot":
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 1){
                    bot.chat("Well hey there! @"+data.un);
                }
            }
            break;
        case "!ping":
        case ".ping":
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 1){
                    bot.chat("pong!");
                }
            }
            break;
        case "!skip": //Makes the bot skip the current song
        case ".skip":
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 1){
                    bot.chat("Skipping!");
                    bot.moderateForceSkip(dj.id);
                }
            }
            break;
        case "!lockskip": //Skips the current song and sets the user back to the specified position 
        case ".lockskip":
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 1){
                    for (var j=0; j<users.length; j++){
                        if (users[j].username == dj.username){
                            lockskip = [dj.id, qualifier];
                            bot.chat("Skipping!");
                            bot.moderateForceSkip(dj.id);
                        }
                    }
                }
            }
            break;
        case "!add": //Adds a user to the waitlist
        case ".add": //TODO add message if user is already in waitlist
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 1){
                    for (var j=0; j<users.length; j++){
                        var spaceUsername = qualifier.slice(1).split(' ')[0] + " " + qualifier.slice(1).split(' ')[1];
                        if (users[j].username == qualifier.slice(1).split(' ')[0]){
                            bot.moderateAddDJ(users[j].id);
                        }
                        else if (users[j].username == spaceUsername){
                            bot.moderateAddDJ(users[j].id);
                        }
                    }
                }
            }
            break;
        case "!remove": //Removes a user from the waitlist
        case ".remove": //TODO: sends message when user isn't in waitlist
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 1){
                    for (var j=0; j<users.length; j++){
                        var spaceUsername = qualifier.slice(1).split(' ')[0] + " " + qualifier.slice(1).split(' ')[1];
                        if (users[j].username == qualifier.slice(1).split(' ')[0]){
                            bot.moderateRemoveDJ(users[j].id);
                        }
                        else if (users[j].username == spaceUsername){
                            bot.moderateRemoveDJ(users[j].id);
                        }
                    }
                }
            }
            break;
        case "!move": //Moves a user in the waitlist with .move [givenUser], [givenSpot]
        case ".move": //TODO: sends message when user isn't in waitlist
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 1){
                    for (var j=0; j<users.length; j++){
                        var spaceUsername = qualifier.slice(1).split(' ')[0] + " " + qualifier.slice(1).split(' ')[1];
                        if (users[j].username == qualifier.slice(1).split(' ')[0]){
                            if (Number(qualifier.slice(1).split(' ')[1]) > waitlist.length){
                                bot.chat("Sorry, there are only " + waitlist.length + " people in the waitlist, please try again.");
                            }
                            else{
                                bot.moderateMoveDJ(users[j].id, Number(qualifier.slice(1).split(' ')[1]));
                            }
                        }
                        else if (users[j].username == spaceUsername){
                            if (Number(qualifier.slice(1).split(' ')[2]) > waitlist.length){
                                bot.chat("Sorry, there are only " + waitlist.length + " people in the waitlist, please try again.");
                            }
                            else{
                                bot.moderateMoveDJ(users[j].id, Number(qualifier.slice(1).split(' ')[2]));
                            }
                        }
                    }
                }
            }
            break;
        case "!front": //Moves a user to the front of the waitlist with .front [givenUser]
        case ".front": //TODO: sends message when user isn't in waitlist
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 1){
                    for (var j=0; j<users.length; j++){
                        var spaceUsername = qualifier.slice(1).split(' ')[0] + " " + qualifier.slice(1).split(' ')[1];
                        if (users[j].username == qualifier.slice(1).split(' ')[0]){
                            bot.moderateMoveDJ(users[j].id, 1);
                        }
                        else if (users[j].username == spaceUsername){
                            bot.moderateMoveDJ(users[j].id, 1);
                        }
                    }
                }
            }
            break;
        case "!swap": //Swaps two users' spots on the wait list
        case ".swap": //TODO: sends message when user isn't in waitlist
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 1){
                    var user1 = qualifier.split(/@(.+)?/)[1].slice(0, qualifier.split(/@(.+)?/)[1].indexOf("@") - 1);
                    var user2 = qualifier.split(/@(.+)?/)[1].slice(qualifier.split(/@(.+)?/)[1].indexOf("@") + 1);
                    user2 = user2.replace(/\s/g, '');
                    var user1Spot = null;
                    var user2Spot = null;
                    var user1ID = null;
                    var user2ID = null;
                    for (var j=0; j<waitlist.length; j++){
                        if (waitlist[j].username == user1){
                            user1Spot = j + 1;
                            user1ID = waitlist[j].id;
                        }
                        else if (waitlist[j].username == user2){
                            user2Spot = j + 1;
                            user2ID = waitlist[j].id;
                        }
                    }
                    bot.moderateMoveDJ(user1ID, user2Spot);
                    bot.moderateMoveDJ(user2ID, user1Spot);
                }
            }
            break;
        case "!lock": //Locks the waitlist
        case ".lock": //TODO: sends message when waitlist is already locked
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 1 && bouncerCommandsEnabled){
                    bot.moderateLockWaitList(true, false);
                }
            }
            break;
        case "!unlock": //Unlocks the waitlist
        case ".unlock": //TODO: sends message when waitlist is already unlocked
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 1){
                    bot.moderateLockWaitList(false, false);
                }
            }
            break;
        case "!settheme": //Sets the theme message
        case ".settheme":
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 1 && bouncerCommandsEnabled){
                    theme = qualifier;
                    bot.chat("Theme now set to: " + theme);
                }
            }
            break;
        case "!delete":
        case ".delete":
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 1){
                    for (var j=0; j<users.length; j++){
                        if (users[j].username == qualifier.slice(1).trim()){
                            for (var k=chatQueue.length - 1; k > -1; k--){
                                if (users[j].id == chatQueue[k].slice(0, chatQueue[k].indexOf('-'))){
                                    bot.moderateDeleteChat(chatQueue[k]);
                                    chatQueue.splice(k, 1);
                                    k = k + 1;
                                }
                            }
                        }
                    }
                }
            }
            break;
        case "!lockdown": //TODO: needs previous messages deletion
        case ".lockdown": 
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 1 && bouncerCommandsEnabled){
                    if (lockdownEnabled){
                        lockdownEnabled = false;
                        bot.chat("Staff-only chat disabled.");
                    }
                    else{
                        lockdownEnabled = true;
                        bot.chat("Staff-only chat enabled.");
                        for (var j=0; j<users.length; j++){
                            var isStaffMember = false;
                            for (var k=0; k<staff.length; k++){
                                if (staff[k].username == data.un){
                                    isStaffMember = true;
                                }
                            }
                            if (!(isStaffMember)){
                                for (var k=chatQueue.length - 1; k > -1; k--){
                                    if (users[j].id == chatQueue[k].slice(0, chatQueue[k].indexOf('-'))){
                                        bot.moderateDeleteChat(chatQueue[k]);
                                        chatQueue.splice(k, 1);
                                        k = k + 1;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            break;
        case "!kick": //Kicks the user from the room for the selected time (hour/day)
        case ".kick": 
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 1){
                    for (var j=0; j<users.length; j++){
                        var spaceUsername = qualifier.slice(1).split(' ')[0] + " " + qualifier.slice(1).split(' ')[1];
                        if (users[j].username == qualifier.slice(1).split(' ')[0]){
                            if (qualifier.slice(1).split(' ')[1] == "hour"){
                                bot.moderateBanUser(users[j].id, 1, bot.API.BAN.HOUR);
                            }
                            else if (qualifier.slice(1).split(' ')[1] == "day"){
                                bot.moderateBanUser(users[j].id, 1, bot.API.BAN.DAY);
                            }
                            else if (qualifier.slice(1).split(' ')[1] == ""){
                                bot.moderateBanUser(users[j].id, 1, bot.API.BAN.DAY);
                            }
                        }
                        else if (users[j].username == spaceUsername){
                            if (qualifier.slice(1).split(' ')[2] == "hour"){
                                bot.moderateBanUser(users[j].id, 1, bot.API.BAN.HOUR);
                            }
                            else if (qualifier.slice(1).split(' ')[2] == "day"){
                                bot.moderateBanUser(users[j].id, 1, bot.API.BAN.DAY);
                            }
                            else if (qualifier.slice(1).split(' ')[2] == ""){
                                bot.moderateBanUser(users[j].id, 1, bot.API.BAN.DAY);
                            }
                        }
                    }
                }
            }
            break;
        case "!mute": //Mutes the user for the selected time (15/30/45)
        case ".mute": 
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 1){
                    for (var j=0; j<users.length; j++){
                        var spaceUsername = qualifier.slice(1).split(' ')[0] + " " + qualifier.slice(1).split(' ')[1];
                        if (users[j].username == qualifier.slice(1).split(' ')[0]){
                            if (Number(qualifier.slice(1).split(' ')[1]) == 15){
                                bot.moderateMuteUser(users[j].id, 3, bot.API.MUTE.SHORT);
                            }
                            else if (Number(qualifier.slice(1).split(' ')[1]) == 30){
                                bot.moderateMuteUser(users[j].id, 3, bot.API.MUTE.MEDIUM);
                            }
                            else if (Number(qualifier.slice(1).split(' ')[1]) == 45){
                                bot.moderateMuteUser(users[j].id, 3, bot.API.MUTE.LONG);
                            }
                            else if (qualifier.slice(1).split(' ')[1] == ''){
                                bot.moderateMuteUser(users[j].id, 3, bot.API.MUTE.LONG);
                            }
                        }
                        else if (users[j].username == spaceUsername){
                            if (Number(qualifier.slice(1).split(' ')[2]) == 15){
                                bot.moderateMuteUser(users[j].id, 3, bot.API.MUTE.SHORT);
                            }
                            else if (Number(qualifier.slice(1).split(' ')[2]) == 30){
                                bot.moderateMuteUser(users[j].id, 3, bot.API.MUTE.MEDIUM);
                            }
                            else if (Number(qualifier.slice(1).split(' ')[2]) == 45){
                                bot.moderateMuteUser(users[j].id, 3, bot.API.MUTE.LONG);
                            }
                            else if (qualifier.slice(1).split(' ')[2] == ''){
                                bot.moderateMuteUser(users[j].id, 3, bot.API.MUTE.LONG);
                            }
                        }
                    }
                }
            }
            break;
        case "!unmute": //Unmutes the user
        case ".unmute": 
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 1){
                    for (var j=0; j<users.length; j++){
                        if (users[j].username == qualifier.slice(1).trim()){
                            bot.moderateUnmuteUser(users[j].id);
                        }
                    }
                }
            }
            break;

        //Manager+ Commands
        case "!ban": //Permanently bans the user
        case ".ban": 
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 2){
                    for (var j=0; j<users.length; j++){
                        if (users[j].username == qualifier.slice(1).trim()){
                            bot.moderateBanUser(users[j].id);
                        }
                    }
                }
            }
            break;
        case "!unban": //Unbans the user
        case ".unban": 
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 2){
                    for (var j=0; j<users.length; j++){
                        if (users[j].username == qualifier.slice(1).trim()){
                            bot.moderateUnbanUser(users[j].id);
                        }
                    }
                }
            }
            break;
        case "!bouncer+": //Toggles on/off bouncer+ commands the bouncer+ commands
        case ".bouncer+": 
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 2){
                    if (bouncerCommandsEnabled){
                        bouncerCommandsEnabled = false;
                        bot.chat("Bouncer commands disabled.");
                    }
                    else{
                        bouncerCommandsEnabled = true;
                        bot.chat("Bouncer commands enabled.");
                    }
                }
            }
            break;
        case "!user+": //Disables/Enables user commands
        case ".user+":
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 2){ 
                    if (userCommandsEnabled){
                        userCommandsEnabled = false;
                        bot.chat("User commands disabled.");
                    }
                    else{
                        userCommandsEnabled = true;
                        bot.chat("User commands enabled.");
                    }
                }
            }
            break;
        case "!autoskip": //Unbans the user
        case ".autoskip": 
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 2){ 
                    if (autoskipEnabled){
                        autoskipEnabled = false;
                        bot.chat("Autoskip disabled.");
                    }
                    else{
                        autoskipEnabled = true;
                        bot.chat("Autoskip enabled.");
                    }
                }
            }
            break;
        case "!clearchat": //Clears the entire chat except for BA and Admin comments
        case ".clearchat": 
            var isAdmin = false;
            var isBA = false;
            for (var j=0; j<admins.length; j++){
                if (admins[j].username == data.un){
                    isAdmin = true;
                }
            }
            for (var k=0; k<brandAmbassadors.length; k++){
                if (brandAmbassadors[k].username == data.un){
                    isBA = true;
                }
            }
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 2){
                    for (var j=0; j<users.length; j++){
                        if (!(isAdmin) && !(isBA)){
                            for (var k=chatQueue.length - 1; k > -1; k--){
                                if (users[j].id == chatQueue[k].slice(0, chatQueue[k].indexOf('-'))){
                                    bot.moderateDeleteChat(chatQueue[k]);
                                    chatQueue.splice(k, 1);
                                    k = k + 1;
                                }
                            }
                        }
                    }
                    break;
                }
            }
            break;
        case "!join": //Makes the bot join the waitlist
        case ".join":
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 2){
                    bot.djJoin();
                    bot.chat("Joining waitlist!");
                }
            }
            break;
        case "!leave": //Makes the bot leave the waitlist
        case ".leave":
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 2){
                    bot.djLeave();
                    bot.chat("Leaving waitlist.");
                }
            }
            break;

        //Co-Host+ Commands
        case "!blackout": //Mutes all non staff
        case ".blackout":
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 3){
                    for (var j=0; j<users.length; j++){
                        if (users[j].role == 0){
                            bot.moderateMuteUser(users[j].id, 3, bot.API.MUTE.LONG);
                        }
                    }      
                }
            }
            break;
        default:
            if (data.message.indexOf("@")!=-1){ //Checks to see if the user is afk
                var spaceUsername = data.message.slice(data.message.indexOf("@") + 1).split(' ')[0] + " " + data.message.slice(data.message.indexOf("@") + 1).split(' ')[1]
                if (data.un != "DiscoverBot" && data.message.slice(data.message.indexOf("@") + 1).split(' ')[0] in afkList){
                    bot.chat("@" + data.un + " " + data.message.slice(data.message.indexOf("@") + 1).split(' ')[0] + " is afk: " + afkList[data.message.slice(data.message.indexOf("@") + 1).split(' ')[0]]);
                }
                else if (spaceUsername in afkList){
                    bot.chat("@" + data.un + " " + spaceUsername + " is afk: " + afkList[spaceUsername]);
                }
            }
            break;
    }
});
