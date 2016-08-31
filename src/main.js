import 'babel-polyfill'
import Koa from 'koa'
import cors from 'koa-cors'
import parser from 'koa-bodyparser'
import user from './user'
import anime from './anime'
import login from './login'
import auth from './auth'

var router = require('koa-router')()
var app = new Koa()

app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    ctx.body = err.message
    var status = ctx.status || 500
    console.log(status + ': ' + err.message)
  }
})

router.post('/user', user)
router.post('/anime', anime)
router.post('/action', () => {
  console.log('action')
})
router.post('/login', login)
router.get('/auth', auth)

app.use(parser())
app.use(router.routes())
app.use(router.allowedMethods())
app.use(cors())
app.listen(process.env.PORT || 3000)
