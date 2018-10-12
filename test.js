 //check out wiki for more info
 const {should,expect,assert} = require("chai");



//db interface test
const db = require('./private/dbInterface.js');
describe("Working on dbInterface.js",function(){
    
   
    it("-Testing createUser",async function(){
        db.removeUser("zigzig");
        let result = await db.createUser("zigzig","1234");
        assert.equal(result,true);
    });

    it("-Testing nonunique username createUser",async function(){
        let result = await db.createUser("zigzig","1234");
        assert.notEqual(result,true);
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
        assert.equal(result,true);
    });



});
