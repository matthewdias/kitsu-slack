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
  let title = 'Comment'
  let titleInfo = ` on ${post.user.name}'s post`
  let fallback = `${title} by ${user.name}${titleInfo} - ${title_link}`
  title += titleInfo

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
    fields,
    fallback,
    footer: 'Kitsu API',
    footer_icon: 'https://kitsu-slack.herokuapp.com/footer-icon.png',
    ts: moment().unix(),
    actions: [{
      name: 'comment',
      text: 'Like/Unlike',
      type: 'button'
    }]
  }

  if (user.name) {
    attachment.author_name = user.name
  }

  if (user.avatar) {
    attachment.author_icon = user.avatar.medium
  }

  return attachment
}

export async function commentAction ({ ctx, kitsu, action, kitsuid, callback_id, body, title, token }) {
  if (action.name === 'comment') {
    kitsu.authenticate(token)
    let commentLike = await kitsu.searchCommentLikes(kitsuid, callback_id)
    kitsu.unauthenticate(token)
    if (commentLike) {
      body.attachments[0].callback_id = commentLike.id
      body.attachments[0].title = 'Unlike ' + title
      body.attachments[0].actions = [
        {
          name: 'commentlike',
          text: 'Unlike Comment',
          style: 'danger',
          type: 'button',
          value: 'unlike',
          confirm: {
            title: 'Unlike ' + title,
            text: `Are you sure you want to unlike ${title}?`
          }
        }
      ]
    } else {
      body.attachments[0].title = 'Like ' + title
      body.attachments[0].actions = [
        {
          name: 'commentlike',
          text: 'Like Comment',
          style: 'primary',
          type: 'button',
          value: 'like',
          confirm: {
            title: 'Like ' + title,
            text: `Are you sure you want to like ${title}?`
          }
        }
      ]
    }
    ctx.body = body
    return true
  }

  if (action.name === 'commentlike') {
    if (action.value === 'unlike') {
      kitsu.authenticate(token)
      try {
        await kitsu.removeCommentLike(callback_id)
        body.text = 'Unliked.'
      } catch (error) {
        body.text = 'Not yet liked.'
      }
      kitsu.unauthenticate()
      ctx.body = body
      return true
    }

    if (action.value === 'like') {
      kitsu.authenticate(token)
      try {
        await kitsu.createCommentLike({
          user: { id: kitsuid },
          comment: { id: callback_id }
        })
        body.text = 'Liked.'
      } catch (error) {
        body.text = 'Already liked.'
      }
      kitsu.unauthenticate()
      ctx.body = body
      return true
    }
  }
  return false
}
