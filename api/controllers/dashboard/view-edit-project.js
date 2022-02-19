module.exports = {


  friendlyName: 'View edit project',


  description: 'Display "Edit project" page.',


  exits: {

    success: {
      viewTemplatePath: 'pages/dashboard/edit-project'
    }

  },


  fn: async function (inputs, exits) {

      p = await Project.find({id: this.req.params.id});
      //console.log(p[0]);
      return exits.success({project: p[0]});

  }


};
