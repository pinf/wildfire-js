

const RECEIVER_ID = "http://registry.pinf.org/cadorn.org/wildfire/@meta/receiver/transport/0";

var MD5 = require("modules/md5");
var STRUCT = require("modules/struct");
var JSON = require("modules/json");
//var HTTP = require("http");
var MESSAGE = require("./message");
var RECEIVER = require("./receiver");


var Transport = exports.Transport = function(options) {
    if (!(this instanceof exports.Transport))
        return new exports.Transport(options);
    this.options = options;
}

Transport.prototype.newApplicator = function(applicator) {
    return Applicator(this, applicator);
}

Transport.prototype.serviceDataRequest = function(key) {
    return require("wildfire").getBinding().formatResponse({
        "contentType": "text/plain"
    }, this.getData(key));
}

Transport.prototype.getUrl = function(key) {
    return this.options.getUrl(key);
}

Transport.prototype.setData = function(key, value) {
    return this.options.setData(key, value);
}

Transport.prototype.getData = function(key) {
    return this.options.getData(key);
}


var Applicator = function(transport, applicator) {
    if (!(this instanceof Applicator))
        return new Applicator(transport, applicator);
    this.transport = transport;
    this.applicator = applicator;
    this.buffer = {};
}

Applicator.prototype.setMessagePart = function(key, value) {
    this.buffer[key] = value;
}

Applicator.prototype.getMessagePart = function(key) {
    if(!this.buffer[key]) return null;
    return this.buffer[key];
}

Applicator.prototype.flush = function(channel) {

    var data = [];
    var seed = [];

    // combine all message parts into one text block
    for( var key in this.buffer ) {
        data.push(key + ": " + this.buffer[key]);
        if(data.length % 3 == 0 && seed.length < 5) seed.push(this.buffer[key]);
    }
    
    // generate a key for the text block
    var key = STRUCT.bin2hex(MD5.hash(Math.random() + ":" + module.path + ":" + seed.join("")));

    // store the text block for future access
    this.transport.setData(key, data.join("\n"));
    
    // create a pointer message to be sent instead of the original messages
    var message = MESSAGE.Message();
    message.setProtocol('http://registry.pinf.org/cadorn.org/wildfire/@meta/protocol/component/0');
    message.setSender('http://pinf.org/cadorn.org/wildfire/packages/lib-js/lib/transport.js');
    message.setReceiver(RECEIVER_ID);
    message.setData(JSON.encode({"url": this.transport.getUrl(key)}));
    
    // send the pointer message through the channel bypassing all transports and local receivers
    channel.enqueueOutgoing(message, true);
    return channel.flush(this.applicator, true);
}

exports.newReceiver = function(channel) {
    var receiver = RECEIVER.Receiver();
    receiver.setId(RECEIVER_ID);
    receiver.addListener({
        onMessageReceived: function(context, message) {
            try {
                context.transporter = RECEIVER_ID;

throw new Error("OOPS!!!");
/*
                // make a sync secondary request
                var data = HTTP.read(JSON.decode(message.getData()).url);
                if(data) {
                    channel.parseReceived(data, context, {
                        "skipChannelOpen": true,
                        "skipChannelClose": true
                    });
                }
*/
            } catch(e) {
                console.warn(e);
            }
        }
    });
    return receiver;
}

