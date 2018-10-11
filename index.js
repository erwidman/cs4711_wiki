const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);
app.use(express.static('public'));

const port = Number(process.argv[2]);
if(!port){
    console.error("!!ERROR : NO PORT SPECIFIED\n");
    process.exit();
}

server.listen(port,()=>{
    console.log(`::running on port: ${port}`);
    init();
})


function init(){

}