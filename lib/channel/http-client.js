
var CHANNEL = require("../channel"),
    UTIL = require("modules/util"),
    HTTP_CLIENT = require("modules/http-client"),
    JSON = require("modules/json");

// TODO: Make this configurable
var HOST = "localhost";
var PORT = 8099;

const HEADER_PREFIX = 'x-wf-';

var HttpClientChannel = exports.HttpClientChannel = function () {
    if (!(this instanceof exports.HttpClientChannel))
        return new exports.HttpClientChannel();

    this.__construct();

    this.HEADER_PREFIX = HEADER_PREFIX;
}

HttpClientChannel.prototype = CHANNEL.Channel();

HttpClientChannel.prototype.flush = function(applicator, bypassTransport)
{
    var self = this;
    if (typeof applicator === "undefined")
    {
        var parts = {};

        applicator = {
            setMessagePart: function(key, value)
            {
                parts[key] = value;
            },
            getMessagePart: function(key)
            {
                if (typeof parts[key] === "undefined")
                    return null;
                return parts[key];
            },
            flush: function(clannel)
            {
                if (UTIL.len(parts)==0)
                    return false;

                var data = [];
                UTIL.forEach(parts, function(part)
                {
                    data.push(part[0] + ": " + part[1]);
                });
                data = data.join("\n");

                HTTP_CLIENT.request({
                    host: HOST,
                    port: PORT,
                    path: "/wildfire-server",
                    method: "POST",
                    headers: {
                        "content-type": "application/x-www-form-urlencoded",
                        "content-length": data.length,
                        "connection": "close"
                    },
                    data: data
                }, function(response)
                {
                    if (response.status == 200)
                    {
                        try {
                            var data = JSON.decode(response.data);
                            if (data.success === true)
                            {
                                // success!!
                            }
                            else
                                console.error("ERROR Got error from wildfire server: " + data.error);                    
                        } catch(e) {
                            console.error("ERROR parsing JSON response from wildfire server (error: " + e + "): " + response.data);                    
                        }
                    }
                    else
                        console.error("ERROR from wildfire server (status: " + response.status + "): " + response.data);                    
                }, function(e)
                {
                    if (!/ECONNREFUSED/.test(e))
                        console.error("ERROR sending message to wildfire server: " + e);                    
//                    else
//                        module.print("\0red([Wildfire: Not Connected]\0)\n");                    
                });
                return true;
            }
        };
    }
    return self._flush(applicator);
}
