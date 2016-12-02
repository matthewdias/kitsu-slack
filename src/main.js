import 'babel-polyfill'
import Koa from 'koa'
import parser from 'koa-bodyparser'
import Router from 'koa-router'
import cors from 'koa-cors'
import Kitsu from './kitsu'
import user from './user'
import anime from './anime'
import manga from './manga'
import login from './login'
import auth from './auth'

const router = new Router()
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

router.post('/user', async (ctx, next) => { await user(ctx, next, kitsu) })
router.post('/anime', async (ctx, next) => { await anime(ctx, next, kitsu) })
router.post('/manga', async (ctx, next) => { await manga(ctx, next, kitsu) })
router.post('/action', () => {
  console.log('action')
})
router.post('/login', async (ctx, next) => { await login(ctx, next, kitsu) })
router.get('/auth', auth)

app.use(parser())
app.use(router.routes())
app.use(router.allowedMethods())
app.use(cors())
app.listen(process.env.PORT || 3000)
