/**
 * ProjectController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

    index: function (req,res) {

    	Project.find({}).exec(function(err, projects){
    		if (err) return res.send(err, 500);

    		res.redirect('/welcome');
    	});
    },

	'new': function(req,res) {
        var testprompts = [
            { text: "p1", url: "u1", delay: "60" },
            { text: "p2", url: "u2", delay: "60" },
        ];
		res.view({
            testprompts: testprompts
        });
	},

    create: function(req,res) {
        var params = _.extend(req.query || {}, req.params || {}, req.body || {});

        console.log("\n\nORIGINAL PARAMS:\n" + JSON.stringify(params) + "\n\n");

        //parse dynamic prompt list, probably there's a better way to do this
        var prompts = [];

        for(var i = 0; i < params.ptexts.length; i++) {
            prompts.push({
                text: params.ptexts[i],
                url: params.purls[i],
                delay: params.pdelays[i]
            });
        }

        //console.log("\n\nPROMPTS:\n" + JSON.stringify(prompts) + "\n\n");

        delete params.ptexts;
        delete params.purls;
        delete params.pdelays;

        params.prompts = prompts;

        //console.log("\n\nNEW PARAMS:\n" + JSON.stringify(params) + "\n\n");

      	Project.create(params, function projectCreated (err, createdProject) {

      		if (err) return res.send(err,500);

      		res.redirect('/project/show/'+params.id);
      	});
    },

    show: function (req,res) {

      	var id = req.param('id')

      	if (!id) return res.send("No id specified.", 500);

      	Project.findOne({id: id}, function projectFound(err, project) {
      		if(err) return res.sender(err,500);
      		if(!project) return res.send("Project "+id+" not found", 404);
            //console.log(project);

      		res.view({
      			project: project,
      		});
      	});
    },

    edit: function (req,res) {
        var id = req.param('id');

        if (!id) return res.send("No id specified.",500);

        Project.findOne({id: id}, function projectFound (err,project){
          if (err) return res.send(err,500);
          if (!project) return res.send("Project "+id+" not found.",404);

          res.view({
            project: project,
          });
        });
    },


    update: function (req,res) {

        var params = _.extend(req.query || {}, req.params || {}, req.body || {});
        var id = params.id;

        if (!id) return res.send("No id specified.",500);

        console.log("\n\nORIGINAL PARAMS:\n" + JSON.stringify(params) + "\n\n");

        //parse dynamic prompt list, probably there's a better way to do this
        var prompts = [];

        for(var i = 0; i < params.ptexts.length; i++) {
            prompts.push({
                text: params.ptexts[i],
                url: params.purls[i],
                delay: params.pdelays[i]
            });
        }

        console.log("\n\nPROMPTS:\n" + JSON.stringify(prompts) + "\n\n");

        delete params.ptexts;
        delete params.purls;
        delete params.pdelays;

        params.prompts = prompts;

        console.log("\n\nNEW PARAMS:\n" + JSON.stringify(params) + "\n\n");

        Project.update(id, params, function projectUpdated(err, updatedProject) {
            if (err) {
                res.redirect('/project/edit/'+id);
                } else {
                res.redirect('/project/show/'+id);
            }
        });
    },


	destroy: function (req,res) {
		var id = req.param('id');
		if (!id) return res.send("No id specified.",500);

		Project.find(id, function foundProject(err, project) {
			if (err) return res.send(err,500);
			if (!project) return res.send("No project with that id exists.",404);

			Project.destroy(id, function projectDestroyed(err) {
				if (err) return res.send(err,500);

				return res.redirect('/welcome');
			});

		})
	},

    messages: async function (req,res) {
        var id = req.param('id');
        if (!id) return res.send("No id specified.",500);

        var chats = await Chat.find({project: id}).populate('messages');

        res.view({chats: chats});
    },

    csv: async function (req,res) {
        var id = req.param('id');
        if (!id) return res.send("No id specified.",500);

        var chats = await Chat.find({project: id}).populate('messages');

        var s = ""
        s += 'TIME,CHAT,SOCKET,NAME,MESSAGE\n'
        chats.forEach(function(chat) {
            chat.messages.forEach(function(message) {
                s += message.createdAt + ',' + chat.id + ',' + message.socket + ',' + message.name + ',' + message.text + '\n';
            });
        });

        res.set('Content-Type', 'text/csv');
        res.setHeader('Content-disposition', 'attachment; filename=chats.csv');
        res.status(200).send(s);
    },

};
