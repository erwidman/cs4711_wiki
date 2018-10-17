const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);
const {execSync} = require('child_process');
const fs = require('fs');

const db = require(__dirname+'/private/dbInterface.js');

//watch for restart
require('chokidar').watch([`${__dirname}/private`,`${__dirname}/index.js`], {ignored: /(^|[\/\\])\../}).on('change', (path,event) => {
    //print proc
    console.log(`~ change at path: ${path}\n~ restarting process`);
    rebootProcess();
});

startServer();
function startServer(){
    app.use(express.static(__dirname+'/public'));


    let port = process.argv[2] ? process.argv[2] : 8080;
    server.listen(port,()=>{
        console.log(`~ running on port: ${port}`);
    });
}

var rebootTimeout;
function rebootProcess(){
    execSync("npm install",{cwd:`${__dirname}`});
    clearTimeout(rebootTimeout);
    rebootTimeout = setTimeout(()=>process.exit(),5000);   
}


module.exports = {startServer};