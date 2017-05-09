import moment from 'moment'

export function pageAttacment (page) {
  let title = 'Kitsu | '
  if (page === 'anime') {
    title += 'Browse Anime'
  } else if (page === 'manga') {
    title += 'Browse Manga'
  } else if (page === 'groups') {
    title += 'Groups'
  } else if (page === 'feedback') {
    title += 'Feedback'
  } else if (page === 'bugs') {
    title += 'Feedback - Bugs'
  } else if (page === 'feature-requests') {
    title += 'Feedback - Feature Requests'
  } else if (page === 'trending') {
    title += 'Trending'
  } else if (page === 'privacy') {
    title += 'Privacy Policy'
  } else if (page === 'terms') {
    title += 'Terms & Conditions'
  } else if (page === 'about') {
    title += 'About'
  } else title += 'Track. Share. Discover.'

  let text = 'Share anime and manga experiences, get recommendations and see what friends are watching or reading.'

  return {
    color: '#F65440',
    mrkdwn_in: ['text'],
    title,
    title_link: `https://kitsu.io/${page}`,
    text,
    thumb_url: 'https://kitsu-slack.herokuapp.com/icon.png',
    fallback: `${title} - ${text}`,
    footer: 'Kitsu API',
    footer_icon: 'https://kitsu-slack.herokuapp.com/footer-icon.png',
    ts: moment().unix()
  }
}
