import superagent from 'superagent';
import superagentJsonapify from 'superagent-jsonapify';
superagentJsonapify(superagent);
const apiUrl = 'https://hbv3-api-edge.herokuapp.com/api/edge';

export default async (ctx, next) => {
	var profile;
	console.log(ctx.query);
	await superagent.get(apiUrl + '/users?filter[name]=' + ctx.query.text)
		.then(user => {
			console.log(user.body);
			profile = user.body.data[0];
		});

	ctx.status = 200;
	ctx.body = {
		"response_type": "in_channel",
		"link_names": true,
		"attachments": [
			{
				"color": "#EC8662",
				"pretext": '@' + ctx.query.user_name,
				"mrkdwn_in": ["text"],
				"title": profile.attributes.name,
				"title_link": profile.links.self,
				"text": profile.attributes.bio,
				// "thumb_url": apiUrl + profile.attributes.avatar,
				"thumb_url": "https://i.imgur.com/so56rpG.jpg",
				"fields": [
					{
						"title": "About",
						"value": profile.attributes.about,
						"short": false
					},
					{
						"title": "Waifu/Husbando",
						"value": profile.attributes.waifuOrHusbando,
						"short": true
					},
					// {
					// 	"title": "Status",
					// 	"value": ctx.status,
					// 	"short": true
					// },
				],
				"fallback":
					'@' + ctx.query.user_name +
					'\n' + profile.attributes.name +
					'\nAbout: ' + profile.attributes.about +
					'\nBio: ' + profile.attributes.bio +
					'\nWaifu/Husbando: ' + profile.attributes.waifuOrHusbando
					// '\nStatus: ' + ctx.status
			}
		]
	}
}
