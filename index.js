const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);
const {execSync} = require('child_process');
const fs = require('fs');



//watch for restart
const watcher = require('chokidar').watch([`${__dirname}/private`,`${__dirname}/index.js`], {ignored: /(^|[\/\\])\../}).on('change', (path,event) => {
    //print proc
    console.log(`~ change at path: ${path}\n~ restarting process`);
    rebootProcess();
});

startServer();
function startServer(){
    app.use(express.static(__dirname+'/public'));
    let port = Number(process.argv[2]) ? process.argv[2] : 8080;
    server.listen(port,()=>{
        console.log(`~ running on port: ${port}`);
        require(`${__dirname}/private/main.js`).startup(app);
    });
}

function stopServer(){
    server.close();
    setTimeout(()=>{
         process.exit(0);
     },500);
   
}

//a test test`

function rebootProcess(){
    watcher.close();
    execSync("npm install --suppress-warnings",{cwd:`${__dirname}`});
    setTimeout(()=>process.exit(),5000);   
}

module.exports = {
    stopServer
};

