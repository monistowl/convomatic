/**
 * ChatController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

//Global object for waiting rooms
sails.waitingrooms = {};
//sails.waitingrooms[3] = ["ksadj1234clkjnelckjna", "eroiucnw934cneo3vra09"];

module.exports = {

    //receive message from socket, route to others in room, log if logging enabled on project
    transmit: async function(req, res) {
        //console.log('hit transmit');
        // Get the ID of the currently connected socket
        //var socketId = sails.sockets.id(req.socket);
        var n = req.param('name');
        var t = req.param('text');
        var c = req.param('chatid');
        var s = req.socket.id; //originating socket

        //if logging
        var m = await Message.create({name: n, text: t, socket: s}).fetch();

        await Chat.addToCollection(c, 'messages').members([m.id]);

        // Send message to clients
        sails.sockets.broadcast(c, 'transmission', {name: n, text: t, socket: s});

    },

    //put prompts &c in chat logs
    logservermsg: async function(req, res) {
        console.log('hit logsvrmsg');
        var n = req.param('name');
        var t = req.param('text');
        var c = req.param('chatid');
        var s = req.socket.id;

        var m = await Message.create({name: n, text: t, socket: s}).fetch();

        await Chat.addToCollection(c, 'messages').members([m.id]);
    },

    //serve embed page at /chat/embed/:projectid/:name
    embed: function(req,res) {
        var projectid = req.param('projectid');
        var name = req.param('name');

        if (!projectid) return res.send("No id specified.",500);

        Project.findOne({id: projectid}, function (err,project){
          if (err) return res.send(err,500);
          if (!project) return res.send("Project "+projectid+" not found.",404);

          res.view('chat/embed', {
            project: project,
            name: name,
            layout: false
          });
        });
    },

    //when socket connects, add to project waiting room and wait for quorum
    arrive: async function(req,res) {
        if (!req.isSocket) { return res.badRequest(); }

        var s = req.socket.id;
        var q = req.param('quorum');
        var p = req.param('projectid');

        //console.log('PROJECT: ' + JSON.stringify(p) + '\nSOCKETID: ' + req.socket.id);

        //check if waiting room exists for project, initialize to empty queue array if not
        if (!sails.waitingrooms[p]) { sails.waitingrooms[p] = []; }

        sails.waitingrooms[p].push(s);

        //check if waiting room has enough participants, if so join to channel and start chat

        if (sails.waitingrooms[p].length >= q) {
            var c = await Chat.create().fetch();
            await Project.addToCollection(p, 'chats').members([c.id]);

            for(var i=0; i<q; i++) {
                //console.log(sails.waitingrooms[p].shift());
                sails.sockets.join(sails.waitingrooms[p].shift(), c.id);
            }
            sails.sockets.broadcast(c.id, 'converse', {chatid: c.id, socket: s});
            //insert server messages





            // var m = await Message.create({name: 'SERVER', text: 'test', socket: 'SERVER'}).fetch();
            // //change createdat here
            // await Chat.addToCollection(c, 'messages').members([m.id]);



        }

    },


    //log chat



    //insert server msg once not x times

};
