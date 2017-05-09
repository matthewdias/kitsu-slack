import moment from 'moment'

export function postAttachment (post, extended) {
  let {
    commentsCount,
    postLikesCount,
    spoiler,
    nsfw,
    createdAt,
    editedAt,
    user,
    targetUser,
    targetGroup,
    media
  } = post

  let text = ''
  let fields = []
  let title_link = process.env.KITSU_HOST + '/posts/' + post.id
  let title = 'Post by ' + user.name
  title += targetUser ? `to ${targetUser.name}` : ''
  title += targetGroup ? `to ${targetGroup.name}` : ''
  let fallback = title + ' - ' + title_link

  nsfw = (targetGroup && targetGroup.nsfw) || nsfw

  if (nsfw) {
    text += ':smirk: [NSFW]'
    fallback += '\n[NSFW]'
  }

  if (spoiler) {
    text += '\n:exclamation: [SPOILER]'
    fallback += '\n[SPOILER]'
    if (media) {
      text += ` - <https://kitsu.io/${media.type}/${media.slug}|${media.canonicalTitle}>`
      fallback += ` - ${media.canonicalTitle}`
    }
  }

  if (!spoiler && !nsfw && post.content) {
    text = post.content
    fallback += `\n${post.content}`
  }

  if (commentsCount) {
    fields.push({
      title: ':speech_balloon: Comments',
      value: commentsCount,
      short: true
    })
    fallback += `\nComments: ${commentsCount}`
  }

  if (postLikesCount) {
    fields.push({
      title: ':heart: Likes',
      value: postLikesCount,
      short: true
    })
    fallback += `\nLikes: ${postLikesCount}`
  }

  if (createdAt) {
    let time = moment.utc(createdAt).fromNow()
    fields.push({
      title: ':clock3: Posted',
      value: time,
      short: true
    })
    fallback += `\nPosted: ${time}`
  }

  if (editedAt) {
    let time = moment.utc(editedAt).fromNow()
    fields.push({
      title: ':pencil2: Edited',
      value: time,
      short: true
    })
    fallback += `\nEdited: ${time}`
  }

  let attachment = {
    color: '#F65440',
    mrkdwn_in: ['text'],
    callback_id: post.id,
    title,
    title_link,
    text,
    thumb_url: targetUser.avatar ? targetUser.avatar.medium : null,
    fields,
    fallback,
    footer: 'Kitsu API',
    footer_icon: 'https://kitsu-slack.herokuapp.com/icon.png',
    ts: moment().unix()
    // actions: [{
    //   name: 'post',
    //   text: '',
    //   type: 'button'
    // }]
  }

  return attachment
}
