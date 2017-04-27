import { WebClient } from '@slack/client'
import { getTeam } from './db'

export default async (ctx, next, kitsu) => {
  let { type, challenge } = ctx.request.body
  if (type === 'url_verification') {
    ctx.body = challenge
    return
  }
  let { team_id, event } = payload
  let { message_ts, links } = event
  console.log('event: ' + 'link_shared: ' + links)

  // WebClient.
}
