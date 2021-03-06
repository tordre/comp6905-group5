/*
 * Sessions
 * 
 */
//Database information
var MongoClient = require('mongodb').MongoClient;
const config = require('./configuration.js');
var db_url = config.database.url;

//built in modules
const fs = require("fs");
const keygen = require("random-key");

//local modules



class Sessions{
	static async create_session(username){
		var session_id = keygen.generate(32);
		var firstDay = new Date();
		var nextWeek = new Date(firstDay.getTime() + 7 * 24 * 60 * 60 * 1000);
		
		var session= {
				session_id:  session_id, 
				expires: nextWeek.getTime(), 
				username: username};
		
		MongoClient.connect(db_url, function(err, db) {
			if (err) throw err;
			db.collection("Sessions").insertOne(session);
			db.close();
		});
		return session_id;
	}
	
	static async create_session_backdoor (username){
		var session_id = keygen.generate(32);
		var end = new Date(9999,12,31);
		
		var session= {
				session_id:  username, 
				expires: end.getTime(), 
				username: username};
		
		MongoClient.connect(db_url, function(err, db) {
			if (err) throw err;
			db.collection("Sessions").insertOne(session);
			db.close();
		});
		return session_id;
	}
	/*
	 *  check_session
	 *  	Checks if session id is valid considering the context
	 *  	only removes expired session if session id is matching
	 */
	static async check_session( session_id ){
		var db = await MongoClient.connect(db_url);
		var session = await db.collection("Sessions").findOne( {"session_id" : session_id} )
		if(session == null){
			db.close();
			return false;
		}
		
		var date = (new Date()).getTime();

		if(date < session.expires){
			db.close();
			return true;
		} else {
			db.collection("Sessions").remove({"session_id" : session_id});
			db.close();
			return false;
		}
	}
	
	/*
	 *  get_session_user
	 *  	Assumes you have confirmed session before search
	 *  	does not check if session has expired
	 */
	static async get_session_user ( session_id ){
		var db = await MongoClient.connect(db_url);
		var session = await db.collection("Sessions").findOne( {"session_id" : session_id} )

		db.close();
		return session.username;
	}
	

	static async get_session ( session_id ){
		var db = await MongoClient.connect(db_url);
		var session = await db.collection("Sessions").findOne( {"session_id" : session_id} )

		db.close();
		return new Session(session);
	}
	
	static async remove_session ( session_id ){
		
		var db = await MongoClient.connect(db_url);
		await db.collection("Sessions").remove( {"session_id" : session_id} )
		db.close();
		return;
	}
}


class Session{
	constructor(answer){
		this.username = answer.username;
		this.session_id = answer.session_id;
		this.expires = answer.expires;
	}
}
module.exports = Sessions;




