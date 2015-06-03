/*
 * GET users listing.
 */

var UsersModel = require("./../models").Users;
var path = require('path');

exports.list = function (req, res) {
    console.log("inlist");
    UsersModel.find({},function(err,users){
        if (err)
            return res.json({err:err});
        console.log(users);
        res.json(users);
        
    });
};

exports.create = function (req, res) {
    var createUser = new UsersModel(req.body);
    UsersModel.findOne({name:req.body.name}, function (err, user) {
        if (err)
            return res.json({err:err});
        if (user) {
            return res.json({err:"用户名已经存在"});
        }
        createUser.save(function (err, user) {
            if (err) {
                return res.json({err:err});
            }
            req.session["user"] = user;
            res.json();
        });
    });

};

exports.login = function (req, res) {
    UsersModel.findOne({name:req.body.name}, function (err, user) {
        if (err)
            return res.json({err:err});
        if (!user) {
            return res.json({err:'用户名不存在'});
        }
        if (!user.authenticate(req.body.password))
            return res.json({err:'密码错误'});
        req.session["user"] = user;
        res.json(user);
    });
};

exports.addfriend = function (req,res) {
    UsersModel.update({"name":req.body.name},{$push:{"friendids":{"fid":"admin"}}}, function (err, data) {
        //console.log(admin);
        if (err)
            return res.json({err:err});
        if (!data) {
            console.log("in3");
            return res.json({err:'用户名不存在'});
        }
        
    });
    
}
exports.updateCuroom = function (req,res) {
    UsersModel.update({"name":req.body.name},{$set:{"curoom":"test"}}, function (err, data) {
        //console.log(admin);
        if (err)
            return res.json({err:err});
        if (!data) {
            console.log("in3");
            return res.json({err:'用户名不存在'});
        }
        
    });
    
}

exports.logout = function (req, res) {
    req.session["user"] = null;
    var html = path.normalize(__dirname + '/../views/index.html');
    res.sendfile(html);
};
