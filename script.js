(function ($) {
    // Thanks to BrunoLM (https://stackoverflow.com/a/3855394)
    $.QueryString = (function (paramsArray) {
        let params = {};

        for (let i = 0; i < paramsArray.length; ++i) {
            let param = paramsArray[i].split("=", 2);

            if (param.length !== 2) continue;

            params[param[0]] = decodeURIComponent(param[1].replace(/\+/g, " "));
        }

        return params;
    })(window.location.search.substr(1).split("&"));
})(jQuery);

Chat = {
    load: function (callback) {
        callback(true);
    },

    write: function () {
        if ($("#image_me").css("display") === "block") {
            $("#image_me").css("display", "none");
        } else {
            $("#image_me").css("display", "block");
        }
    },

    connect: function (channel) {
        Chat.load(function () {
            console.log("jChat: Connecting to IRC server...");
            var socket = new ReconnectingWebSocket("wss://irc-ws.chat.twitch.tv", "irc", { reconnectInterval: 2000 });

            socket.onopen = function () {
                console.log("jChat: Connected");
                socket.send("PASS blah\r\n");
                socket.send("NICK justinfan" + Math.floor(Math.random() * 99999) + "\r\n");
                socket.send("CAP REQ :twitch.tv/commands twitch.tv/tags\r\n");
                socket.send("JOIN #kdrkitten \r\n");
            };

            socket.onclose = function () {
                console.log("jChat: Disconnected");
            };

            socket.onmessage = function (data) {
                data.data.split("\r\n").forEach((line) => {
                    if (!line) return;
                    var message = window.parseIRC(line);
                    switch (message.command) {
                        case "PING":
                            socket.send("PONG " + message.params[0]);
                            return;
                        case "JOIN":
                            console.log("jChat: Joined channel #kdrkitten");
                            return;
                        case "USERNOTICE":
                            return;
                        case "PRIVMSG":
                            if (message.params[0] !== "#" + channel || !message.params[1]) return;
                            var nick = message.prefix.split("@")[0].split("!")[0];

                            if (message.params[1].toLowerCase() === "!camhälp" && typeof message.tags.badges === "string") {
                                var flag = false;
                                message.tags.badges.split(",").forEach((badge) => {
                                    badge = badge.split("/");
                                    if (badge[0] === "broadcaster" || nick.toLowerCase() == "dschogo" || nick.toLowerCase() == "dave_in_game") {
                                        flag = true;
                                        return;
                                    }
                                });
                                if (flag) {
                                    console.log("jChat: Refreshing emotes...");
                                    Chat.write();
                                    return;
                                }
                            }
                            return;
                    }
                });
            };
        });
    },
};

$(document).ready(function () {
    Chat.connect($.QueryString.channel ? $.QueryString.channel.toLowerCase() : "kdrkitten");
});
