import Sequelize from 'sequelize'
import sequelize from './db'

var User = sequelize.define('user', {
  id: {
    primaryKey: true,
    type: Sequelize.STRING
  },
  kitsuname: Sequelize.STRING,
  token: Sequelize.STRING,
  refresh: Sequelize.STRING
})

export default async (ctx, next, kitsu) => {
  var username = ctx.request.body.text.split(' ')[0]
  var password = ctx.request.body.text.substr(username.length + 1)
  kitsu.login(username, password).then((user) => {
    var newData = {
      kitsuname: username,
      token: user.accessToken,
      refresh: user.refreshToken
    }

    sequelize.sync().then(() => {
      return User.findCreateFind({
        where: { id: ctx.query.team_id + '/' + ctx.query.user_id },
        defaults: newData
      })[0]
    }).then((user) => {
      if (user) {
        console.log(user)
        console.log(user.changed())
        user.update(newData).then((user) => {
          console.log('updated')
        // return user
        }).then((user) => {
          console.log(user.get({
            plain: true
          }))
        })
      }
    })

    ctx.status = 200
    ctx.body = 'Logged In'
  })
}
