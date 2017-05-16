import moment from 'moment'
import { getUser } from './db'

export function groupAttachment (group, extended) {
  let text = ''
  let fields = []
  let title_link = process.env.KITSU_HOST + '/groups/' + group.slug
  let title = group.name
  let fallback = title + ' - ' + title_link

  if (group.about) {
    text += group.about
    fallback += `\n${group.about}`
  }

  if (extended) {
    let { membersCount, nsfw, privacy, category } = group

    if (category) {
      fields.push({
        title: ':hash: Category',
        value: category.name,
        short: true
      })
      fallback += `\nCategory: ${category.name}`
    }

    if (nsfw) {
      fields.push({
        value: ':smirk: `NSFW`',
        short: true
      })
      fallback += '\n[NSFW]'
    }

    if (privacy) {
      privacy = privacy.charAt(0).toUpperCase() + privacy.slice(1)
      fields.push({
        title: ':lock: Privacy',
        value: privacy,
        short: true
      })
      fallback += `\nPrivacy: ${privacy}`
    }

    if (membersCount) {
      fields.push({
        title: ':busts_in_silhouette: Members',
        value: membersCount,
        short: true
      })
      fallback += `\nMembers: ${membersCount}`
    }
  }

  let attachment = {
    color: '#F65440',
    mrkdwn_in: ['text', 'fields'],
    callback_id: group.id,
    title,
    title_link,
    text,
    thumb_url: group.avatar ? group.avatar.medium : null,
    fields,
    fallback,
    footer: 'Kitsu API',
    footer_icon: 'https://kitsu-slack.herokuapp.com/footer-icon.png',
    ts: moment().unix()
    // actions: [{
    //   name: 'post',
    //   text: '',
    //   type: 'button'
    // }]
  }

  return attachment
}

export default async (ctx, next, kitsu) => {
  let { text, user_id, team_id } = ctx.request.body
  console.log('group: ' + text)
  let extended = false
  if (text.indexOf('extended ') === 0) {
    text = text.substring(9)
    extended = true
  }
  if (text.indexOf('ex ') === 0) {
    text = text.substring(3)
    extended = true
  }
  let group
  try {
    let user = await getUser(team_id, user_id)
    if (user) {
      kitsu.authenticate(user.token)
    }
    group = await kitsu.searchGroup(encodeURI(text), extended)
    kitsu.unauthenticate()
  } catch (error) {
    ctx.status = 404
    return
  }
  if (group) {
    console.log(group.name)

    let body = {
      response_type: 'in_channel',
      link_names: true,
      attachments: [groupAttachment(group, extended)]
    }

    ctx.status = 200
    ctx.body = body
  }
}
