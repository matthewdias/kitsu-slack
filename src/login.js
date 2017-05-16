import { setUser } from './db'

export default async (ctx, next, kitsu) => {
  let username = ctx.request.body.text.split(' ')[0]
  let password = ctx.request.body.text.substr(username.length + 1)

  let authData
  try {
    authData = await kitsu.login(username, password)
  } catch (error) {
    ctx.body = 'Bad Login'
    return
  }

  ctx.status = 200
  ctx.body = 'Logged in'

  let userId = await kitsu.getUserId(username)
  let auth = {
    kitsuid: userId,
    token: authData.accessToken,
    refresh: authData.refreshToken
  }
  let { team_id, user_id } = ctx.request.body
  setUser(team_id, user_id, auth)
}
