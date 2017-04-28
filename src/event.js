import { WebClient } from '@slack/client'
import { getTeam } from './db'

export default async (ctx, next, kitsu) => {
  let { type, challenge } = ctx.request.body
  if (type === 'url_verification') {
    ctx.body = challenge
    return
  }
  let { team_id, event } = ctx.request.body
  let { channel, message_ts, links } = event
  console.log('event: ' + 'link_shared: ' + links.map(link => link.url).join())

  let { token } = await getTeam(team_id)
  let slack = new WebClient(token)

  await Promise.all(links.map(async (link) => {
    let { url } = link
    let unfurl
    if (/anime/.test(url)) {
      unfurl = { text: 'anime' }
    } else if (/manga/.test(url)) {
      unfurl = { text: 'manga' }
    } else if (/users/.test(url)) {
      unfurl = { text: 'user' }
    } else if (/posts/.test(url)) {
      unfurl = { text: 'post' }
    } else if (/comments/.test(url)) {
      unfurl = { text: 'comment' }
    } else if (/groups/.test(url)) {
      unfurl = { text: 'group' }
    } else if (/reviews/.test(url)) {
      unfurl = { text: 'review' }
    } else if (/feedback/.test(url)) {
      unfurl = { text: 'feedback' }
    } else return

    await slack.chat.unfurl(message_ts, channel, {
      [url]: unfurl
    }).catch((err) => { throw new Error(err) })
  }))
}
