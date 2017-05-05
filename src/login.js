import { setUser } from './db'

export default async (ctx, next, kitsu) => {
  let username = ctx.request.body.text.split(' ')[0]
  let password = ctx.request.body.text.substr(username.length + 1)

  let auth
  try {
    auth = await kitsu.login(username, password)
  } catch (error) {
    ctx.body = 'Bad Login'
    return
  }

  ctx.status = 200
  ctx.body = 'Logged In'

  let userId = await kitsu.getUserId(username)
  let defaults = {
    kitsuid: userId,
    token: auth.accessToken,
    refresh: auth.refreshToken
  }
  let { team_id, user_id } = ctx.request.body
  setUser(team_id, user_id, defaults)
}
