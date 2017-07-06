import moment from 'moment'
import { getUser, setUser } from './db'

export const authAction = async (teamId, userId, ctx, kitsu) => {
  let user = await getUser(teamId, userId)
  if (!user) {
    ctx.body = {
      text: 'Please login to Kitsu first using /login',
      response_type: 'ephemeral',
      replace_original: false
    }
    return
  }
  let { kitsuid, token, refresh, updatedAt } = user
  if (moment().diff(moment(updatedAt), 'days') > 20) {
    let authToken = await kitsu.refresh(token, refresh)
    token = authToken.data.access_token
    refresh = authToken.data.refresh_token
    let auth = { kitsuid, token, refresh }
    setUser(teamId, userId, auth)
  }
  return user
}

export default async (ctx, next, kitsu) => {
  let payload = JSON.parse(ctx.request.body.payload)
  let {
    actions,
    callback_id,
    team,
    user,
    original_message
  } = payload
  let action = actions[0]
  console.log(`action: ${action.name}${action.value ? ': ' + action.value : ''}: ${callback_id}`)

  let kitsuUser = await authAction(team.id, user.id, ctx, kitsu)
  if (!kitsuUser) {
    return
  }
  let { kitsuid, token } = kitsuUser

  if (kitsuid === callback_id) {
    ctx.body = {
      text: 'You can\'t follow yourself.',
      response_type: 'ephemeral',
      replace_original: false
    }
    return
  }
  let body = { attachments: [{ callback_id }] }

  if (!action.value) {
    if (original_message) {
      var { color, title } = original_message.attachments[0]
    }
    body.color = color
    body.response_type = 'ephemeral'
    body.replace_original = false
  }

  if (action.name === 'user') {
    let follow = await kitsu.searchFollows(kitsuid, callback_id)
    if (follow) {
      body.attachments[0].callback_id = follow.id
      body.attachments[0].title = 'Unfollow ' + title
      body.attachments[0].actions = [
        {
          name: 'follow',
          text: 'Unfollow',
          style: 'danger',
          type: 'button',
          value: 'unfollow',
          confirm: {
            title: 'Unfollow ' + title,
            text: `Are you sure you want to unfollow ${title}?`
          }
        }
      ]
    } else {
      body.attachments[0].title = 'Follow ' + title
      body.attachments[0].actions = [
        {
          name: 'follow',
          text: 'Follow',
          style: 'primary',
          type: 'button',
          value: 'follow',
          confirm: {
            title: 'Follow ' + title,
            text: `Are you sure you want to follow ${title}?`
          }
        }
      ]
    }
    ctx.body = body
    return
  }

  if (action.name === 'follow') {
    if (action.value === 'unfollow') {
      kitsu.authenticate(token)
      try {
        await kitsu.removeFollow(callback_id)
        body.text = 'Unfollowed.'
      } catch (error) {
        body.text = 'Not yet following.'
      }
      kitsu.unauthenticate()
      ctx.body = body
      return
    }

    if (action.value === 'follow') {
      kitsu.authenticate(token)
      try {
        await kitsu.createFollow({
          follower: { id: kitsuid },
          followed: { id: callback_id }
        })
        body.text = 'Followed.'
      } catch (error) {
        body.text = 'Already following.'
      }
      kitsu.unauthenticate()
      ctx.body = body
      return
    }
  }

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
    return
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
      return
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
      return
    }
  }

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
    return
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
      return
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
      return
    }
  }

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
    return
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
      return
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
      return
    }
  }

  if (action.name === 'anime' || action.name === 'manga') {
    let consumeVerb = action.name === 'anime' ? 'Watch' : 'Read'
    let name = action.name + 'entry'

    let menu = {
      name,
      type: 'select',
      options: [
        { text: `Currently ${consumeVerb}ing`, value: 'current' },
        { text: `Want to ${consumeVerb}`, value: 'planned' },
        { text: 'Completed', value: 'completed' },
        { text: 'On Hold', value: 'on_hold' },
        { text: 'Dropped', value: 'dropped' },
        { text: 'Not in Library', value: 'unadded' }
      ],
      confirm: {
        title: 'Edit ' + title,
        text: `Are you sure you want to edit ${title}?`
      }
    }

    kitsu.authenticate(token)
    let entry
    if (action.name === 'anime') {
      entry = await kitsu.getEntryForAnime(kitsuid, callback_id)
    } else if (action.name === 'manga') {
      entry = await kitsu.getEntryForManga(kitsuid, callback_id)
    }
    kitsu.unauthenticate()

    let status = entry ? entry.status : 'unadded'
    if (entry) {
      menu.selected_options = [
        menu.options.find(option => option.value === status)
      ]
    }

    body.attachments[0].title = 'Edit ' + title
    body.attachments[0].actions = [ menu ]
    ctx.body = body
    return
  }

  if (action.name === 'animeentry' || action.name === 'mangaentry') {
    let { value } = action.selected_options[0]
    kitsu.authenticate(token)
    let entry
    if (action.name === 'animeentry') {
      entry = await kitsu.getEntryForAnime(kitsuid, callback_id)
    } else if (action.name === 'mangaentry') {
      entry = await kitsu.getEntryForManga(kitsuid, callback_id)
    }

    if (value === 'unadded') {
      if (entry) {
        await kitsu.removeEntry(entry.id)
        body.text = 'Removed.'
        ctx.body = body
      }
      kitsu.unauthenticate()
      return
    }

    let data = {
      status: value
    }

    if (entry) {
      data.id = entry.id
      await kitsu.updateEntry(data)
      kitsu.unauthenticate()
      body.text = 'Saved.'
      ctx.body = body
      return
    }

    if (action.name === 'animeentry') {
      data.anime = { id: callback_id }
    } else data.manga = { id: callback_id }
    data.user = { id: kitsuid }
    await kitsu.createEntry(data)
    kitsu.unauthenticate()
    body.text = 'Added.'
    ctx.body = body
  }
}
