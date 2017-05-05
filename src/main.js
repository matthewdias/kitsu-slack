import 'babel-polyfill'
import Koa from 'koa'
import parser from 'koa-bodyparser'
import Router from 'koa-router'
import cors from 'koa-cors'
import serve from 'koa-static'
import ratelimit from 'koa-ratelimit'
import redis from 'redis'
import Kitsu from './kitsu'
import user from './user'
import anime from './anime'
import manga from './manga'
import login from './login'
import action from './action'
import event from './event'
import help from './help'
import auth from './auth'

const router = new Router()
const app = new Koa()
const kitsu = new Kitsu()

app.use(parser())
app.use(ratelimit({
  db: redis.createClient(process.env.REDIS_URL),
  duration: parseInt(process.env.RATELIMIT_DURATION),
  max: parseInt(process.env.RATELIMIT_MAX),
  id: (ctx) => {
    let { method, body } = ctx.request
    if (body.user_id)
      return body.user_id
    else return ctx.ip
  }
}))

router.use(async (ctx, next) => {
  try {
    let { method, body } = ctx.request
    let token = process.env.VERIFICATION
    if (method == 'POST') {
      let valid = true
      if (body.token) {
        valid = body.token == token
      }
      else {
        valid = JSON.parse(body.payload).token == token
      }
      if (!valid) {
        ctx.status = 403
        throw new Error('Forbidden')
      }
    }
    await next()
  } catch (err) {
    let status = ctx.status || 500
    console.log(`${status}: ${err}`)
    ctx.body = 'Error: ' + err.message
  }
})

router.post('/user', async (ctx, next) => { await user(ctx, next, kitsu) })
router.post('/anime', async (ctx, next) => { await anime(ctx, next, kitsu) })
router.post('/manga', async (ctx, next) => { await manga(ctx, next, kitsu) })
router.post('/login', async (ctx, next) => { await login(ctx, next, kitsu) })
router.post('/action', async (ctx, next) => { await action(ctx, next, kitsu) })
router.post('/event', async (ctx, next) => { await event(ctx, next, kitsu) })
router.post('/help', async (ctx, next) => { await help(ctx, next) })
router.get('/auth', async (ctx, next) => { await auth(ctx, next) },
  (ctx, next, team) => { ctx.redirect(`slack://open?team=${team}`) })

app.use(router.routes())
app.use(router.allowedMethods())
app.use(cors())
app.use(serve('./static'))
app.listen(process.env.PORT || 3000)
