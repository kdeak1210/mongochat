const mongo = require('mongodb').MongoClient;

// This will run socket.io on port 4000
const client = require('socket.io').listen(4000).sockets;

// Connect to mongo. ('mongodb/localhost/database')
mongo.connect('mongodb://127.0.0.1/mongochat', function(err, db) {
  if (err) {
    throw err;
  }

  console.log('Mongo connected...');

  // Connect to socket.io
  client.on('connection', function() {
    let chat = db.collection('chats');  // create the 'chats' collection

    // Create function to send status
    sendStatus = function(s) {
      socket.emit('status', s); // emit passes stuff from server to frontend
    }

    // Get chats from 'chats' collection
    chat.find().limit(100).sort({_id:1}).toArray(function(err, res) {
      if (err) {
        throw err;
      }

      // Emit the messages to the client
      socket.emit('output', res);
    });

    // Handle input events
    socket.on('input', function(data) {
      let name = data.name;
      let message = data.message;

      // Check for name and message (ensure included)
      if (name == '' || message =='') {
        // Send error status
        sendStatus('Please enter a name and message');
      } else {
        // Insert message
        chat.insert({name: name, message: message}, function() {
          client.emit('output', [data]);

          // Send status object
          sendStatus({
            message: 'Message sent',
            clear: true
          });
        });
      }
    });

    // Handle clear when client initiates a clear
    socket.on('clear', function() {
      // Remove all chats from collection
      chat.remove({}, function() {
        // Emit cleared event to let client know
        socket.emit('cleared');
      });
    });
  });
});
