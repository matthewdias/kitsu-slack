import superagent from 'superagent';
import superagentJsonapify from 'superagent-jsonapify';
superagentJsonapify(superagent);
const apiUrl = 'https://hbv3-api-edge.herokuapp.com/api/edge';

export default async (ctx, next) => {
	var profile;
	console.log('user: ' + ctx.query.text);
	await superagent.get(apiUrl + '/users?filter[name]=' + ctx.query.text)
		.then(user => {
			if(user.body.data[0]) {
				profile = user.body.data[0];
				console.log(profile.attributes.name);
			}
			else {
				ctx.status = 404;
				throw new Error('Not Found');
			}
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
					}
				],
				"fallback":
					'@' + ctx.query.user_name +
					'\n' + profile.attributes.name +
					'\nAbout: ' + profile.attributes.about +
					'\nBio: ' + profile.attributes.bio +
					'\nWaifu/Husbando: ' + profile.attributes.waifuOrHusbando
			}
		]
	}
}
