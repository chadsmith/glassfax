var util = require('util'),
  express = require('express'),
  path = require('path'),
  fs = require('fs'),
  Phaxio = require('phaxio'),
  request = require('request'),
  im = require('imagemagick'),
  googleapis = require('googleapis'),
  settings = {
    server: {
      hostname: 'mktgdept.com',
      port: '5555'
    },
    google: {
      client_id: '000000000000.apps.googleusercontent.com',
      client_secret: 'bbbbbbbbbbbbbbbbbbbbbbbb'
    },
    phaxio: {
      api_key: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      api_secret: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      caller_id: '13165555555',
      to_number: '13165551212'
    }
  },
  phaxio = new Phaxio(settings.phaxio.api_key, settings.phaxio.api_secret),
  template = function(fax) {
    for(var html = [], i = 0; i < fax.num_pages; i++)
      html.push('<article><figure><img src="http://' + settings.server.hostname + ':' + settings.server.port + '/' + fax.id + (fax.num_pages > 1 ? '-' + i : '') + '.jpg" style="height: 100%;"></figure><section><h1 class="text-large">Fax ' + (fax.from_number ? 'Received' : 'Sent') + '</h1><p class="text-x-small">' + (fax.from_number ? fax.from_number : fax.recipients[0].number) + '</p><hr><p class="text-normal">Page ' + (i + 1) + ' of ' + fax.num_pages + '</p></section></article>');
    return html.join('');
  },
  OAuth2Client = googleapis.OAuth2Client,
  oauth2Client = {},
  app = express();

app.configure(function() {
  app.use(express.bodyParser({ uploadDir: path.join(__dirname, '/tmp') }));
  app.use(express.static(__dirname + '/public'));
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
});

app.get('/', function(req, res) {
  if(!oauth2Client.credentials) {
    oauth2Client = new OAuth2Client(settings.google.client_id, settings.google.client_secret, 'http://' + settings.server.hostname + ':' + settings.server.port + '/oauth2callback');
    res.redirect(oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: 'https://www.googleapis.com/auth/glass.timeline'
    }));
  }
  else {
    googleapis.discover('mirror', 'v1').execute(function(err, client) {
      client.mirror.subscriptions.insert({
        callbackUrl: 'https://mirrornotifications.appspot.com/forward?url=http://' + settings.server.hostname + ':' + settings.server.port + '/subcallback',
        collection: 'timeline',
        operation: [ 'INSERT' ]
      }).withAuthClient(oauth2Client).execute(function(err, result) {
        console.log('mirror.subscriptions.insert', util.inspect(result));
      });
      client.mirror.contacts.insert({
        displayName: 'Fax',
        id: 'glassfax',
        imageUrls: [ 'http://' + settings.server.hostname + ':' + settings.server.port + '/contact_image.png' ],
        acceptTypes: [ 'image/*' ]
      }).withAuthClient(oauth2Client).execute(function(err, result) {
        console.log('mirror.contacts.insert', util.inspect(result));
      });
    });
    res.send(200);
  }
});

app.get('/oauth2callback', function(req, res) {
  oauth2Client.getToken(req.query.code, function(err, tokens) {
    oauth2Client.credentials = tokens;
    res.redirect('/');
  });
});

app.post('/fax_received', function(req, res) {
  res.send(200);
  var fax = JSON.parse(req.body.fax);
  console.log('/fax_received', util.inspect(fax));
  fs.rename(req.files.filename.path, path.join(__dirname, '/tmp/', fax.id + '.pdf'), function(err) {
    if(err)
      throw err;
    im.convert(['-density', '400', '-resize', '25%', path.join(__dirname, '/tmp/', fax.id + '.pdf'), path.join(__dirname, '/public/', fax.id + '.jpg')], function(err, stdout) {
      if(err)
        throw err;
      googleapis.discover('mirror', 'v1').execute(function(err, client) {
        client.mirror.timeline.insert({
          html: template(fax),
          menuItems: [
            {
              action: 'VIEW_WEBSITE',
              payload: 'http://' + settings.server.hostname + ':' + settings.server.port + '/fax/' + fax.id + '-' + fax.num_pages
            },
            {
              action: 'DELETE'
            }
          ]
        }).withAuthClient(oauth2Client).execute(function(err, result) {
          console.log('mirror.timeline.insert', util.inspect(result));
        });
      });
    });
  });
});

