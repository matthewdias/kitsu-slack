import fetch from 'node-fetch'
import { setUser } from './db'

export default async (ctx, next, kitsu) => {
  const { text, team_id, user_id, response_url } = ctx.request.body
  let username = text.split(' ')[0]
  let password = text.substr(username.length + 1)

  login(username, password, team_id, user_id, kitsu)
    .then(text => fetch(response_url, {
      method: 'post',
      body: JSON.stringify({ text }),
      headers: { 'Content-Type': 'application/json'}
    }))

  ctx.status = 200
  ctx.body = 'Loading...'
}

const login = async (username, password, team_id, user_id, kitsu) => {
  const response = {}
  let authData
  try {
    authData = await kitsu.login(username, password)
  } catch (error) {
    return 'Bad Login.'
  }

  const { accessToken: token, refreshToken: refresh } = authData

  kitsu.authenticate(token)
  const kitsuid = await kitsu.getUserId()
  kitsu.unauthenticate()
  const auth = { kitsuid, token, refresh }

  try {
    setUser(team_id, user_id, auth)
    return 'Logged in.'
  } catch (error) {
    return 'Failed to save.'
  }
}