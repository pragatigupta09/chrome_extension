const cheerio = require('cheerio');

function scrapeInstagram(html, url) {
  const $ = cheerio.load(html);
  const data = {
    username: null,
    displayName: null,
    bio: null,
    followerCount: null,
    followingCount: null,
    postCount: null
  };

  try {
    const jsonScripts = $('script[type="application/ld+json"]');
    let jsonData = null;

    jsonScripts.each((i, el) => {
      try {
        const content = $(el).html();
        const parsed = JSON.parse(content);
        if (parsed['@type'] === 'Person' || parsed.mainEntityOfPage) {
          jsonData = parsed;
          return false; 
        }
      } catch (e) {
      }
    });

    const allScripts = $('script').toArray();
    
    for (const scriptEl of allScripts) {
      const scriptContent = $(scriptEl).html() || '';
      
     if (scriptContent.includes('_sharedData') || scriptContent.includes('ProfilePage')) {
        try {
          const match = scriptContent.match(/window\._sharedData\s*=\s*({.+?});/);
          if (match) {
            const sharedData = JSON.parse(match[1]);
            if (sharedData.entry_data && sharedData.entry_data.ProfilePage) {
              const profileData = sharedData.entry_data.ProfilePage[0]?.graphql?.user;
              if (profileData) {
                data.username = profileData.username || null;
                data.displayName = profileData.full_name || null;
                data.bio = profileData.biography || null;
                data.followerCount = profileData.edge_followed_by?.count || null;
                data.followingCount = profileData.edge_follow?.count || null;
                data.postCount = profileData.edge_owner_to_timeline_media?.count || null;
                return data; 
              }
            }
          }
        } catch (e) {
        }
      }
      
      if (scriptContent.includes('__additionalDataLoaded') || scriptContent.includes('"ProfilePage"')) {
        try {
          const graphqlMatch = scriptContent.match(/"graphql"\s*:\s*({[^}]+"user"\s*:\s*{[^}]+})/);
          if (graphqlMatch) {
            const graphqlData = JSON.parse('{' + graphqlMatch[1] + '}');
            const userData = graphqlData.graphql?.user;
            if (userData) {
              data.username = userData.username || null;
              data.displayName = userData.full_name || null;
              data.bio = userData.biography || null;
              data.followerCount = userData.edge_followed_by?.count || null;
              data.followingCount = userData.edge_follow?.count || null;
              data.postCount = userData.edge_owner_to_timeline_media?.count || null;
              if (data.username && data.displayName) {
                return data; 
              }
            }
          }
          
          const userMatch = scriptContent.match(/"username"\s*:\s*"([^"]+)"/);
          const fullNameMatch = scriptContent.match(/"full_name"\s*:\s*"([^"]*)"/);
          const bioMatch = scriptContent.match(/"biography"\s*:\s*"([^"]*)"/);
          
          if (userMatch) {
            data.username = userMatch[1];
            if (fullNameMatch && fullNameMatch[1]) {
              data.displayName = fullNameMatch[1];
            }
            if (bioMatch && bioMatch[1]) {
              data.bio = bioMatch[1].replace(/\\n/g, '\n').trim() || null;
            }
          }
        } catch (e) {
        }
      }
    }

    if (!data.username && url) {
      const urlMatch = url.match(/instagram\.com\/([^\/\?]+)/);
      if (urlMatch) {
        data.username = urlMatch[1];
      }
    }

    if (!data.username) {
      const ogTitle = $('meta[property="og:title"]').attr('content') || '';
      const usernameMatch = ogTitle.match(/@([a-zA-Z0-9._]+)/);
      if (usernameMatch) {
        data.username = usernameMatch[1];
      } else {
        const titleText = $('title').text();
        const titleUsernameMatch = titleText.match(/@([a-zA-Z0-9._]+)/);
        if (titleUsernameMatch) {
          data.username = titleUsernameMatch[1];
        } else {
          const usernameEl = $('h2, span').filter((i, el) => {
            const text = $(el).text().trim();
            return /^@?[a-zA-Z0-9._]+$/.test(text) && !text.includes(' ');
          }).first();
          if (usernameEl.length) {
            data.username = usernameEl.text().replace('@', '').trim();
          }
        }
      }
    }

    if (!data.displayName) {
      const ogTitle = $('meta[property="og:title"]').attr('content') || '';
      if (ogTitle) {
        const displayNameMatch = ogTitle.match(/^([^(]+?)(?:\s*\(|@)/);
        if (displayNameMatch) {
          data.displayName = displayNameMatch[1].trim();
        } else {
          data.displayName = ogTitle.trim();
        }
      }
      
      if (!data.displayName) {
        const headingText = $('h1, h2').first().text().trim();
        if (headingText && !headingText.startsWith('@') && headingText.includes(' ')) {
          data.displayName = headingText;
        }
      }
    }

    if (!data.bio) {
      const metaDesc = $('meta[property="og:description"]').attr('content') || '';
      if (metaDesc && !metaDesc.includes('followers') && !metaDesc.includes('posts')) {
        const bioMatch = metaDesc.match(/^([^•]+?)(?:\s*•|followers|posts)/i);
        if (bioMatch) {
          data.bio = bioMatch[1].trim();
        } else if (metaDesc.length > 20) {
          data.bio = metaDesc.trim();
        }
      }
      
      if (!data.bio) {
        const bioSelectors = [
          'div[dir="auto"]', 
          'span[dir="auto"]',
          'div.-vDIg span',
          'h1 + div span',
          'header section div span',
          'div[role="main"] header section div span'
        ];
        
        for (const selector of bioSelectors) {
          const bioEl = $(selector).filter((i, el) => {
            const text = $(el).text().trim();
            return text.length > 10 && text.length < 500 && 
                   !text.match(/^\d+[km]?$/) && 
                   !text.includes('followers') && 
                   !text.includes('following') &&
                   !text.includes('posts');
          }).first();
          
          if (bioEl.length) {
            const bioText = bioEl.text().trim();
            if (bioText !== data.username && bioText !== data.displayName) {
              data.bio = bioText;
              break;
            }
          }
        }
      }
      
      if (!data.bio) {
        const header = $('header').first();
        if (header.length) {
          const afterHeader = header.nextAll('div, section').first();
          if (afterHeader.length) {
            const text = afterHeader.find('span, div').first().text().trim();
            if (text && text.length > 10 && text.length < 500 && 
                !text.match(/^\d+/) && text !== data.username && text !== data.displayName) {
              data.bio = text;
            }
          }
        }
      }
    }

    if (!data.followerCount) {
      const followerText = $('span:contains("followers"), a:contains("followers")').first().text() ||
                          $('meta[property="og:description"]').attr('content') || '';
      const followerMatch = followerText.match(/([\d,]+)\s*followers?/i);
      if (followerMatch) {
        data.followerCount = parseInt(followerMatch[1].replace(/,/g, ''), 10);
      }
    }

    if (!data.followingCount) {
      const followingText = $('span:contains("following"), a:contains("following")').first().text() ||
                           $('meta[property="og:description"]').attr('content') || '';
      const followingMatch = followingText.match(/([\d,]+)\s*following/i);
      if (followingMatch) {
        data.followingCount = parseInt(followingMatch[1].replace(/,/g, ''), 10);
      }
    }

    if (!data.postCount) {
      const postText = $('span:contains("posts"), a:contains("posts")').first().text() ||
                      $('meta[property="og:description"]').attr('content') || '';
      const postMatch = postText.match(/([\d,]+)\s*posts?/i);
      if (postMatch) {
        data.postCount = parseInt(postMatch[1].replace(/,/g, ''), 10);
      }
    }

    if (!data.followerCount || !data.followingCount || !data.postCount) {
      const statElements = $('span, a').filter((i, el) => {
        const text = $(el).text().trim();
        return /^\d+[km]?$|^\d+[,\d]*$/.test(text) && $(el).parent().text().match(/followers?|following|posts?/i);
      });

      statElements.each((i, el) => {
        const text = $(el).text().trim();
        const num = parseInt(text.replace(/[km,]/gi, ''), 10);
        if (isNaN(num)) return;

        const parentText = $(el).parent().text().toLowerCase();
        if (parentText.includes('follower') && !data.followerCount) {
          data.followerCount = num;
        } else if (parentText.includes('following') && !data.followingCount) {
          data.followingCount = num;
        } else if (parentText.includes('post') && !data.postCount) {
          data.postCount = num;
        }
      });
    }

    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string') {
        data[key] = data[key].replace(/\s+/g, ' ').trim() || null;
      }
    });

    if (data.username && data.displayName && data.username === data.displayName) {
      const ogTitle = $('meta[property="og:title"]').attr('content') || '';
      if (ogTitle) {
        const parts = ogTitle.split(/[@(•]/);
        if (parts.length > 1 && parts[0].trim() !== data.username) {
          data.displayName = parts[0].trim();
        } else {
          data.displayName = null;
        }
      } else {
        data.displayName = null;
      }
    }

    if (data.bio) {
      data.bio = data.bio.replace(/\s+/g, ' ').replace(/\\n/g, '\n').trim();

      if (!data.displayName) {
        const wordCount = data.bio.split(' ').filter(Boolean).length;
        const looksLikeName =
          wordCount >= 1 &&
          wordCount <= 4 &&
          !data.bio.includes('followers') &&
          !data.bio.includes('posts') &&
          !data.bio.includes('Instagram');

        if (looksLikeName) {
          data.displayName = data.bio;
          data.bio = null;
        }
      }

      if (data.bio && (data.bio.length < 3 || data.bio === data.username || data.bio === data.displayName)) {
        data.bio = null;
      }
    }

  } catch (error) {
    console.error('Error scraping Instagram:', error);
    throw new Error(`Failed to scrape Instagram profile: ${error.message}`);
  }

  return data;
}

module.exports = { scrapeInstagram };


