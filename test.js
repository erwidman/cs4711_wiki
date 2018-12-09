 //check out wiki for more info
 const {should,expect,assert} = require("chai");
 const server = require(`${__dirname}/index.js`);


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
        assert.equal(result>=0,true);
    });

    it("-Testing add image",async function(){
        let result = await db.addImage(100,"100x100","20MB","This is it");
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
        assert.notEqual(result,true);
    });

    it("-Testing getUserId",async function(){
        let result = await db.getUserID("zigzig");
        console.log(result);
        expect(result).to.have.property('userid')
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
        db.createArticle(782,"Another article","sl");
        db.createArticle(2034,"Still article","sl");
        let artid = await db.createArticle(44,"Test Article","This is a test. This is a test");
        assert.equal(artid>0,true);
        let result = await db.lockArticle(artid);
        assert.equal(result,true);
        result = await db.updateArticle(780,artid,"This is the replaced test");
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
    before(function(){
        
        let tmp = db.getDB();
        db.makeAdmin('zigzig');
        tmp.run('delete from users where username=?',['anotherAnon']);
        tmp.run('delete from ipBlacklist where 1=1');
        db.addImage(100,"100x100","20MB","This is it");

    });

    it("-check anon exist",async function(){
        let id = await db.getUserID('anon');
        expect(id).to.have.property('userid')
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
         assert(res.data===true);
    });

    it("-removeUser",async function(){
        let res = await createRequest('removeUser',['anotherAnon'],"zigzig | 1234");
       assert(res.data===true);
    });


    it('-addToBlacklist',async function(){
        let res = await createRequest('addToBlacklist',['255.255.255.255'],"zigzig | 1234");
        assert(res.data === true);
    });

    it('-removeFromBlacklist',async function(){
        let res = await createRequest('removeFromBlacklist',['255.255.255.255'],"zigzig | 1234");
        assert(res.data ===true);
    });

    it("-createArticle, lockArticle, updateArticle, getArticle, and getArticleHistory",async function(){
        let res = await createRequest('createArticle',[1,'rest test','some content'],"");
        assert(Number(res.data)>0);
        let id = res.data;
        res = await createRequest('lockArticle',[id],"zigzig | 1234");
        assert(res.data===true);
        res = await createRequest('updateArticle',[22,id,"updated content"],"");
        assert(res.data===true);
        res = await createRequest('getArticle',[id],"");
        expect(res.data).to.have.property('articleid');
        res = await createRequest('getArticleHistory',[id],"");
        console.log(res.data);
        expect(res.data[0]).to.have.property('articleid');

    });

    it("-getUserid",async function(){
        let res = await createRequest('getUserID',['zigzig'],'zigzig | 1234');
        console.log(res.data);
        expect(res.data).to.have.property('userid');
    });

    it("-addImage, getIm age",async function(){
        let res = await createRequest('addImage',[1,'500x1','20mb','a nice pic'],'');
        assert(res.data>0);
        let id = res.data;
        res = await createRequest('getImage',[id],"");
        expect(res.data).to.have.property('imageid');
        res = await createRequest('deleteImage',[id],"");
        assert(res.data===true);

    });

    it("-getAllImages",async function(){
        let res = await createRequest('getAllImages',[],"");
        expect(res.data[0]).to.have.property('imageid');
    });

    it('-getAllArticles',async function(){
        let res = await createRequest('getAllArticles',[],"");
        expect(res.data[0]).to.have.property('articleid');
    });

    


    after(function(){
        server.stopServer();
    });

});