$(function()
{
    $(document).on('click', '.btn-add', function(e)
    {
        e.preventDefault();

        var promptsDynamicList = $('#prompts-dynamic-list');
        //console.log(promptsDynamicList);

        var currentRow = $(this).parents('.input-group:first');
        //console.log(currentRow);

        var newRow = $(currentRow.clone()).appendTo(promptsDynamicList);

        newRow.find('input').val('');
        promptsDynamicList.find('.input-group:not(:last) .btn-add')
            .removeClass('btn-add').addClass('btn-remove')
            .removeClass('btn-success').addClass('btn-danger')
            .html('<span class="fa fa-minus"></span>');
    }).on('click', '.btn-remove', function(e)
    {
		$(this).parents('.input-group:first').remove();
		e.preventDefault();
		return false;
	});



    $(document).on('click', '#log', function(e) {
        //_.extend(this, SAILS_LOCALS);
        var promptsList = document.getElementById("prompts-dynamic-list");
        var prompts = [];
        for (var i = 0; i < promptsList.childNodes.length; i++) {
            prompts.push({text: "asdf", url: "asdf", delay: 60});
        }
        console.log(JSON.stringify(prompts));
    });

});
