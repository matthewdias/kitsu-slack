import { deleteUser } from './db'

export default async (ctx, next) => {
  let { team_id, user_id } = ctx.request.body
  try {
    await deleteUser(team_id, user_id)
    ctx.body = 'Logged out.'
  } catch (e) {
    console.log(e)
  }
}
