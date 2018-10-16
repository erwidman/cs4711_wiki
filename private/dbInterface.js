const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = 'd6F3Efeq';
const dbFile = `${__dirname}/../data/main.db`;
//test 3


//_________________GENERAL USE DB FUNCS
var global_db;
function getDB(){
    if(!global_db)
        global_db = new sqlite3.Database(dbFile);
    //global_db.exec('BEGIN');
    return global_db;
}
function closeConnection(){
    if(global_db){
        global_db.close();
        global_db = null;
    }
}
function commitDB(db){
    //db.exec("COMMIT");
}
function standardCallback(err,db,res,rej){
    commitDB(db);
    if(err){
        console.error(err);
        res(err);
    }
    else
        res(true);
}
function runSQL(sql,bindings,res,rej){
    let db = getDB();
    db.run(sql,bindings,(err)=>standardCallback(err,db,res,rej));
}


//_________________HELPERS
function encrypt(data){
    const cipher = crypto.createCipher(algorithm,password);
    data = new Buffer(data,'utf8');
    return Buffer.concat([cipher.update(data),cipher.final()]);;
}
function decript(data){
    const decipher = crypto.createDecipher(algorithm,password);
    data = new Buffer(data,'utf8');
    return Buffer.concat([decipher.update(data) , decipher.final()]);
}
function getTimestamp(){
    let date = new Date();
    let timestamp = `${date.getMonth()+1}-${date.getDate()}-${date.getFullYear()} [${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}]`;
    return timestamp;
}



//_________________DB SPECIFIC ROTINES
function removeUser(username){
    return new Promise((res,rej)=>runSQL('delete from users where username=?',[username],res,rej)); 
}


function createUser(username,password){
    return new Promise((res,rej)=>{
        password = encrypt(password).toString('base64');
        runSQL(`insert into users(username,password) values (?,?)`,[username,password],res,rej);
    });
}


function login(username,password){
    var db;
    return new Promise((res,rej)=>{
        db = getDB();
        let sql = `select password from users where username=?`;
        db.get(sql,[username],(err,arow)=>{
            if(err){
                commitDB(db);
                rej(err);
            }
            else{
                res(arow.password);
            }
           
        });
    })
    .then((actualPassword)=>{
       password = encrypt(password);
       actualPassword = new Buffer(actualPassword,'base64');
       return Buffer.compare(password,actualPassword)==0;
    })
    .then((success)=>{
    return new Promise((res,rej)=>{
         if(!success){
            commitDB(db);
            res(false);
        }
        let sql = `update users set lastOnline=? where username=?`;
        db.run(sql,[getTimestamp(),username],(err)=>{
            commitDB(db);
            if(err)
                rej(err)
            else
                res(true);
        });
    });
    });
}

function removeFromBlacklist(ip){
    return new Promise((res,rej)=>runSQL(`delete from ipBlacklist where ipaddr=?`,[ip],res,rej));
}

function addToBlacklist(ip){
    return new Promise((res,rej)=>runSQL(`insert into ipBlacklist(ipaddr) values (?)`,[ip],res,rej));
}


function getUserID(username){
    let db = getDB();
    return new Promise((res,rej)=>{
        db.get('select userid from users where username=?',[username],(err,row)=>{
            if(err){
                console.error(err);
                res(false);
            }
            else
                res(row.userid);
        });
    });
    
}


function createArticle(owner,title,content){
    let timestamp = getTimestamp();
    return new Promise((res,rej)=>{
        runSQL(`insert into articles(owner,initUploadDate,lastUpdated,content,title) values (?,?,?,?,?)`,[owner,timestamp,timestamp,content,title],res,rej);
    })
    .then((success)=>{
        if(success != true)
            return false;
        let db = getDB();
        return new Promise((res,rej)=>{
            db.get('select articleid from articles where initUploadDate=?',[timestamp],(err,row)=>{
                if(err)
                    res(err);
                else
                    res(row.articleid);
            });
        });
    });
}

function lockArticle(articleid){
    return new Promise((res,rej)=>runSQL(`update articles set isEditable=0 where articleid=?`,[articleid],res,rej));
}

var updateInProgress = false;
function updateArticle(userid,articleid,updatedContent){
    if(updateInProgress){
        setTimeout(()=>updateArticle(userid,articleid,updatedContent),100);
        return false;
    }
    updatedInProgress = true;
    let timestamp = getTimestamp();
    return new Promise((res,rej)=>{
        let db = getDB();
        db.exec("BEGIN");
        let sql = `update articles set content=?, lastUpdated=? where articleid=?`;
        db.run(sql,[updatedContent,timestamp,articleid],(err)=>{
            if(err){
                updateInProgress = false;
                res(err);
            }
            else
                res(true);
        });
    })
    .then((success)=>{
        let db = getDB();
        if(success!==true){
            db.exec("ROLLBACK");
            updateInProgress = false;
            console.error(success);
            return err;
        }
        else{
            let sql = 'insert into articleHistory(articleid,userid,updateTime,newContent) values (?,?,?,?)';
            return new Promise((res,rej)=>{
            db.run(sql,[articleid,userid,timestamp,updatedContent],(err)=>{
                if(err){
                    db.exec("ROLLBACK");
                    res(err);
                }
                else{
                    db.exec('COMMIT');
                    res(true);
                }
                updateInProgress = false;
               
            });
            });
        }

    });
}


function addImage(owner,dimensions,filesize,comment){
    return new Promise((res,rej)=>runSQL('insert into images(uploadTime,owner,dimensions,filesize,comment) values (?,?,?,?,?)',[getTimestamp(),owner,dimensions,filesize,comment],res,rej));
}



process.on('exit',closeConnection);


module.exports = {
    createUser,
    login,
    removeUser,
    addToBlacklist,
    removeFromBlacklist,
    createArticle,
    lockArticle,
    updateArticle,
    getUserID,
    addImage
};
