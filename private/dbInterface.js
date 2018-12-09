const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = 'd6F3Efeq';
const dbFile = `${__dirname}/../data/main.db`;



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
        res(err);
    }
    else
        res(true);
}
function runSQL(sql,bindings,res,rej){
    let db = getDB();
    db.run(sql,bindings,(err)=>standardCallback(err,db,res,rej));
}
function checkExistSQL(sql,bindings,property,res,rej){
    let db = getDB();
    db.get(sql,bindings,(err,row)=>{
        if(!row || !row[property])
            res(err)
        else
            res(row[property]);
    });
}

function getRowSQL(sql,bindings,property,res,rej){
    let db = getDB();
    db.get(sql,bindings,(err,row)=>{
        if(!row || !row[property])
            res(err)
        else
            res(row);
    });
}


function getAllSQL(sql,bindings,res,rej){
    let db = getDB();
    db.all(sql,bindings,(err,rows)=>{
        if(!rows)
            res(err)
        else
            res(rows)
    });
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
    })
    .then((result)=>{
        if(result!==true)
            return result;
        let db = getDB();
        return new Promise((res,rej)=>{
        db.get('select userid from users where username=?',[username],(err,row)=>{
            if(err || !(row))
                res(err);
            else
                res(row.userid);
        });
        });
    });
}


function login(username,password){
    var db;
    return new Promise((res,rej)=>{
        db = getDB();
        let sql = `select password from users where username=?`;
        db.get(sql,[username],(err,arow)=>{
            if(err){
                rej(err);
            }
            else{
                if(arow.password)
                    res(arow.password);
                else 
                    rej('no_such_user');
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

function checkBlacklist(ip){
    return new Promise((res,rej)=>checkExistSQL('select * from ipBlacklist where ipaddr=?',[ip],'ipaddr',res,rej));
}

function getUserID(username){
    let db = getDB();
    return new Promise((res,rej)=>{
        db.get('select userid, isAdmin from users where username=?',[username],(err,row)=>{
            if(err){
                console.error(err);
                res(false);
            }
            else
                res(row);
        });
    });
    
}

function checkAdmin(username){
    return new Promise((res,rej)=>getRowSQL('select * from users where username==?',[username],'isAdmin',res,rej));
}

function makeAdmin(username){
    return new Promise((res,rej)=>runSQL('update users set isAdmin=1 where username=?',[username],res,rej));
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
    let db = getDB();
    return new Promise((finalres,finalrej)=>{
    db.serialize(()=>{
    let timestamp = getTimestamp();
    new Promise((res,rej)=>{
        db.exec('BEGIN');
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
            finalres(success);
        }
        else{
            let sql = 'insert into articleHistory(articleid,userid,updateTime,newContent) values (?,?,?,?)';
            db.run(sql,[articleid,userid,timestamp,updatedContent],(err)=>{
                if(err){
                    db.exec("ROLLBACK");
                    finalres(err);
                }
                else{
                    db.exec('COMMIT');
                    finalres(true);
                }
            });
        }

    })
    });
    });
}


function addImage(owner,dimensions,filesize,comment){
    let timestamp = getTimestamp();
    return new Promise((res,rej)=>runSQL('insert into images(uploadTime,owner,dimensions,filesize,comment) values (?,?,?,?,?)',[getTimestamp(),owner,dimensions,filesize,comment],res,rej))
    .then((result)=>{
        //console.log(result);
        if(result !== true)
            return false;
        let db = getDB();
        return new Promise((res,rej)=>{
            db.get('select * from images where owner=? order by imageid desc',[owner],(err,row)=>{
                if(!row || !row.imageid)
                    res(err)
                else
                    res(row.imageid);
            });
        });
       
    });
}


function deleteImage(imageid){
    return new Promise((res,rej)=>runSQL("delete from images where imageid=?",[imageid],res,rej));
}



//_______________________________GETTERS

function getImage(imageid){
    return new Promise((res,rej)=>getRowSQL('select * from images left join users on images.owner=users.userid where imageid=?',[imageid],'imageid',res,rej));
}

function getAllImages(){
    return new Promise((res,rej)=>getAllSQL('select * from images',[],res,rej));
}

function getAllArticles(){
    return new Promise((res,rej)=>getAllSQL('select articleid, owner, initUploadDate, lastUpdated, isEditable, title from articles',[],res,rej));
}

function getArticle(articleid){
    return new Promise((res,rej)=> getRowSQL('select * from articles LEFT JOIN users on articles.owner = users.userid where articleid=?',[articleid],'articleid',res,rej));
}

function getArticleHistory(articleid){
    return new Promise((res,rej)=>getAllSQL('select articleid, articleHistory.userid, updateTime, newContent, username, lastOnline, isAdmin from articleHistory left JOIN users on articleHistory.userid=users.userid where articleid=?',[articleid],res,rej));
}



//_______________________________

process.on('exit',closeConnection);

module.exports = {
    createUser,
    login,
    removeUser,
    addToBlacklist,
    removeFromBlacklist,
    checkBlacklist,
    createArticle,
    lockArticle,
    updateArticle,
    getUserID,
    addImage,
    deleteImage,
    getDB,
    getImage,
    getAllImages,
    getAllArticles,
    getArticle,
    getArticleHistory,
    checkAdmin,
    makeAdmin
};
