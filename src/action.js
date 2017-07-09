import { userAction } from './user'
import { groupAction } from './group'
import { postAction } from './post'
import { commentAction } from './comment'
import { categoryAction } from './category'
import { animeAction } from './anime'
import { mangaAction } from './manga'

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

  let { kitsuid, token } = await kitsu.authUser(team.id, user.id, ctx, kitsu)

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
  if (await categoryAction(actionParams)) return
  if (await animeAction(actionParams)) return
  if (await mangaAction(actionParams)) return
}
