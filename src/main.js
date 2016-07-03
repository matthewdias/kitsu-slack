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
		ctx.body = { message: err.message, status: err.status };
		ctx.status = err.status || 500;
	}
});

router.get('/user', user);
router.get('/anime', anime);

app.use(router.routes());
app.use(router.allowedMethods());
app.use(cors());
app.listen(3000);
