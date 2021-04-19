const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly'
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

module.exports = new class {
  constructor() {
    // Load client secrets from a local file.
    this._authingPromise = new Promise((resolve, reject) => fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Gmail API.
      authorize(JSON.parse(content), auth => {
        this._auth = auth;
        resolve(auth);
      });
    }));
  }
  _getAuth() {
    return this._auth ? Promise.resolve(this._auth) : this._authingPromise;
  }
  /**
   * Watch a given topic
   * @param {*} promiseHandler 
   */
  watch(query) {
    return this._getAuth()
      .then(auth => new Promise((resolve, reject) => {
        const gmail = google.gmail({version: 'v1', auth});
        gmail.users.watch({auth: auth, userId: 'me', requestBody: query }, (err, res) => {
          if (err) {
            return reject(err);
          } else {
            return resolve(res);
          }
        });
      }))
  }
  /**
   * Watch a given topic
   * @param {*} promiseHandler 
   */
  getHistory(startHistoryId) {
    return this._getAuth()
      .then(auth => new Promise((resolve, reject) => {
        const gmail = google.gmail({version: 'v1', auth});
        gmail.users.history.list({auth: auth, userId: 'me', startHistoryId }, (err, res) => {
          if (err) {
            return reject(err);
          } else {
            return resolve(res);
          }
        });
      }))
  }
  getEmailHTMLByMessageId(messageId) {
    return this._getAuth()
      .then(auth => {
        const gmail = google.gmail({version: 'v1', auth});
        // Retreive the actual message using the message id
        return new Promise((resolve, reject) => {
          gmail.users.messages.get({auth: auth, userId: 'me', 'id': messageId, format: "full"}, function(err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);
                return reject(new Error("Absorbable"));
            } // or like this
            // console.log(response.data.payload);
            let part = (response.data.payload.parts && response.data.payload.parts.find(function(part) {
              return part.mimeType == 'text/html';
            }));

            let body = response.data.payload.body;
            // console.log(part);
            if ((!part || !part.body) && (!body || !body.data)) {
              // console.log(part);
              return reject(new Error("Absorbable"));
            }
            console.log("[GMAIL] Processing: " + response.data.snippet.substring(0, 30));
            let message_raw = part && part.body ? part.body.data : body.data;
      
            let data = message_raw;  
            // console.log(typeof message_raw);
            let buff = new Buffer(data, 'base64');  
            let text = buff.toString();
            resolve(text);
        })
      })
    })
  }
  /**
   * Get the recent email from your Gmail account
   *
   * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
   */
  getRecentEmails(promiseHandler, q) {
    return this._getAuth().then((auth) => {
      return new Promise((resolve) => {
        const gmail = google.gmail({version: 'v1', auth});
        // Only get the recent email - 'maxResults' parameter
        gmail.users.messages.list({auth: auth, userId: 'me', q: q || "label:^smartlabel_receipt", maxResults: 900}, function(err, response) {
          if (err) {
            console.log('The API returned an error: ' + err);
            return;
          }
    
          let prom = Promise.all(response.data.messages.map((message, index) => {
            let message_id = message.id;
      
            // Retreive the actual message using the message id
            let promis = new Promise((resolve, reject) => {
              setTimeout(() => gmail.users.messages.get({auth: auth, userId: 'me', 'id': message_id, format: "full"}, function(err, response) {
                if (err) {
                    console.log('The API returned an error: ' + err);
                    return reject(new Error("Absorbable"));
                } // or like this
                // console.log(response.data.payload);
                let part = (response.data.payload.parts && response.data.payload.parts.find(function(part) {
                  return part.mimeType == 'text/html';
                }));

                let body = response.data.payload.body;
                // console.log(part);
                if ((!part || !part.body) && (!body || !body.data)) {
                  // console.log(part);
                  return reject(new Error("Absorbable"));
                }
                console.log("[GMAIL] Processing: " + response.data.snippet.substring(0, 30));
                let message_raw = part && part.body ? part.body.data : body.data;
          
                let data = message_raw;  
                // console.log(typeof message_raw);
                let buff = new Buffer(data, 'base64');  
                let text = buff.toString();
                resolve(text);
              }), index * 500);
            })
            promiseHandler(promis);
            return promis;
          }));
          resolve(prom);
        });
      })
    })
  }
}



/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}