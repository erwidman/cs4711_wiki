 //check out wiki for more info
 const {should,expect,assert} = require("chai");



//db interface test
const db = require('./private/dbInterface.js');
describe("Working on dbInterface.js",function(){
    
     before(function() {
        let tmp = db.getDB();
        tmp.run('delete from users where username=?',['zigzig']);
        tmp.run('delete from images where comment=?',['This is it']);
        tmp.run('delete from articles where 1=1');
     }); 
   
    it("-Testing createUser",async function(){
        let result = await db.createUser("zigzig","1234");
        console.log("~ userid "+result);
        assert.equal(result>=0,true);
    });

    it("-Testing add image",async function(){
        let result = await db.addImage(100,"100x100","20MB","This is it");
        console.log("~ imageid "+ result);
        assert.equal(result>=0,true);
        let id = result;
        result = await db.getAllImages();
        assert(Array.isArray(result),true);
        expect(result[0]).to.have.property('imageid');
        if(id>=0){
            result = await db.deleteImage(id);
            assert.equal(result,true);
        }
    })

    it("-Testing nonunique username createUser",async function(){
        let result = await db.createUser("zigzig","1234");
        console.log(result);
        assert.notEqual(result,true);
    });

    it("-Testing getUserId",async function(){
        let result = await db.getUserID("zigzig");
        assert.equal(result>0,true);
    });

    it("-Testing login functions",async function(){
        let result = await db.login("zigzig","1234");
        assert.equal(result,true);
    });

    it("-Testing failed login",async function(){
        let result = await db.login("zigzig","aklsjdf;lk");
        assert.notEqual(result,true);
    });

    it("-Testing ipBlacklist addToBlacklist", async function(){
        let result = await db.addToBlacklist("255.255.255.255");
        assert.equal(result,true);
        result = await db.checkBlacklist("255.255.255.255");
        assert.equal(result!==null,true);
    });

    it("-Testing ipBlacklist duplicate add", async function(){
        let result = await db.addToBlacklist("255.255.255.255");
        assert.notEqual(result,true);
    });

    it("-Testing ipBlacklist removeFromBlacklist", async function(){
        let result = await db.removeFromBlacklist("255.255.255.255");
        assert.equal(result,true);
    });

    it("-Testing create article, lock article, and update article",async function(){
        db.createArticle(200,"Another article","sl");
        db.createArticle(2034,"Still article","sl");
        let artid = await db.createArticle(44,"Test Article","This is a test. This is a test");
        assert.equal(artid>0,true);
        let result = await db.lockArticle(artid);
        assert.equal(result,true);
        result = await db.updateArticle(1000,artid,"This is the replaced test");
        console.log(result);
        assert.equal(result,true);
        result = await db.getAllArticles();
        assert.equal(Array.isArray(result),true);
        expect(result[0]).to.have.property('articleid');
        result = await db.getArticleHistory(artid);
        assert.equal(Array.isArray(result),true);
        result = await db.getArticle(artid);
        expect(result).to.have.property('articleid');
    });


});



const axios = require('axios');
const querystring = require('querystring');

function createRequest(command,params,auth){
    let url = `http://localhost:8080/request?command=${command}&${querystring.stringify(params)}`;
    if(auth){
        return axios.get(url,{headers:{
            authorization : auth
        }});
    }
    else
        return axios.get(url);
}

describe("Working appBinding.js",function(){
    let server;
    before(function(){
        server = require(`${__dirname}/index.js`);
        let tmp = db.getDB();
        tmp.run('delete from users where username=?',['anotherAnon']);
    });

    it("-check anon exist",async function(){
        let id = await db.getUserID('anon');
        assert(id>=0,true);
    });

    it("-createUser",async function(){
       let response= await new Promise((resolve, reject) => {
         createRequest('createUser',['anotherAnon'],'somepassword')
         .then((response)=>{
            resolve(response);
         })
         .catch((err)=>{
            resolve(false);
         });
       });
       assert(response!==false);
    });

    it("-login",async function(){
         let res = await createRequest('login',['anotherAnon'],'somepassword');
         console.log(res.data);
         assert(res.data===true);
    });

    it("-removeUser",async function(){
        let res = await createRequest('removeUser',['anotherAnon'],"zigzig?~?~?1234");
       assert(res.data===true);
    });

    after(function(){
        server.stopServer();
    });

});