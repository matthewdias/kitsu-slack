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
    var { color, title } = original_message.attachments[0]
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
