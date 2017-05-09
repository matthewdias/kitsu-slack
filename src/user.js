import moment from 'moment'
import { WebClient } from '@slack/client'
import { getTeam, getUser } from './db'

export function userAttachment (user, extended) {
  let text = ''
  let fields = []
  let title_link = process.env.KITSU_HOST + '/users/' + user.name
  let fallback = user.name + ' - ' + title_link

  if (user.about) {
    text = user.about
    fallback += `\nAbout: ${user.about}`
  }

  if (extended) {
    let { gender, birthday, createdAt } = user

    if (user.waifuOrHusbando) {
      fields.push({
        title: ':wedding: ' + user.waifuOrHusbando,
        value: user.waifu.name,
        short: true
      })
      fallback += `\n${user.waifuOrHusbando}: ${user.waifu.name}`
    }

    if (gender && gender !== 'secret') {
      gender = gender.charAt(0).toUpperCase() + gender.slice(1)
      fields.push({
        title: ':man-woman-girl-boy: Gender',
        value: gender,
        short: true
      })
      fallback += `\nGender: ${gender}`
    }

    if (user.location) {
      fields.push({
        title: ':round_pushpin: Location',
        value: user.location,
        short: true
      })
      fallback += `\nLocation: ${user.location}`
    }

    if (birthday) {
      let date = moment(birthday.substring(birthday.indexOf('-') + 1), '[YYYY-]MM[-]DD')
      birthday = `${date.format('MMMM Do')} (${date.fromNow()})`
      fields.push({
        title: ':birthday: Birthday',
        value: birthday,
        short: true
      })
      fallback += `\nBirthday: ${birthday}`
    }

    if (createdAt) {
      let date = moment(createdAt, 'YYYY[-]MM[-]DD')
      createdAt = `${date.format('MMMM Do YYYY')} (${date.fromNow()})`
      fields.push({
        title: ':spiral_calendar_pad: Join Date',
        value: createdAt,
        short: true
      })
      fallback += `\nJoin Date: ${createdAt}`
    }

    fields.push({
      title: ':busts_in_silhouette: Followers',
      value: user.followersCount,
      short: true
    })
    fallback += `\nFollowers: ${user.followersCount}`

    fields.push({
      title: ':sleuth_or_spy: Following',
      value: user.followingCount,
      short: true
    })
    fallback += `\nFollowing: ${user.followingCount}`
  }

  return {
    color: '#F65440',
    mrkdwn_in: ['text'],
    callback_id: user.id,
    title: user.name,
    title_link,
    text,
    thumb_url: user.avatar ? user.avatar.medium : null,
    fields,
    fallback,
    footer: 'Kitsu API',
    footer_icon: 'https://kitsu-slack.herokuapp.com/footer-icon.png',
    ts: moment().unix(),
    actions: [{
      name: 'user',
      text: 'Follow/Unfollow',
      type: 'button'
    }]
  }
}

const atUser = async (teamid, username) => {
  let { token } = await getTeam(teamid)
  let slack = new WebClient(token)
  let body = await slack.users.list()
    .catch((err) => { throw new Error(err) })
  if (body.ok === false) {
    console.log('Error: ' + body.error)
  } else {
    let user
    body.members.forEach((member) => {
      if (!user && member.name === username) {
        user = member.id
      }
    })
    if (user) {
      return user
    }
  }
}

export default async (ctx, next, kitsu) => {
  let query = ctx.request.body.text
  console.log('user: ' + query)
  let extended = false
  if (query.indexOf('extended ') === 0) {
    query = query.substring(9)
    extended = true
  }
  if (query.indexOf('ex ') === 0) {
    query = query.substring(3)
    extended = true
  }
  let user
  if (query.indexOf('@') === 0) {
    query = query.substring(1)
    let { team_id } = ctx.request.body
    let id = await atUser(team_id, query)
    if (id) {
      let u = await getUser(team_id, id)
      if (u) {
        try {
          user = await kitsu.getUser(u.kitsuid, extended)
        } catch (error) {
          ctx.status = 404
        }
      } else ctx.body = 'User has not logged in.'
    } else ctx.body = 'No such Slack user.'
  } else {
    try {
      user = await kitsu.searchUsers(encodeURI(query), extended)
    } catch (error) {
      ctx.status = 404
      return
    }
  }
  if (user) {
    console.log(user.name)

    let body = {
      response_type: 'in_channel',
      link_names: true,
      attachments: [userAttachment(user, extended)]
    }

    ctx.status = 200
    ctx.body = body
  }
}
