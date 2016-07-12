import superagent from 'superagent';
import Sequelize from 'sequelize';

if(process.env.DATABASE_URL) {
	var sequelize = new Sequelize(process.env.DATABASE_URL, {
		dialect: 'postgres',
		protocol: 'postgres'
	});
}
else {
	sequelize = new Sequelize('localhb', 'matthew', null);
}

var User = sequelize.define('user', {
	id: {
		primaryKey: true,
		type: Sequelize.STRING
	},
	hbname: Sequelize.STRING,
	token: Sequelize.STRING,
	refresh: Sequelize.STRING
});

export default async (ctx, next) => {
	var username = ctx.query.text.split(' ')[0];
	var password = ctx.query.text.substr(username.length + 1);
	superagent
	  	.post('https://hbv3-api-edge.herokuapp.com/oauth/token')
		.send({
			"password": password,
			"username": username,
			"grant_type": "password"
		})
  		.set('Content-Type', 'application/json; charset=utf-8')
  		.redirects(0)
  		.end(function(err, res) {
  		  	if (err || !res.ok) {
  		  		console.log('Login Error: ' + username);
  		  		ctx.status = 404;
  		  	} else {
  		  		var newData = {
  	  				hbname: username,
	  	  			token: res.body.access_token,
	  	  			refresh: res.body.refresh_token
  	  			}

  		  	  	sequelize.sync().then(() => {
  		  	  		return User.findOrCreate({
  		  	  			where: { id: ctx.query.user_id },
  		  	  			defaults: newData
  		  	  		});
  		  	  	}).then((user, created) => {
  		  	  		console.log(created);
  		  	  		if(!created) {
  		  	  			user.update(newData).then((user) => {
  		  	  				console.log('updated');
  		  	  				return user;
  		  	  			});
  		  	  		}
  		  	  	}).then((user) => {
  		  	  		console.log(user.get({
  		  	  			plain: true
  		  	  		}));
  		  	  	});

  		  	  	// ctx.status = 200;
  		  	  	ctx.body = "Logged In"
  		  	}
  		});
}
