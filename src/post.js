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
  title += targetUser ? ` to ${targetUser.name}` : ''
  title += targetGroup ? ` to ${targetGroup.name}` : ''
  let fallback = title + ' - ' + title_link

  nsfw = (targetGroup && targetGroup.nsfw) || nsfw

  if (!spoiler && !nsfw && post.content) {
    text += post.content
    fallback += `\n${post.content}`
  }

  if (nsfw) {
    fields.push({
      value: ':smirk: `NSFW`',
      short: true
    })
    fallback += '\n[NSFW]'
  }

  if (spoiler) {
    fields.push({
      value: ':exclamation: `SPOILER`',
      short: true
    })
    fallback += '\n[SPOILER]'
  }

  if (media) {
    let type = media.type.charAt(0).toUpperCase() + media.type.slice(1)
    let mediaTitle = (type === 'Anime' ? ':tv: ' : ':orange_book: ') + type
    fields.push({
      title: mediaTitle,
      value: `<https://kitsu.io/${media.type}/${media.slug}|${media.canonicalTitle}>`,
      short: true
    })
    fallback += `\n${type}: ${media.canonicalTitle}`
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
    mrkdwn_in: ['text', 'fields'],
    callback_id: post.id,
    title,
    title_link,
    text,
    thumb_url: user.avatar ? user.avatar.medium : null,
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
