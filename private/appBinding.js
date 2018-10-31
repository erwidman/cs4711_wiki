const striptags = require('striptags');
const fs = require('fs');



function collectArgs(params){
    let index =0;
    let final = [];

    while(params[index+'']){
        final.push(params[index]);
        index++;
    }
    return final;
}

function verifyAuth(auth,db){
    

    let user;
    let pass;
    return new Promise((resolve, reject) => {
        if(!auth)
            reject('invalid_auth');
        auth = auth.split(' | ');
        user = auth[0];
        pass = auth[1];
        resolve();
    })
    .then(()=>db.checkAdmin(user))
    .then((row)=>{
        return new Promise((resolve, reject) => {
          if(!row)
            reject('invalid_auth');
          else
            resolve(db.login(user,pass));
        });
    })
    then((login) => {
        return new Promise((resolve, reject) => {
            if(!login)
                reject('invalid_auth');
            else 
                resolve();
        });
    });
}


const routines = {
    createUser : function(args,db,auth){
        return new Promise((resolve, reject) => {
            let uname = striptags(args[0]);
            db.createUser(uname,auth)
            .then((result) => {
                if(typeof result !== 'object')
                    resolve(result);
                else{
                    console.error(result);
                    reject('unable_to_create_user');
                }
            })
            .catch((err)=>reject(err));
            

        });
    },
    login : function(args,db,auth){
        return new Promise((resolve, reject) => {
            let uname = striptags(args[0]);
            db.login(uname,auth)
            .then((result)=>resolve(result))
            .catch((err)=>reject(err));
        });
    },
    removeUser : function(args,db,auth){
        return new Promise((resolve, reject) => {
            uname = args[0];
            verifyAuth(auth,db)
            .then(()=>{
                db.removeUser(uname)
                .then((stat)=>{
                    if(stat===true)
                        resolve(true);
                    else
                        reject('failed_to_remove');
                });
            })
            .catch((err)=>reject(err));
        });
    },
    addToBlacklist : function(args,db,auth){
        return new Promise((resolve, reject) => {
          
            
           verifyAuth(auth,db)
           .then(()=>db.addToBlacklist(args[0]))
           .then((stat) => {
            if(stat===true)
                resolve(true);
            else
                reject('failed_to_add');
           })
           .catch((err)=>{
                console.error(err);
                reject('invalid_auth')
            });
        });
        
    },
    removeFromBlacklist : function(args,db,auth){
        return new Promise((resolve, reject) => {
           verifyAuth(auth,db)
           .then(()=>db.removeFromBlacklist(args[0]))
           .then((stat) =>{
                if(stat===true)
                    resolve(true);
                else
                    reject('failed_to_remove');
           })
           .catch((err)=>{
                console.error(err);
                reject('invalid_auth');
            });
        });
    },
    createArticle : function(args,db,auth){
        return new Promise((resolve, reject) => {
              let owner = Number(args[0]);
              let title = striptags(args[1]);
              let content = striptags(args[2]);
              db.createArticle(owner,title,content)
              .then((row)=>{
                if(row)
                    resolve(row);
                else
                    reject(row);
              })
              .catch((err)=>reject(err));
        });
    },
    lockArticle : function(args,db,auth){
        return new Promise((resolve, reject) => {
            let id = Number(args[0]);
            verifyAuth(auth,db)
            .then(()=>db.lockArticle(id))
            .then((stat) => {
                if(stat === true)
                    resolve(true);
                else
                    reject('failed_to_lock');
            })
            .catch((err) => reject('invalid_auth'));
            });   
    },
    updateArticle : function(args,db,auth){
        return new Promise((resolve, reject) => {
          let content = striptags(args[2]);
          db.updateArticle(args[0],args[1],content)
          .then((stat) => {
            if(stat===true)
                resolve(true)
            else
                reject('unable_to_update');
          })
          .catch((err)=>reject(err));
        });
    },
    getUserID : function(args,db,auth){
        return new Promise((resolve, reject) => {
          db.getUserID(args[0])
          .then((result)=>{
            if(result>0)
                resolve(result);
            else 
                reject('no_such_user');
          })
          .catch((err)=>reject(err));
        })
    },
    addImage : function(args,db,auth){
        return new Promise((resolve, reject) => {
            let dim = striptags(args[1]);
            let filesize = striptags(args[2]);
            let comment = striptags(args[3]);
            db.addImage(args[0],dim,filesize,comment)
            .then((result)=>{
                if(result>0)
                    resolve(result);
                else
                    reject('unable_to_create_img');
            })
            .catch((err)=>reject(err));
        });
    },
    deleteImage : function(args,db,auth){
        return new Promise((resolve, reject) => {
          db.deleteImage(args[0])
          .then((result)=>{
            if(result===true)
                resolve(true);
            else
                reject('failed_to_delete');
            })
          .catch((err)=>reject(err));
        });
    },
    getImage : function(args,db,auth){
        return new Promise((resolve, reject) => {
          db.getImage(args[0])
          .then((result) => resolve(result))
          .catch((err)=>reject(err));;
        });
    },
    getAllImages : function(args,db,auth){
        return db.getAllImages();
    },
    getAllArticles : function(args,db,auth){
        return db.getAllArticles();
    },
    getArticle : function(args,db,auth){
        return db.getArticle(args[0]);
    },
    getArticleHistory : function(args,db,auth){
        return db.getArticleHistory(args[0])
    }


};

