import moment from 'moment'
import { getUser, setUser } from './db'

export default async (ctx, next, kitsu) => {
  let payload = JSON.parse(ctx.request.body.payload)
  let {
    actions,
    callback_id,
    team,
    user,
    original_message,
    response_url
  } = payload
  let action = actions[0]
  console.log('action: ' + action.name + (action.value ? (': ' + action.value) : ''))

  user = await getUser(team.id, user.id)
  if (!user) {
    ctx.body = { text: 'Please login to Kitsu first using /login', replace_original: false }
    return
  }
  let { kitsuid, token, refresh, updatedAt } = user
  if (moment().diff(moment(updatedAt), 'days') > 20) {
    console.log(true)
    let authToken = await kitsu.refresh(token, refresh)
    token = authToken.data.accessToken
    refresh = authToken.data.refreshToken
    let defaults = { kitsuid, token, refresh }
    setUser(team.id, user.id, defaults)
  }

  if (kitsuid == callback_id) {
    ctx.body = { text: 'You can\'t follow yourself.', replace_original: false }
    return
  }
  let body = { attachments: [{ callback_id }] }

  if (!action.value) {
    var { color, title } = original_message.attachments[0]
    body.color = color
    body.response_type = 'ephemeral'
    body.replace_original = false
  }

  if (action.name == 'user') {
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
            text: `Are you sure you want to unfollow ${title}?`,
          }
        }
      ]
    }
    else {
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
            text: `Are you sure you want to follow ${title}?`,
          }
        }
      ]
    }
    ctx.body = body
    return
  }

  if (action.name == 'follow') {
    if (action.value == 'unfollow') {
      kitsu.authenticate(token)
      try {
        await kitsu.removeFollow(callback_id)
      }
      catch (error) {
        ctx.body = 'Not yet following.'
        kitsu.unauthenticate()
        return
      }
      kitsu.unauthenticate()
      ctx.body = 'Unfollowed.'
      return
    }

    if (action.value == 'follow') {
      kitsu.authenticate(token)
      try {
        await kitsu.createFollow({
          follower: { id: kitsuid },
          followed: { id: callback_id }
        })
      }
      catch (error) {
        ctx.body = 'Already following.'
        kitsu.unauthenticate()
        return
      }
      kitsu.unauthenticate()
      ctx.body = 'Followed.'
      return
    }
  }

  if (action.name == 'anime') {
    body.attachments[0].title = 'Edit ' + title
    body.attachments[0].actions = []
    let statuses = [
      { text: 'Currently Watching', value: 'current' },
      { text: 'Plan to Watch', value: 'planned' },
      { text: 'Completed', value: 'completed' },
      { text: 'On Hold', value: 'on_hold' },
      { text: 'Dropped', value: 'dropped' },
    ]
    statuses.map((status) => {
      let { text, value } = status
      body.attachments[0].actions.push({
        name: 'animeentry',
        text,
        type: 'button',
        value,
        confirm: {
          title: 'Edit ' + title,
          text: `Are you sure you want to save ${title} as ${text}?`
        }
      })
    })
    kitsu.authenticate(token)
    let entry = await kitsu.getEntryForMedia('anime', kitsuid, callback_id)
    kitsu.unauthenticate()
    if (entry) {
      body.attachments[0].actions.map((attachment) => {
        if (attachment.value == entry.status)
          attachment.style = 'primary'
      })
      body.attachments.push({
        callback_id,
        title: 'Remove ' + title,
        actions: [{
          name: 'animeentry',
          text: 'Remove from Library',
          style: 'danger',
          type: 'button',
          value: 'remove',
          confirm: {
            title: 'Confirm',
            text: `Are you sure you want to remove ${title}?`,
          }
        }]
      })
    }
    ctx.body = body
    return
  }

  if (action.name == 'animeentry') {
    kitsu.authenticate(token)
    let entry = await kitsu.getEntryForMedia('anime', kitsuid, callback_id)

    if (action.value == 'remove') {
      if (entry) {
        await kitsu.removeEntry(entry.id)
        kitsu.unauthenticate()
        ctx.body = 'Removed.'
      }
      else {
        kitsu.unauthenticate()
        ctx.body = 'Not yet in library.'
      }
      return
    }

    let data = {
      status: action.value
    }

    if (entry) {
      data.id = entry.id
      await kitsu.updateEntry(data)
      kitsu.unauthenticate()
      ctx.body = 'Saved.'
      return
    }

    data.media = { id: callback_id, type: 'anime' }
    data.user = { id: kitsuid }
    await kitsu.createEntry(data)
    kitsu.unauthenticate()
    ctx.body = 'Added.'
    return
  }

  if (action.name == 'manga') {
    body.attachments[0].title = 'Edit ' + title
    body.attachments[0].actions = []
    let statuses = [
      { text: 'Currently Reading', value: 'current' },
      { text: 'Plan to Read', value: 'planned' },
      { text: 'Completed', value: 'completed' },
      { text: 'On Hold', value: 'on_hold' },
      { text: 'Dropped', value: 'dropped' },
    ]
    statuses.map((status) => {
      let { text, value } = status
      body.attachments[0].actions.push({
        name: 'mangaentry',
        text,
        type: 'button',
        value,
        confirm: {
          title: 'Edit ' + title,
          text: `Are you sure you want to save ${title} as ${text}?`
        }
      })
    })
    kitsu.authenticate(token)
    let entry = await kitsu.getEntryForMedia('manga', kitsuid, callback_id)
    kitsu.unauthenticate()
    if (entry) {
      body.attachments[0].actions.map((attachment) => {
        if (attachment.value == entry.status)
          attachment.style = 'primary'
      })
      body.attachments.push({
        callback_id,
        title: 'Remove ' + title,
        actions: [{
          name: 'mangaentry',
          text: 'Remove from Library',
          style: 'danger',
          type: 'button',
          value: 'remove',
          confirm: {
            title: 'Confirm',
            text: `Are you sure you want to remove ${title}?`,
          }
        }]
      })
    }
    ctx.body = body
    return
  }

  if (action.name == 'mangaentry') {
    kitsu.authenticate(token)
    let entry = await kitsu.getEntryForMedia('manga', kitsuid, callback_id)

    if (action.value == 'remove') {
      if (entry) {
        await kitsu.removeEntry(entry.id)
        kitsu.unauthenticate()
        ctx.body = 'Removed.'
      }
      else {
        kitsu.unauthenticate()
        ctx.body = 'Not yet in library.'
      }
      return
    }

    let data = {
      status: action.value
    }

    if (entry) {
      data.id = entry.id
      await kitsu.updateEntry(data)
      kitsu.unauthenticate()
      ctx.body = 'Saved.'
      return
    }

    data.media = { id: callback_id, type: 'manga' }
    data.user = { id: kitsuid }
    await kitsu.createEntry(data)
    kitsu.unauthenticate()
    ctx.body = 'Added.'
    return
  }
}
