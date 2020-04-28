const express = require("express");
const app = express();
const server = require("http").createServer(app);
const fs = require('fs');
const Stateless = require("cloudstate").Stateless;

app.use("/site", express.static("public"));

server.listen(3000);
//console.log("Http Servee running on " + server.address().address + ":" + server.address().port);


let indexPage = Buffer.from("");
fs.readFile('./public/index.html', function(err, data) {
  console.log("data", data.length);
  indexPage = data;
});

function getShopPage(user){
  console.log("**** showShopPage!!!!! " + process.cwd() , user);  
  return {
    content_type: "text/html",
    data: indexPage.toString("base64")
  }
}


let bundleJs = Buffer.from("");
fs.readFile('./public/build/bundle.js', function(err, data) {
  console.log("data", data.length);
  bundleJs = data;
});

function getBundleJs(user){
  console.log("**** bundleJs!!!!! " + process.cwd() , user);  
  return {
    content_type: "text/javascript",
    data: bundleJs.toString("base64")
  }
}

function getBundleImg(imgRequest){
    console.log("**** imgRequest!!!!! " + process.cwd() , imgRequest);  
    var img = fs.readFileSync('./public/imgs/'+imgRequest.img).toString("base64");
    return {
        content_type: "image/png",
        data: img
      }
}

const cloudstate = new Stateless(
    "shop.proto",
    "cloudstate.samples.shopping.frontend.Shop"    
);

cloudstate.commandHandlers = {
    GetShopPage: getShopPage,
    GetBundleJs: getBundleJs,
    GetBundleImg: getBundleImg
};
  
module.exports = cloudstate;

const opts = {};

if (process.env.PORT) {
    opts.bindPort = process.env.PORT;
}

cloudstate.start(opts);