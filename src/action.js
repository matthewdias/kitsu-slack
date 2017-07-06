import moment from 'moment'
import { getUser, setUser } from './db'
import { userAction } from './user'
import { groupAction } from './group'
import { postAction } from './post'
import { commentAction } from './comment'
import { animeAction } from './anime'
import { mangaAction } from './manga'

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

  let body = { attachments: [{ callback_id }] }

  if (!action.value) {
    if (original_message) {
      var { color, title } = original_message.attachments[0]
    }
    body.color = color
    body.response_type = 'ephemeral'
    body.replace_original = false
  }

  let actionParams = { ctx, kitsu, action, kitsuid, callback_id, body, title, token }
  if (await userAction(actionParams)) return
  if (await groupAction(actionParams)) return
  if (await postAction(actionParams)) return
  if (await commentAction(actionParams)) return
  if (await animeAction(actionParams)) return
  if (await mangaAction(actionParams)) return
}
