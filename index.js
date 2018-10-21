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
    let port = process.argv[2] ? process.argv[2] : 8080;
    server.listen(port,()=>{
        console.log(`~ running on port: ${port}`);
        require(`${__dirname}/private/main.js`).startup(app);
    });
}

function stopServer(){
    server.close();
    process.exit(0);
}

//a test

function rebootProcess(){
    watcher.close();
    execSync("npm install --suppress-warnings",{cwd:`${__dirname}`});
    clearTimeout(rebootTimeout);
    setTimeout(()=>process.exit(),5000);   
}

module.exports = {
    stopServer
};

