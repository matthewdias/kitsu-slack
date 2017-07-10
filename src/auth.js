import { WebClient } from '@slack/client'
import { setTeam } from './db'

const { CLIENT, SECRET } = process.env

export default async (ctx, next) => {
  let slack = new WebClient()
  let body = await slack.oauth.access(CLIENT, SECRET, ctx.query.code)
    .catch((err) => { throw new Error(err) })
  if (body.ok === false) {
    let error = 'Login Error: ' + body.error
    console.log(error)
    ctx.response.type = 'html'
    ctx.body = `${error} <a href="https://slack.com/oauth/authorize?scope=commands,links:read,links:write&client_id=12303250033.57925979077">Try again</a>`
  } else {
    setTeam(body.team_id, body.access_token)
    ctx.redirect(`/authed.html?team=${body.team_id}`)
  }
}
