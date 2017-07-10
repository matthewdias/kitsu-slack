import moment from 'moment'
import help from './help'

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
    ts: moment().unix(),
    actions: [{
      name: 'group',
      text: 'Join/Leave',
      type: 'button'
    }]
  }

  return attachment
}

export async function groupAction ({ ctx, kitsu, action, kitsuid, callback_id, body, title, token }) {
  if (action.name === 'group') {
    kitsu.authenticate(token)
    let groupMember = await kitsu.searchGroupMembers(kitsuid, callback_id)
    kitsu.unauthenticate(token)
    if (groupMember) {
      body.attachments[0].callback_id = groupMember.id
      body.attachments[0].title = 'Leave ' + title
      body.attachments[0].actions = [
        {
          name: 'groupmember',
          text: 'Leave Group',
          style: 'danger',
          type: 'button',
          value: 'leave',
          confirm: {
            title: 'Leave ' + title,
            text: `Are you sure you want to leave ${title}?`
          }
        }
      ]
    } else {
      body.attachments[0].title = 'Join ' + title
      body.attachments[0].actions = [
        {
          name: 'groupmember',
          text: 'Join Group',
          style: 'primary',
          type: 'button',
          value: 'join',
          confirm: {
            title: 'Join ' + title,
            text: `Are you sure you want to join ${title}?`
          }
        }
      ]
    }
    ctx.body = body
    return true
  }

  if (action.name === 'groupmember') {
    if (action.value === 'leave') {
      kitsu.authenticate(token)
      try {
        await kitsu.removeGroupMember(callback_id)
        body.text = 'Left.'
      } catch (error) {
        body.text = 'Not yet joined.'
      }
      kitsu.unauthenticate()
      ctx.body = body
      return true
    }

    if (action.value === 'join') {
      kitsu.authenticate(token)
      try {
        await kitsu.createGroupMember({
          user: { id: kitsuid },
          group: { id: callback_id }
        })
        body.text = 'Joined.'
      } catch (error) {
        body.text = 'Already joined.'
      }
      kitsu.unauthenticate()
      ctx.body = body
      return true
    }
  }
  return false
}

export default async (ctx, next, kitsu) => {
  let { text, user_id, team_id } = ctx.request.body
  if (!text) {
    help(ctx, next)
    return
  }

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
    let { token, fresh } = await kitsu.authUser(team_id, user_id, ctx, kitsu)
    if (fresh) {
      kitsu.authenticate(token)
    } else return
    group = await kitsu.searchGroups(encodeURI(text), extended)
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
