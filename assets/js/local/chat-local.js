var mychat;

$(function()
{
    // Display an incoming message
    renderMessage = function(name, text, source, imageURL) {

      console.log(imageURL);

      // Get the chat transcript container.
      var chatTranscriptEl = $('#chat-transcript');

      // Declare a var to hold the new line in the transcript.
      var chatLineEl;

      if(source == 'system') {
          //Style as admin chat line with optional image
          if(imageURL) {
              chatLineEl = $('<li class="chat-line list-group-item-danger list-group-item row"><div class="col col-2 px-0 font-weight-bold">' + name + '</div><div class="col col-10 px-0 font-weight-bold"><img class="img-fluid rounded float-center" style="max-height:400px" src="' + imageURL+ '"></img>' + text + '</div></li>');
          } else {
              chatLineEl = $('<li class="chat-line list-group-item-danger list-group-item row"><div class="col col-2 px-0 font-weight-bold">' + name + '</div><div class="col col-10 px-0 font-weight-bold">' + text + '</div></li>');
          }
      } else {
          if(source == io.socket._raw.id) {
              //Style as self chat line
              chatLineEl = $('<li class="chat-line list-group-item-info list-group-item row"><div class="col col-2 px-0 font-weight-bold">' + name + '<small> (you)</small></div><div class="col col-10 px-0">' + text + '</div></li>');
          } else {
              //Style as other chat line
              chatLineEl = $('<li class="chat-line list-group-item row"><div class="col col-2 px-0 font-weight-bold">' + name + '</div><div class="col col-10 px-0">' + text + '</div></li>');
          }
      }

      chatTranscriptEl.append(chatLineEl);

      $('#chat-transcript').css("margin-bottom", $('#chat-controls').height()) && $('html, body').animate( { scrollTop: $(document).height() }, "fast" );


    };

    //Listen for incoming messages
    io.socket.on('transmission', function(msg) {

        renderMessage(msg.name, msg.text, msg.socket);

    });

    // Listen for confirmation everyone is present, then display prompts
    io.socket.on('converse', function(params) {

        mychat = params.chatid;

        var t = 3000; //delay between welcome and prompts

        renderMessage('SYSTEM', SAILS_LOCALS.project.welcome, 'system');
        //enable controls here

        for (let i=0; i<SAILS_LOCALS.project.prompts.length; i++) {
            setTimeout(function() {
                renderMessage('SYSTEM', SAILS_LOCALS.project.prompts[i].text, 'system', SAILS_LOCALS.project.prompts[i].url);
            }, t);
            t += SAILS_LOCALS.project.prompts[i].delay * 1000;
        }

        setTimeout(function() {
            renderMessage('SYSTEM', SAILS_LOCALS.project.farewell, 'system');
            //disable controls here
        }, t);

    });

    // Send chat to server whenever the "send-chat" button is pressed, or enter is pressed inside the chat input.
    $('#chat-send-button').click(function() {

        var chatInputEl = $('#chat-input');

        io.socket.get('/chat/transmit', {name: SAILS_LOCALS.name, text: chatInputEl.val(), chatid: mychat });

        chatInputEl.val('');

    });

    // When enter is pressed in the chat input, "click" the send button.
    $('#chat-input').keydown(function(e) {

      if (e.keyCode === 13) {
        $('#chat-send-button').click();
      }

    });

    // Join project waiting room as soon as page loads
    io.socket.get('/chat/arrive', {name: SAILS_LOCALS.name, projectid: SAILS_LOCALS.project.id, quorum: SAILS_LOCALS.project.quorum});
    renderMessage('SYSTEM', 'Waiting for ' + SAILS_LOCALS.project.quorum + ' participants to arrive...', 'system');
});
