import superagent from 'superagent';
import superagentJsonapify from 'superagent-jsonapify';
superagentJsonapify(superagent);
const apiUrl = 'https://hbv3-api-edge.herokuapp.com/api/edge';

export default async (ctx, next) => {
	var media;
	console.log(ctx.query);
	await superagent.get(apiUrl + '/anime?filter[text]=' + ctx.query.text)
		.then(animus => {
			console.log(animus.body);
			media = animus.body.data[0];
		});

	// var genres = media.relationships.genres.data.map(genre => genre.id);
	var type = media.attributes.showType;
	type = type.charAt(0).toUpperCase() + type.slice(1);
	var rating = media.attributes.averageRating.toString().slice(0,4);

	ctx.status = 200;
	ctx.body = {
		"response_type": "in_channel",
		"link_names": true,
		"attachments": [
			{
				"color": "#EC8662",
				"pretext": '@' + ctx.query.user_name,
				"mrkdwn_in": ["text"],
				"title": media.attributes.canonicalTitle,
				"title_link": media.links.self,
				"text": media.attributes.synopsis,
				// "thumb_url": apiUrl + media.attributes.posterImage,
				"image_url": "https://static.hummingbird.me/anime/poster_images/000/007/442/large/attack-on-titan-2.jpg?1418580054",
				// "thumb_url": "https://static.hummingbird.me/anime/poster_images/000/007/442/large/attack-on-titan-2.jpg?1418580054",
				"fields": [
					{
						"title": "Rating",
						"value": rating,
						"short": true
					},
					{
						"title": "Type",
						"value": type,
						"short": true
					},
					{
						"title": "Episodes",
						"value": media.attributes.episodeCount,
						"short": true
					},
					{
						"title": "Length",
						"value": media.attributes.episodeLength,
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
					'\n' + media.attributes.canonicalTitle +
					'\nRating: ' + rating +
					'\nType: ' + type +
					'\nEpisodes: ' + media.attributes.episodeCount +
					'\nLength: ' + media.attributes.episodeLength + ' minutes' +
					// '\nGenres: ' + genres +
					'\nSynopsis: ' + media.attributes.synopsis
					// '\nStatus: ' + ctx.status
			}
		]
	}
}
