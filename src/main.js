import 'babel-polyfill';
import Koa from 'koa';
import cors from 'koa-cors';
import user from './user';
import anime from './anime';

var router = require('koa-router')();
var koaBody = require('koa-body')();
var app = new Koa();

app.use(async (ctx, next) => {
	try {
		await next();
	} catch (err) {
		ctx.body = err.message;
		var status = ctx.status || 500;
		console.log(status + ': ' + err.message);
	}
});

router.get('/user', user);
router.get('/anime', anime);

app.use(router.routes());
app.use(router.allowedMethods());
app.use(cors());
app.listen(process.env.PORT || 3000);
