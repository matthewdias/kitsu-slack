import moment from 'moment'

export default async (ctx, next, kitsu) => {
  let query = ctx.request.body.text
  console.log('user: ' + query)
  let extended = false
  if (query.indexOf('extended ') == 0) {
    query.replace('extended ', '')
    extended = true
  }
  if (query.indexOf('ex ') == 0) {
    query.replace('ex ', '')
    extended = true
  }
  await kitsu.searchUsers(encodeURI(query)).then((user) => {
    if (user) {
      console.log(user.name)
      let text = ''
      let fields = []
      let title_link = process.env.KITSU_HOST + '/users/' +  user.name
      let fallback = user.name + ' - ' + title_link

      if (user.about) {
        text = user.about
        fallback += `\nAbout: ${user.about}`
      }

      if (extended) {
        let { gender, birthday, createdAt, lifeSpentOnAnime } = user

        if (user.website) {
          fields.push({
            title: ':link: Website(s)',
            value: user.website,
            short: true
          })
          fallback += `\nWebsite(s): ${user.website}`
        }

        if (user.waifuOrHusbando) {
          fields.push({
            title: ':wedding: ' + user.waifuOrHusbando,
            value: user.waifu.name,
            short: true
          })
          fallback += `\n${user.waifuOrHusbando}: ${user.waifu.name}`
        }

        if (gender && gender != 'secret') {
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

        if (lifeSpentOnAnime) {
          let multiples = [
            { interval: 'year', value: 525600 },
            { interval: 'month', value: 43200 },
            { interval: 'day', value: 1440 },
            { interval: 'hour', value: 60 },
            { interval: 'minute', value: 1 }
          ]
          let time = []
          multiples.map((multiple) => {
            let { interval, value } = multiple
            let amount = Math.floor(lifeSpentOnAnime / value)
            if (amount > 0) {
              lifeSpentOnAnime -= amount * value
              if (amount > 1)
                interval += 's'
              time.push(`${amount} ${interval}`)
            }
          })
          time = time.join(', ')
          fields.push({
            title: ':expressionless: Life Spent On Anime',
            value: time,
            short: true
          })
          fallback += `\nLife Spent On Anime: ${time}`
        }
      }

      let body = {
        response_type: 'in_channel',
        link_names: true,
        attachments: [{
          color: '#F65440',
          mrkdwn_in: ['text'],
          title: user.name,
          title_link,
          text,
          thumb_url: user.avatar ? user.avatar.large : null,
          fields,
          fallback
        }]
      }

      ctx.status = 200
      ctx.body = body
    } else {
      ctx.status = 404
      throw new Error('Not Found')
    }
  })
}