app.post('/fax_sent', function(req, res) {
  var fax = JSON.parse(req.body.fax);
  console.log('/fax_sent', util.inspect(fax));
  phaxio.faxFile({ id: '' + fax.id }, function(err, buffer) {
    if(err)
      throw err;
    fs.writeFile(path.join(__dirname, '/tmp/', fax.id + '.pdf'), buffer, 'binary', function(err) {
      if(err)
        throw err;
      im.convert(['-density', '400', '-resize', '25%', path.join(__dirname, '/tmp/', fax.id + '.pdf'), path.join(__dirname, '/public/', fax.id + '.jpg')], function(err, stdout) {
        if(err)
          throw err;
        googleapis.discover('mirror', 'v1').execute(function(err, client) {
          client.mirror.timeline.insert({
            html: template(fax),
            menuItems: [
              {
                action: 'VIEW_WEBSITE',
                payload: 'http://' + settings.server.hostname + ':' + settings.server.port + '/fax/' + fax.id + '-' + fax.num_pages
              },
              {
                action: 'DELETE'
              }
            ]
          }).withAuthClient(oauth2Client).execute(function(err, result) {
            console.log('mirror.timeline.insert', util.inspect(result));
          });
        })
      });
    });
  });
});

app.post('/fax_sent/:id', function(req, res) {
  res.send(200);
  var fax = JSON.parse(req.body.fax);
  console.log('/fax_sent/' + req.params.id, util.inspect(fax));
  phaxio.faxFile({ id: '' + fax.id }, function(err, buffer) {
    if(err)
      throw err;
    fs.writeFile(path.join(__dirname, '/tmp/', fax.id + '.pdf'), buffer, 'binary', function(err) {
      if(err)
        throw err;
      im.convert(['-density', '400', '-resize', '25%', path.join(__dirname, '/tmp/', fax.id + '.pdf'), path.join(__dirname, '/public/', fax.id + '.jpg')], function(err, stdout) {
        if(err)
          throw err;
        googleapis.discover('mirror', 'v1').execute(function(err, client) {
          client.mirror.timeline.update({ id: req.params.id }, {
            html: template(fax),
            menuItems: [
              {
                action: 'VIEW_WEBSITE',
                payload: 'http://' + settings.server.hostname + ':' + settings.server.port + '/fax/' + fax.id + '-' + fax.num_pages
              },
              {
                action: 'DELETE'
              }
            ]
          }).withAuthClient(oauth2Client).execute(function(err, result) {
            console.log('mirror.timeline.update', util.inspect(result));
          });
        })
      });
    });
  });
});

app.get('/fax/:id-:pages', function(req, res) {
  res.render('fax', { id: req.params.id, pages: req.params.pages });
});

app.post('/subcallback', function(req, res) {
  res.send(200);
  var id = req.body.itemId;
  console.log('/subcallback', util.inspect(req.body));
  if(req.body.operation == 'INSERT')
    googleapis.discover('mirror', 'v1').execute(function(err, client) {
      client.mirror.timeline.get({ id: id }).withAuthClient(oauth2Client).execute(function(err, result) {
        console.log('mirror.timeline.get', util.inspect(result));
        if(result.attachments && result.attachments.length)
          request({
            method: 'GET',
            uri: result.attachments[0].contentUrl,
            headers: {
              'Authorization': [ oauth2Client.credentials.token_type, oauth2Client.credentials.access_token ].join(' ')
            },
            encoding: 'binary'
          }, function(err, req, body) {
            fs.writeFile(path.join(__dirname, '/tmp/', id + '.jpg'), body, 'binary', function(err) {
              if(err)
                throw err;
              phaxio.sendFax({
                  to: settings.phaxio.to_number,
                  caller_id: settings.phaxio.caller_id,
                  filenames: path.join(__dirname, '/tmp/', id + '.jpg'),
                  callback_url: 'http://' + settings.server.hostname + ':' + settings.server.port + '/fax_sent/' + id
                }, function(err, res) {
                  if(err)
                    throw err;
                  console.log('phaxio.sendFax', res);
              });
            });
          });
      });
    });
});

app.get('/number', function(req, res) {
  res.send(settings.phaxio.to_number);
});

app.get('/number/:digits', function(req, res) {
  settings.phaxio.to_number = '' + req.params.digits;
  res.send('to_number set to ' + settings.phaxio.to_number);
});

app.listen(settings.server.port);
