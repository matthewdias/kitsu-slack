import moment from 'moment'

export function postAttachment (post, extended) {
  let {
    content,
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
  let title = 'Post'
  let titleInfo = targetUser ? ` to ${targetUser.name}` : ''
  titleInfo += targetGroup ? ` to ${targetGroup.name}` : ''
  let fallback = `${title} by ${user.name}${titleInfo} - ${title_link}`
  title += titleInfo

  nsfw = (targetGroup && targetGroup.nsfw) || nsfw

  if (!spoiler && !nsfw && content) {
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
    fields,
    fallback,
    footer: 'Kitsu API',
    footer_icon: 'https://kitsu-slack.herokuapp.com/footer-icon.png',
    ts: moment().unix(),
    actions: [{
      name: 'post',
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

export async function postAction ({ ctx, kitsu, action, kitsuid, callback_id, body, title, token }) {
  if (action.name === 'post') {
    kitsu.authenticate(token)
    let postLike = await kitsu.searchPostLikes(kitsuid, callback_id)
    kitsu.unauthenticate(token)
    if (postLike) {
      body.attachments[0].callback_id = postLike.id
      body.attachments[0].title = 'Unlike ' + title
      body.attachments[0].actions = [
        {
          name: 'postlike',
          text: 'Unlike Post',
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
          name: 'postlike',
          text: 'Like Post',
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

  if (action.name === 'postlike') {
    if (action.value === 'unlike') {
      kitsu.authenticate(token)
      try {
        await kitsu.removePostLike(callback_id)
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
        await kitsu.createPostLike({
          user: { id: kitsuid },
          post: { id: callback_id }
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
