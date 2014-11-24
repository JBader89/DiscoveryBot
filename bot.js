var PlugAPI = require('plugbotapi'); //Use 'git clone git@github.com:plugCubed/plugAPI.git' in your node_modules

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
var staff = null;
var users = null;
var roomScore = null;

//Event which triggers when the bot joins the room
bot.on('roomJoin', function(data) {
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
    console.log("I'm live!");
});

//Event which triggers when new DJ starts playing a song
bot.on('advance', function(data) {
    bot.getMedia(function(plugMedia){
        media = plugMedia;
    });
    bot.getWaitList(function(plugWaitlist){
        waitlist = plugWaitlist;
    });
    bot.getDJ(function(plugDJ){
        dj = plugDJ;
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
    });
    bot.getStaff(function(plugStaff){
        staff = plugStaff;
    });
    bot.getUsers(function(plugUsers){
        users = plugUsers;
    });
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
});

//Still figuring out how this works
bot.on('floodChat', function(data) {
    bot.chat("flood!");
});

//Event which triggers with a user joins the room
bot.on('userJoin', function(data) {
    //console.log(data);
    bot.getStaff(function(plugStaff){
        staff = plugStaff;
    });
    bot.getUsers(function(plugUsers){
        users = plugUsers;
    });
});

//Event which triggers when anyone chats
bot.on('chat', function(data) {
    var command=data.message.split(' ')[0];
    var firstIndex=data.message.indexOf(' ');
    var qualifier="";
    if (firstIndex!=-1){
        qualifier = data.message.substring(firstIndex+1, data.message.length);
    }
    switch (command)
    {
        //User Commands
        case "!bot":
            bot.chat("Well hey there! @"+data.un);
            break;
        case "!theme":
            bot.chat("We're using a custom theme for the event which is currently set to [will add later]");
            break;
        case "!rules":
            bot.chat("Check out the room's rules here: http://rdjshowcase.net/rules");
            break;
        case "!commands":
            bot.chat("Check out my commands here: http://rdjshowcase.net/commands");
            break;
        case "!fb":
        case "!facebook":
            bot.chat("Check out plug's Facebook here: https://www.facebook.com/plugdj");
            break;
        case "!twitter":
            bot.chat("Check out plug's Twitter here: https://twitter.com/plugdj");
            break;
        case "!support":
            bot.chat("For plug's support, go here: http://support.plug.dj/");
            break;
        case "!blog":
            bot.chat("For plug's blog, go here: http://blog.plug.dj/");
            break;
        case "!soundcloud":
            bot.chat("Check out *DJ*'s soundcloud here: [will add later]");
            break;
        case "!website":
            bot.chat("Check out our website here: http://rdjshowcase.net/");
            break;
        case "!register":
            bot.chat("Register for the Showcase here: http://rdjshowcase.net/register");
            break;
        case "!lateregister":
            bot.chat("If you're late to the Showcase, register here: [will add later]");
            break;
        case "!info":
            bot.chat("For info on Showcase, go here: http://rdjshowcase.net/event");
            break;
        case "!dc":
        case "!disconnected":
            bot.chat("!dc");
            break;
        case "!afk":
            bot.chat("!afk");
            break;

        //Res DJ+ Commands
        case "!rdj":
        case "!resdj":
        case "!residentdj":
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 0){
                    bot.chat("To become a Resident DJ, you must register here: http://rdjshowcase.net/register");
                }
            }
            break;
        case "!event":
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 0){
                    bot.chat("The Resident DJ Showcase was created to help appreciate plug's producers and artists.");
                }
            }
            break;
        case "!ba":
        case "!brandambassador":
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 0){
                    bot.chat("A Brand Ambassador is a global moderator which helps out plug. More info here: http://blog.plug.dj/brand-ambassadors/");
                }
            }
            break;
        case "!admin":
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 0){
                    bot.chat("An Admin is someone who works for plug. They're what keeps this site running.");
                }
            }
            break;
        case "!waitlist":
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 0){
                    bot.chat("To get on the waitlist, you must be a Resident DJ and part of the current event.");
                }
            }
            break;
        case "!staff":
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 0){
                    bot.chat("Staff members are chosen by the room's hosts/founders. Please do not ask for a rank.");
                }
            }
            break;

        //Bouncer+ Commands
        case ".warn": //Skips a user playing an off-genre song
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 1){
                    bot.chat("@" + dj.username + " Your tune does not fall within the established genre of the Chillout Mixer. Please type .noplay or .yesplay for more info.");
                    bot.moderateForceSkip(dj.id);
                }
            }
            break;
        case ".banuser": //Bans a user from the room permanently with .banuser [givenUser]
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 1){
                    for (var j=0; j<users.length; j++){
                        if (users[j].username == qualifier){
                            bot.moderateBanUser(users[j].id);
                        }
                    }
                }
            }
            break;
        case ".move": //Moves a user in the waitlist with .move [givenUser], [givenSpot]
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 1 && staff[i].role > 1){
                    for (var j=0; j<users.length; j++){
                        if (users[j].username == qualifier.split(' ')[0]){
                            if (Number(qualifier.split(' ')[1]) > waitlist.length){
                                bot.chat("Sorry, there are only " + waitlist.length + " people in the waitlist, please try again.");
                            }
                            else{
                                bot.moderateMoveDJ(users[j].id, Number(qualifier.split(' ')[1]));
                            }
                        }
                    }
                }
            }
            break;
        case ".front": //Moves a user to the front of the waitlist with .front [givenUser]
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 1 && staff[i].role > 1){
                    for (var j=0; j<users.length; j++){
                        if (users[j].username == qualifier.split(' ')[0]){
                            bot.moderateMoveDJ(users[j].id, 1);
                        }
                    }
                }
            }
            break;
        case ".woot": //Makes the bot cast an upvote
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 1){
                    bot.chat("I can dig it!");
                    bot.woot();
                }
            }
            break;
        case ".meh": //Makes the bot cast a downvote
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 1){
                    bot.chat("Please... make it stop :unamused:");
                    bot.meh();
                }
            }
            break;
        case ".props": //Makes the bot give props to the user
        case ".propsicle":
            bot.chat("Nice play! @"+dj.username);
            break;
        case ".join": //Makes the bot join the waitlist
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 1){
                    bot.djJoin();
                    bot.chat("Joining waitlist!");
                }
            }
            break;
        case ".leave": //Makes the bot leave the waitlist
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 1){
                    bot.djLeave();
                    bot.chat("Leaving waitlist.");
                }
            }
            break;
        case ".skip": //Makes the bot skip the current song
            for (var i=0; i<staff.length; i++){
                if (staff[i].username == data.un && staff[i].role > 1){
                    bot.chat("Skipping!");
                    bot.moderateForceSkip(dj.id);
                }
            }
            break;
        default: //Checks for users that are set to be autotranslated whenever they chat
            break;
    }
});