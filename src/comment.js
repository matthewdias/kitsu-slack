import moment from 'moment'

export function commentAttachment (comment, extended) {
  let {
    content,
    repliesCount,
    likesCount,
    createdAt,
    editedAt,
    user,
    post
  } = comment

  let text = ''
  let fields = []
  let title_link = process.env.KITSU_HOST + '/comments/' + comment.id
  let title = `Comment by ${user.name} on ${post.user.name}'s post`
  let fallback = title + ' - ' + title_link

  let nsfw = (post.targetGroup && post.targetGroup.nsfw) || post.nsfw

  if (!post.spoiler && !nsfw && content) {
    text += content
    fallback += `\n${content}`
  }

  if (nsfw) {
    fields.push({
      value: ':smirk: `NSFW`',
      short: true
    })
    fallback += '\n[NSFW]'
  }

  if (post.spoiler) {
    fields.push({
      value: ':exclamation: `SPOILER`',
      short: true
    })
    fallback += '\n[SPOILER]'
  }

  if (repliesCount) {
    fields.push({
      title: ':speech_balloon: Replies',
      value: repliesCount,
      short: true
    })
    fallback += `\nReplies: ${repliesCount}`
  }

  if (likesCount) {
    fields.push({
      title: ':heart: Likes',
      value: likesCount,
      short: true
    })
    fallback += `\nLikes: ${likesCount}`
  }

  if (createdAt) {
    let time = moment.utc(createdAt).fromNow()
    fields.push({
      title: ':clock3: Commented',
      value: time,
      short: true
    })
    fallback += `\nCommented: ${time}`
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
    callback_id: comment.id,
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