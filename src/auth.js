import fetch from 'node-fetch'
import qs from 'qs'
import { setTeam } from './db'

export default async (ctx, next) => {
  let body = qs.stringify({
    client_id: process.env.CLIENT,
    client_secret: process.env.SECRET,
    code: ctx.query.code
  })
  let headers = { 'Content-Type': 'application/json; charset=utf-8' }
  let res = await fetch('https://slack.com/api/oauth.access?' + body, { method: 'POST', headers })
  body = await res.json()
  if (body.ok == false) {
    let error = 'Login Error: ' + body.error
    console.log(error)
    ctx.response.type = 'html'
    ctx.body = `${error} <a href="https://slack.com/oauth/authorize?scope=commands,users:read,links:read,links:write&client_id=12303250033.57925979077">Try again</a>`
  }
  else {
    setTeam(body.team_id, body.access_token)
    ctx.body = 'Logged in.'
  }
}
