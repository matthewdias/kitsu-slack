import moment from 'moment'

export function reviewAttachment (review, extended) {
  let {
    content,
    likesCount,
    rating,
    spoiler,
    createdAt,
    media,
    user
  } = review

  let text = ''
  let fields = []
  let title_link = process.env.KITSU_HOST + '/reviews/' + review.id
  let title = 'Review'
  let fallback = `${title} by ${user.name} - ${title_link}`

  if (!spoiler && content) {
    text += content
    fallback += `\n${content}`
  }

  if (spoiler) {
    fields.push({
      value: ':exclamation: `SPOILER`',
      short: true
    })
    fallback += '\n[SPOILER]'
  }

  if (media) {
    let type = media.type.charAt(0).toUpperCase() + media.type.slice(1)
    let mediaTitle = (type === 'Anime' ? ':tv: ' : ':orange_book: ') + type
    fields.push({
      title: mediaTitle,
      value: `<https://kitsu.io/${media.type}/${media.slug}|${media.canonicalTitle}>`,
      short: true
    })
    fallback += `\n${type}: ${media.canonicalTitle}`
  }

  if (rating) {
    rating = `${rating / 2} / 10`
    fields.push({
      title: ':star: Rating',
      value: rating,
      short: true
    })
    fallback += `\nRating: ${rating}`
  }

  if (likesCount) {
    fields.push({
      title: ':heart: Likes',
      value: likesCount,
      short: true
    })
    fallback += `\nLikes: ${likesCount}`
  }

  if (createdAt) {
    let time = moment.utc(createdAt).fromNow()
    fields.push({
      title: ':clock3: Reviewed',
      value: time,
      short: true
    })
    fallback += `\nReviewed: ${time}`
  }

  let attachment = {
    color: '#F65440',
    mrkdwn_in: ['text', 'fields'],
    callback_id: review.id,
    title,
    title_link,
    text,
    fields,
    fallback,
    footer: 'Kitsu API',
    footer_icon: 'https://kitsu-slack.herokuapp.com/footer-icon.png',
    ts: moment().unix()
    // actions: [{
    //   name: 'post',
    //   text: '',
    //   type: 'button'
    // }]
  }

  if (user.name) {
    attachment.author_name = user.name
  }

  if (user.avatar) {
    attachment.author_icon = user.avatar.medium
  }

  return attachment
}
