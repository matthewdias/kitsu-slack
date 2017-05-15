import moment from 'moment'

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
  let query = ctx.request.body.text
  console.log('group: ' + query)
  let extended = false
  if (query.indexOf('extended ') === 0) {
    query = query.substring(9)
    extended = true
  }
  if (query.indexOf('ex ') === 0) {
    query = query.substring(3)
    extended = true
  }
  let group
  try {
    group = await kitsu.searchGroup(encodeURI(query), extended)
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
