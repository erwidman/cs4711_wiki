const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);
const {execSync} = require('child_process');
const fs = require('fs');

const db = require(__dirname+'/private/dbInterface.js');


app.use(express.static(__dirname+'/public'));

//watch for restart
var chokidar = require('chokidar');
// One-liner for current directory, ignores .dotfiles
chokidar.watch([`${__dirname}/private`,`${__dirname}/index.js`], {ignored: /(^|[\/\\])\../}).on('change', (path,event) => {
    console.log(path);
    rebootProcess();
});
// another test

startServer();
function startServer(){
    var port;
    if(process.argv[2])
        port = process.argv[2];
    else
        port = 8080;
    server.listen(port,()=>{
        console.log(`::running on port: ${port}`);
    });
}

var rebootTimeout;
function rebootProcess(){
    execSync("npm install",{cwd:`${__dirname}`});
    clearTimeout(rebootTimeout);
    rebootTimeout = setTimeout(()=>process.exit(),5000);   
}


module.exports = {startServer};