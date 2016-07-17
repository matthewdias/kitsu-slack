import superagent from 'superagent';
import sequelize from './db';

var Team = sequelize.define('team', {
    id: {
        primaryKey: true,
        type: Sequelize.STRING
    },
    token: Sequelize.STRING,
});

export default async (ctx, next) => {
    console.log(res.body)
    superagent
        .post('https://slack.com/api/oauth.access')
        .send({
            "client_id": process.env.CLIENT,
            "client_secret": process.env.SECRET,
            "code": ctx.query.code
        })
        .set('Content-Type', 'application/json; charset=utf-8')
        .redirects(0)
        .end(function(err, res) {
            if (err || !res.ok) {
                console.log('Login Error: ' + err);
                // ctx.status = 404;
            } else {
                sequelize.sync().then(() => {
                    return Team.findCreateFind({
                        where: { id: team_id },
                        defaults: {
                            token: res.body.access_token;
                        }
                    })[0];
                });

                // ctx.status = 200;
                ctx.body = "Logged In"
            }
        });
}
