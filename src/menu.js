import { authAction } from './action'

export default async (ctx, next, kitsu) => {
  let payload = JSON.parse(ctx.request.body.payload)
  let {
    name,
    callback_id,
    team,
    user
  } = payload

  let consumeVerb = name === 'animeentry' ? 'Watch' : 'Read'

  let body = {
    options: [
      { text: `Currently ${consumeVerb}ing`, value: 'current' },
      { text: `Want to ${consumeVerb}`, value: 'planned' },
      { text: 'Completed', value: 'completed' },
      { text: 'On Hold', value: 'on_hold' },
      { text: 'Dropped', value: 'dropped' },
      { text: 'Not in Library', value: 'unadded' }
    ]
  }

  let kitsuUser = await authAction(team.id, user.id, ctx, kitsu)
  if (!kitsuUser) {
    return
  }
  let { kitsuid, token } = kitsuUser

  kitsu.authenticate(token)
  let entry
  if (name === 'animeentry') {
    entry = await kitsu.getEntryForAnime(kitsuid, callback_id)
  } else if (name === 'mangaentry') {
    entry = await kitsu.getEntryForManga(kitsuid, callback_id)
  }
  kitsu.unauthenticate()

  let status = entry ? entry.status : 'unadded'
  body.selected_options = [
    body.options.find(option => option.value === status)
  ]

  ctx.body = body
}
