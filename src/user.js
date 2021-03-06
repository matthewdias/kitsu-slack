import moment from 'moment'
import { getUser } from './db'
import help from './help'

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

    if (user.waifu) {
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

export async function userAction ({ ctx, kitsu, action, kitsuid, callback_id, body, title, token }) {
  if (action.name === 'user') {
    if (kitsuid === callback_id) {
      ctx.body = {
        text: 'You can\'t follow yourself.',
        response_type: 'ephemeral',
        replace_original: false
      }
      return
    }

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
    return true
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
      return true
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
      return true
    }
  }
  return false
}

export default async (ctx, next, kitsu) => {
  let { text, team_id } = ctx.request.body
  if (!text) {
    help(ctx, next)
    return
  }

  console.log('user: ' + text)
  let extended = false
  if (text.indexOf('extended ') === 0) {
    text = text.substring(9)
    extended = true
  }
  if (text.indexOf('ex ') === 0) {
    text = text.substring(3)
    extended = true
  }
  let user
  if (text.indexOf('<@') === 0) {
    let id = text.substring(2, text.indexOf('|'))
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
      user = await kitsu.searchUsers(encodeURI(text), extended)
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
