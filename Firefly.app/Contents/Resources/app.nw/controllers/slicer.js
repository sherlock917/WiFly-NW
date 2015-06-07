var fs=require('fs'),
    crypto = require('crypto');

var storage = require('./storage');

exports.slice = function(path, chunk_size, callback){//[ Path of the file to slice ] -> Number of blocks
	console.log(path)
	var name = path.split('/').pop()
	var lpath = path.substring(0,path.length - name.length)

	var hidenDirPath = lpath + '.' + name//without last'/'

	console.log(path+','+name+','+lpath)

	var fsize=(fs.statSync(path).size)

	try{
		fs.mkdirSync(hidenDirPath)
	}catch(EEXIST){
		console.log('slicer::slice:dirExist')
	}

	var tot = 0,counter = 0;
	for(var lptr = 0;lptr < fsize;lptr += chunk_size){
		rptr = Math.min(lptr + chunk_size, fsize) - 1
		var rstream = fs.createReadStream(path,{start:lptr,end:rptr});
		var wstream = fs.createWriteStream(hidenDirPath+'/'+name+'.'+(tot++))
		wstream.on('close', function(){
			counter++;
			if(counter == tot)
				callback(tot)
		})
		rstream.pipe(wstream);
	}
}

exports.merge = function(lpath, name, n){//[ Path of the file to sav, Name of the file ] lpath has no lat '/'
	var path=lpath+'/'+name
	var hidenDirPath=lpath+'/.'+name//without last'/'

	//for(var tot = 0;tot < n; tot++){
	function mergeLaunch(tot){
		console.log("slicer::merge:merging "+tot);
		var rstream = fs.createReadStream(hidenDirPath + '/' + name + '.' + tot);
		var wstream = fs.createWriteStream(path,{flags:'a'})
		rstream.pipe(wstream);
		wstream.on('close',function(){
			if(tot + 1<n)
			    mergeLaunch(tot+1);
		});
	}

	mergeLaunch(0);
}

exports.getChunkNumFromSize = function(size, chunk_size){
	return Math.ceil(size / chunk_size);
}

exports.getFitableChunkSize = function(size){
	if(size > 1024*1024 * 256)
		return 1024*1024 * 16;
	else if(size > 1024*1024 * 128)
		return 1024*1024 * 8;
	else if(size > 1024*1024 * 64)
		return 1024*1024 * 4;
	else if(size > 1024*1024 * 32)
		return 1024*1024 * 2;
	else return 1024*1024;
}

//sender(uploader) ONLY
exports.setSuccessChunk = function(md5,num){
	storage.setLocalStorage("upload_lstChunk_"+md5,num.toString());
}

exports.getSuccessChunk = function(md5){
	var res = storage.getLocalStorage("upload_lstChunk_"+md5);
	if(res == undefined) return res;
	else return parseInt(res);
}

//receiver ONLY
exports.setTotalChunk = function(md5,num){
	storage.setLocalStorage("download_totChunk_"+md5,num.toString());
}

exports.getTotalChunk = function(md5){
	var res = storage.getLocalStorage("download_totChunk_"+md5);
	if(res == undefined) return res;
	else return parseInt(res);
}

exports.setSavPath = function(md5,path){
	storage.setLocalStorage("download_path_"+md5,path);
}

exports.getSavPath = function(md5){
	return storage.getLocalStorage("download_path_"+md5);
}

exports.setSavName = function(md5,name){
	storage.setLocalStorage("download_name_"+md5,name);
}

exports.setSavSize = function(md5,size){
	storage.setLocalStorage("download_size_"+md5,size.toString());
}

exports.getSavSize = function(md5){
	return parseInt(storage.getLocalStorage("download_size_"+md5));
}


exports.getMD5fromFile = function(path,callback){//callback : function(md5){}
	var rs = fs.createReadStream(path);
    var hash = crypto.createHash('md5');
    rs.on('data',hash.update.bind(hash));
    rs.on('end',function(){
    	var md5=hash.digest('hex');
    	console.log("controllers/slicer::getMD5fromFile  path:"+path+" md5:"+md5);
    	callback(md5);
    });
}