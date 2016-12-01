import 'babel-polyfill'
import Koa from 'koa'
import cors from 'koa-cors'
// import parser from 'koa-bodyparser'
import Kitsu from './kitsu'
import user from './user'
import anime from './anime'
import login from './login'
import auth from './auth'

const router = require('koa-router')()
const app = new Koa()
const kitsu = new Kitsu()

app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    ctx.body = err.message
    let status = ctx.status || 500
    console.log(status + ': ' + err.message)
  }
})

router.post('/user', (ctx, next) => { user(ctx, next, kitsu) })
router.post('/anime', (ctx, next) => { anime(ctx, next, kitsu) })
router.post('/action', () => {
  console.log('action')
})
router.post('/login', (ctx, next) => { login(ctx, next, kitsu) })
router.get('/auth', auth)

// app.use(parser())
app.use(router.routes())
app.use(router.allowedMethods())
app.use(cors())
app.listen(process.env.PORT || 3000)
