const querystring = require("querystring");
const fs = require("fs");
const { URLSearchParams } = require('url');
const fetch = require("node-fetch");

module.exports = class {
  constructor() {
    this._baseURL = "https://api.monzo.com";
    this.storeToken = this.storeToken.bind(this);
    this._tokenPromise = this.getTokenLocal()
      .then(auth => {
        this._auth = auth;
        this._token = auth.access_token;
        return this._token;
      })
      .catch(e => {
  
        const AUTH_EP = `https://auth.monzo.com/?${querystring.stringify({
          client_id: process.env.MONZO_CLIENT_ID,
          redirect_uri: process.env.MONZO_REDIRECT_URI,
          response_type: "code"
        })}`;
      
        console.log("Open the below link to auth:");
        console.log(AUTH_EP);
      
        this._tokenPromise = new Promise(resolve => {
          this._resolveToken = resolve;
        })
      })
    
  }
  set token(token) {
    !this._token && this._resolveToken(token);
    this._token = token;
  }
  getTokenLocal() {
    return new Promise((resolve, reject) => fs.readFile("./monzo.json", (err, data) => {
      if (err || !data) {
        return reject(err);
      }
      resolve(JSON.parse(data));
    }));
  }
  writeTokenLocal(token) {
    return new Promise(resolve => fs.writeFile("./monzo.json", JSON.stringify(token), () => {
      resolve(token);
    }));
  }
  getToken() {
    return this._token ? Promise.resolve(this._token) : this._tokenPromise
      .then(() => this._token);
  }
  resolveCode(code) {
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("client_id", process.env.MONZO_CLIENT_ID);
    params.append("client_secret", process.env.MONZO_CLIENT_SECRET);
    params.append("redirect_uri", process.env.MONZO_REDIRECT_URI);
    params.append("code", code);
    return fetch("https://api.monzo.com/oauth2/token", { method: 'POST', body: params })
      .then(r => r.json())
      .then(this.storeToken)
  }
  refreshToken(refreshToken) {
    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("client_id", process.env.MONZO_CLIENT_ID);
    params.append("client_secret", process.env.MONZO_CLIENT_SECRET);
    params.append("refresh_token", refreshToken);
    return fetch("https://api.monzo.com/oauth2/token", { method: 'POST', body: params })
      .then(r => r.json())
      .then(this.storeToken)
  }
  refresh() {
    this.refreshToken(this._auth.refresh_token)
  }
  storeToken(result) {
    this._auth = result;
    this.token = result.access_token;
    this.writeTokenLocal(result);
  }
  request(url, params, attempted) {
    return this.getToken()
      .then(token => {
        return fetch(url, Object.assign({}, params, {
          headers: Object.assign({}, (params && params.headers) || {}, {
            Authorization: `Bearer ${token}`
          })
        }))
        .then(res => {
          switch (res.status) {
            case 401: {
              !attempted && this.refresh()
                .then(() => this.request(url, params, attempted))
            }
            default: {
              return res
            }
          }
        })
      })
  }
}