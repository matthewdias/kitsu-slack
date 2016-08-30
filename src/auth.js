import superagent from 'superagent'
import Sequelize from 'sequelize'
import sequelize from './db'

var Team = sequelize.define('team', {
  id: {
    primaryKey: true,
    type: Sequelize.STRING
  },
  token: Sequelize.STRING
})

export default async (ctx, next) => {
  ctx.body = 'Logging In'
  superagent
    .post('https://slack.com/api/oauth.access')
    .send('client_id=' + process.env.CLIENT)
    .send('client_secret=' + process.env.SECRET)
    .send('code=' + ctx.query.code)
    .end(function (err, res) {
      if (res.body.ok == false) {
        console.log('Login Error: ' + res.body.error)
      } else {
        sequelize.sync().then(() => {
          return Team.findCreateFind({
            where: { id: res.body.team_id },
            defaults: {
              token: res.body.access_token
            }
          })[0]
        })
      }
    })
}