const numberOfArgs = {
    createUser : 1,
    login : 1,
    removeUser : 1,
    addToBlacklist : 1,
    removeFromBlacklist : 1,
    createArticle : 3,
    lockArticle : 1,
    updateArticle : 3,
    getUserID : 1,
    addImage : 4,
    deleteImage : 1,
    getImage : 1,
    getAllArticles : 0,
    getAllImages : 0,
    getArticle : 1,
    getArticleHistory: 1
};



function routeRequest(params,res,db,auth){
  
    if(!params.command || !routines[params.command]){
        console.error(`!! invalid command : ${params.command}`);
        return res.status(400).end();
    }
    //console.log(params);
    let args = collectArgs(params);
    if(args.length!= numberOfArgs[params.command])
        return res.status(418).send('invalid_args');
    routines[params.command](args,db,auth)
    .then((msg)=> res.send(JSON.stringify(msg)))
    .catch((err)=>{
        console.error(err);
        res.status(418).send(JSON.stringify(err))
    });

}



function bindApplication(app,db){
    app.get('/request',(req,res,next)=>{
        db.checkBlacklist(req.ip)
        .then((isOn)=>{
            if(isOn===true){
                res.status(401).end();
                return false;
            }
            else 
                return isOn;
        })
        .then((ready)=>{
            if(ready)
                routeRequest(req.query,res,db,req.headers.authorization);
        })
        .catch((err)=>{
            console.error(err);
            res.status(418).send(JSON.stringify(err))
        });
    
    });

    const multer = require('multer');
    const sizeOf = require('image-size');
    const upload = multer({
        dest:`${__dirname}/../public/imgs`
    });
    app.post('/upload',upload.single('wiki_image'),(req,res,next)=>{
      let owner = parseInt(req.body.owner);
      let comment = striptags(req.body.comment);
      let dim = sizeOf(req.file.path);
      if(Number.isNaN(owner))
        res.status(418).send('invalid_owner');
      else{
        
        db.addImage(owner,`${dim.width}x${dim.height}`,req.file.size,comment)
        .then((result)=>{
            if(!Number.isInteger(result))
                res.status(418).send('storage_failed');
            else
                return result;
                
        })
        .then((id)=>{
            let prefix = `${__dirname}/../public/imgs`
            fs.rename(`${prefix}/${req.file.filename}`,`${prefix}/${id}.${dim.type}`,(err)=>{
                if(err)
                    res.status(418).send(JSON.stringify(err));
                else
                    res.send(JSON.stringify({id:id}));
            });
        });
      }
         
    });

}


module.exports={
    bindApplication
};