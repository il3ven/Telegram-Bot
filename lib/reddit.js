const snoowrap = require('snoowrap');

const reddit = new snoowrap({
  userAgent: 'express',
  clientId: process.env.reddit_clientid,
  clientSecret: process.env.reddit_secret,
  username: process.env.reddit_username,
  password: process.env.reddit_password
});

/**
 * Get a post from a subreddit that can be then sent as a message
 */
const getAPost = async () => {
  const posts = await reddit.getTop('aww', {time: 'day', limit: 10})
  let i = 0;

  while(i < 10) {
    // console.log(`Reddit Post ${i}`, posts[i])
    if(posts[i].post_hint === 'hosted:video') {
      return [posts[i].title, posts[i].media.reddit_video.fallback_url]
    }

    else if(posts[i].post_hint === 'image' || posts[i].post_hint === 'link') {
      return [posts[i].title, posts[i].url]
    }

    i++;
  }

  return [undefined];
}

module.exports = getAPost