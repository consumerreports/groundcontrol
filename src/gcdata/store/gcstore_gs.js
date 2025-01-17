"use strict";

const fs = require("fs");
const readline = require("readline");
const Gclog = require("../../gclog/gclog.js");
const Gcstore_base = require("./gcstore_base.js");
const { google } = require("googleapis");

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const TOKEN_PATH = "../gcenv/token.json";

/**
* Google Sheets data store
* @constructor 
* @extends Gcstore
* @param {Object} config - configuration
* @param {string} config.cred_path - path to credentials.json 
*/
function Gcstore_gs({cred_path = "../gcenv/credentials.json"} = {}) {
   Gcstore_base.call(this);
   this.type = "GOOGLE SHEETS";
   this.cred_path = cred_path;
   this.sheets = google.sheets("v4");
   this.client = null;
}

Gcstore_gs.prototype = Object.create(Gcstore_base.prototype);

Gcstore_gs.prototype.init = function() {
	return new Promise((resolve, reject) => {
        function authorize(credentials, callback) {
            const {client_secret, client_id, redirect_uris} = credentials.installed;
            this.client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
            
            // Check if we have previously stored a token.
            fs.readFile(TOKEN_PATH, (err, token) => {
                if (err) {
                    return get_new_token(this.client, callback);
                }
            
                this.client.setCredentials(JSON.parse(token));
                callback(this.client);
                resolve();
            }); 
        }

        function get_new_token(client, callback) {
                const authUrl = client.generateAuthUrl({
                    access_type: 'offline',
                scope: SCOPES,
            });

            Gclog.log(`[GCDATA] Authorize Ground Control to use your Google Sheets account by visiting this URL: ${authUrl}`);
            
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
        
            rl.question("[GCDATA] Enter the code from that page here: ", (code) => {
                rl.close();

                client.getToken(code, (err, token) => {
                    if (err) {
                        reject("Error while trying to retrieve access token" + err);
                    }

                    client.setCredentials(token);
                    
                    // Store the token to disk for later program executions
                    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                        if (err) {
                            reject(err);
                        }
                        
                        Gclog.log(`[GCDATA] Token stored to ${TOKEN_PATH}`);
                        resolve();
                    });
             
                    callback(client);
                });
            });
        }

        Gclog.log("[GCDATA] Using Google Sheets module");

        fs.readFile(this.cred_path, (err, content) => {
            if (err) {
                reject("Error loading client secret file:" +  err);
            }
      
            authorize.bind(this, JSON.parse(content), () => {})();
        });
    });
}

Gcstore_gs.prototype.put = async function(key, val) {
    // Try to retrieve the sheet associated with the specified key...
    // if we find it, overwrite it -- if not, create a new sheet and return its key
    // Assumes that val is a spreadsheet resource: https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets
    // TODO: the overwrite case doesn't work yet!
    try {
        const res = await this.get(key);

        const request = {
            spreadsheetId: res,
            range: "DEBUG_PLACEHOLDER", // TODO: make me work
            valueInputOption: "DEBUG_PLACEHOLDER", // TODO: make me work
            resource: {}, // TODO: make me work
            auth: this.client
        };

        return await this.sheets.spreadsheets.values.update(request).data;
    } catch(err) {
        Gclog.log(`[GCDATA] (${this.type}) No record found for sheet '${key}' -- creating new sheet...`);
        const res = await this._create(val); // TODO: are errors handled here? 
        Gclog.log(`[GCDATA] (${this.type}) Success! Created sheet ${res}`);
    }
}

Gcstore_gs.prototype.get = async function(key) {
    return await this.sheets.spreadsheets.get({spreadsheetId: key, auth: this.client});
}

Gcstore_gs.prototype._create = function(resource) {
    return new Promise((resolve, reject) => {
        this.sheets.spreadsheets.create({
            auth: this.client,
            resource: resource,
            fields: "spreadsheetId"
        }, (err, spreadsheet) => {
            if (err) {
                // TODO: handle error
                reject(err);
                return;
            }
            
            resolve(spreadsheet.data.spreadsheetId);
        });
    });
}

module.exports = Gcstore_gs;
