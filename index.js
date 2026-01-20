import { h, byId, queryAll } from './node_modules/jj/lib/bundle.js'

const status = byId('subtext')
const contents = byId('contents')

async function fetchJson(path) {
    status.setText(`Fetching ${path}...`)
    const response = await fetch(path)
    if (!response.ok) {
        throw new Error(`GET ${path} failed: ${response.status} ${response.statusText}`)
    }
    status.setText('Parsing as JSON...')
    const ret = await response.json()
    status.setText('Done.')
    return ret
}

function eventStatusToStr(status) {
    switch (status) {
        case 'APPROVED':
            return '✅'
        case 'RELINQUISHED':
            return '❌'
        default:
            return status
    }
}

function securityChallengeTypeToStr(securityChallengeType) {
    switch (securityChallengeType) {
        case 'LINKEDIN_APP_CHALLENGE':
            return '📱'
        case 'TWO_STEP_VERIFICATION_AUTHENTICATOR_APP':
            return '🔐'
        case 'SSP_BLOCKING_CHALLENGE':
            return '🚫'
        default:
            return securityChallengeType
    }
}

function recommendationStatusToIcon(status) {
    switch (status) {
        case 'PENDING':
            return '⏳'
        case 'VISIBLE':
            return '✅'
        case 'HIDDEN':
            return '❌'
        default:
            return status
    }
}

function reactionToStr(reaction) {
    switch (reaction) {
        case 'ENTERTAINMENT':
            return '💭'
        case 'PRAISE':
            return '👏'
        case 'LIKE':
            return '👍'
        case 'EMPATHY':
            return '❤️'
        case 'INTEREST':
            return '🤔'
        case 'APPRECIATION':
            return '🙏🏻'
        case 'MAYBE':
            return '🤷'
        default:
            return '❓' + reaction
    }

}

function followStatusToIcon(status) {
    switch (status) {
        case 'Unfollow':
            return '💔'
        case 'Active':
            return '✅'
        default:
            return status
    }
}

function personSearchLink(name) {
    const ret = new URL('https://www.linkedin.com/search/results/people/')
    ret.searchParams.set('keywords', name)
    ret.searchParams.set('origin', 'FACETED_SEARCH')
    return ret.toString()
}

function globalSearchLink(query) {
    const ret = new URL('https://www.linkedin.com/search/results/all/')
    ret.searchParams.set('keywords', query)
    return ret.toString()
}

const render = {
    ['Events']: function renderEvent(event) {
        /*
        {
            "Event Name": "Driving Innovation and growth in a scaling tech company",
            "Event Time": "Jun 16, 2023 10:00 AM - Jun 16, 2023 11:00 AM",
            "Status": "RELINQUISHED",
            "External Url": ""
        }
        */
        const time = h('time', null, event['Event Time'])

        const status = h('span', { title: 'Status' }, eventStatusToStr(event['Status']))

        const name = h('p')
        name.run(function () {
            if (event['External Url']) {
                this.append(h('a', {
                    href: decodeURIComponent(event['External Url']),
                    target: '_blank'
                }, event['Event Name']))
            } else {
                this.setText(event['Event Name'])
            }
        })
        

        return h('article', null,
            h('div', null,
                status,
                time,
                name,
            )
        )
    },
    ['Shares']: function renderShare(share) {
        if (share.Visibility !== 'MEMBER_NETWORK') {
            console.log(share)
        }
        /*
        {
            Date: "2018-02-01 15:36:20"
            MediaUrl: "https://media.licdn.com/media-proxy/ext?w=1000&h=1029&f=n&hash=hf0PItQq3AKa%2FS6JpaF6geXOWvY%3D&ora=1%2CaFBCTXdkRmpGL2lvQUFBPQ%2CxAVta5g-0R6plxVXyxEg56uS4B7-6UJDTJfRTGP-Bjr3q52fYXHpedjeY7Ll9yFjEXAF1wRtDrLsFlWCT_XtVM3xJ5wk3A"
            ShareCommentary: "Recently I got an unusual traffic to an old post on Medium. Metrics show that most users come from Google search engine. Then I searched it myself! Apparently if you search \"UX engineer\" this is the top result. It's not like going to the first page of hackernews (that got me 28K traffic in a day) but I get a feeling I might have coined this word! :D #uxengineer\nhttps://lnkd.in/ewQaB6T"
            ShareLink: "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6364853719556853760"
            SharedUrl: "https://medium.com/@alexewerlof/what-is-a-ux-engineer-1286d4b6d0e8"
            Visibility: "MEMBER_NETWORK"
        }
        */
        return h('article', null,
            h('div', { 
                    class: 'header',
                },
                h('a', {
                        href: decodeURIComponent(share.ShareLink),
                        target: '_blank',
                        title: 'Timestamp',
                    },
                    h('time', null, share.Date),
                ),
                share.MediaUrl && h('div', null, '🖼️ Has Media'),
                h('div', null, share.Visibility).setTitle('Visibility'),
            ),
            h('div', null).setText(share.ShareCommentary),
            share.SharedUrl && h('a', {
                    href: decodeURIComponent(share.SharedUrl),
                    target: '_blank',
                },
                `🔗 ${share.SharedUrl}`
            ),
        )
    },
    ['Comments']: function renderComment(comment) {
        /*
        {
            "Date": "2025-12-06 10:05:49",
            "Link": "https://www.linkedin.com/feed/update/urn%3Ali%3Aactivity%3A740299", Only link to activity
            "Message": "Comment body"
        }
        */
        if (!comment.Message) {
            return h('code', null, `Malformed comment: ${JSON.stringify(comment)}`)
        }
        const time = h('time', null, h('a', {
                href: comment.Link,
                target: '_blank',
            }, comment.Date))
        return h('article', null,
                h('div', { 
                        class: 'header',
                    },
                    time,
                ),
                h('div', null).setText(comment.Message),
            )
    },
    ['messages']: function renderMessage(message) {
        /*
        CONVERSATION ID,CONVERSATION TITLE,FROM,SENDER PROFILE URL,TO,RECIPIENT PROFILE URLS,DATE,SUBJECT,CONTENT,FOLDER,ATTACHMENTS
        */
        return h('article', null,
            h('div', { class: 'header' },
                h('time', null, message.DATE),
                h('span', null,
                    h('a', { href: message['SENDER PROFILE URL'], target: '_blank' }, message.FROM),
                    ' ➡️ ',
                    h('a', { href: message['RECIPIENT PROFILE URLS'], target: '_blank' }, message.TO),
                ),
            ),
            message.SUBJECT && h('div', { style: 'font-weight: bold' }, message.SUBJECT),
            h('div', null).setText(message.CONTENT),
        )
    },
    ['Skills']: function renderSkill(skill) {
        return h('article', null, skill.Name)
    },
    ['Votes']: function renderVote(vote) {
        /*
        {
            "Date": "2024-09-02 05:24:56",
            "Link": "https://www.linkedin.com/feed/update/urn:li:ugcPost:72362348690",
            "OptionText": "Vi konsulter"
        }
        */
        return h('article', null,
            h('div', { 
                    class: 'header',
                },
                h('time', null, h('a', {
                        href: vote.Link,
                        target: '_blank',
                    }, vote.Date)),
                h('div', null).setText(vote.OptionText),
            ),
        )
    },
    ['Security Challenges']: function renderRecord(securityChallenge) {
        /*
        "Challenge Date": "Wed Mar 06 21:40:33 UTC 2022",
        "IP Address": "2000:aaaa:1494:5555:bcbc:6a4a:bb55:efef",
        "User Agent": "LIAuthLibrary:0.0.3 com.linkedin.android:4.1",
        "Country": "Boratestan",
        "Challenge Type": "TWO_STEP_VERIFICATION_AUTHENTICATOR_APP"
        */
        return h('article', null,
            h('div', null, securityChallenge['Challenge Date']),
            h('code', null, securityChallenge['IP Address']),
            h('div', null, 
                h('span', {
                    title: `Challenge Type: ${securityChallenge['Challenge Type']}`,
                }, securityChallengeTypeToStr(securityChallenge['Challenge Type'])),
                h('span', null, securityChallenge['Country']),
            ),
            h('div', null, securityChallenge['User Agent']),
        )    
    },
    ['SearchQueries']: function renderRecord(searchQuery) {
        /*
        "Time": "2025/11/22 10:10:23 UTC",
        "Search Query": "staff engineer"
        */
        return h('article', null,
            h('div', null, searchQuery['Time']),
            h('a', {
                    href: globalSearchLink(searchQuery['Search Query']),
                    target: '_blank',
            }, searchQuery['Search Query']),
        )
    },
    ['Saved_Items']: function renderRecord(savedItem) {
        /*
        "savedItem": "https://www.linkedin.com/feed/update/urn:li:activity:9843795379",
        "CreatedTime": "2025-12-05 18:03:08"
        */
        return h('article', null,
            h('div', null, savedItem['CreatedTime']),
            h('a', {
                    href: savedItem['savedItem'],
                    target: '_blank',
                },
                savedItem['savedItem']
            ),
        )
    },
    ['Reactions']: function renderRecord(reaction) {
        /*
        "Date": "2025-12-15 22:23:37",
        "Type": "ENTERTAINMENT",
        "Link": "https://www.linkedin.com/feed/update/urn%3Ali%3Aactivity"
        */
        return h('article', null,
            h('span', null, reactionToStr(reaction.Type)),
            h('a', {
                    href: reaction.Link,
                    target: '_blank',
                },
                h('time', null, reaction.Date),
            ),
        )
    },
    ['Rich_Media']: function renderRichMedia(media) {
        /*
        {
            "Date/Time": "You uploaded a feed document on July 1, 2024 at 9:39 AM (GMT)",
            "Media Description": "If you're a software developer...",
            "Media Link": "https://media.licdn.com/..."
        }
        */
        return h('article', null,
            h('div', { class: 'header' },
                h('div', null, media['Date/Time'])
            ),
            (media['Media Description'] && media['Media Description'] !== '-') ? h('div', null, media['Media Description']) : null,
            h('a', {
                href: media['Media Link'],
                target: '_blank'
            }, '🔗 View Media')
        )
    },
    ['Positions']: function renderRecord(position) {
        /*
        "Company Name": "Stealth",
        "Title": "AI Application Developer",
        "Description": "Stuff",
        "Location": "City, City, Country",
        "Started On": "Aug 2020",
        "Finished On": ""
        */
        return h('article', null,
            h('h2', null, position['Title']),
            h('div', null, position['Company Name']),
            h('div', null,
                h('time', null, position['Started On']),
                h('time', null, position['Finished On']),
            ),
            h('div', null, position['Location']),
            h('div', null, position['Description']),
        )
    },
    ['Recommendations_Given']: function renderRecord(recommendation) {
        /*
        "First Name": "Jon",
        "Last Name": "Doe",
        "Company": "Company name",
        "Job Title": "Head of Recommendation Office",
        "Text": "Great person",
        "Creation Date": " gatekeeping",
        "Status": " compliance"
        */
        return h('article', null,
            h('time', null, recommendation['Creation Date']),
            h('div', null,
                h('span', null, recommendation['First Name']),
                h('span', null, recommendation['Last Name']),
            ),
            h('div', null, recommendation['Company']),
            h('div', null, recommendation['Job Title']),
            h('div', null, recommendation['Status']),
            h('div', null, recommendation['Text']),
        )
    },
    ['Recommendations_Received']: function renderRecord(recommendation) {
        /*
        "First Name": "Jon",
        "Last Name": "Doe",
        "Company": "Company name",
        "Job Title": "Head of Recommendation Office",
        "Text": "Great person",
        "Creation Date": " gatekeeping",
        "Status": " compliance"
        */
        return h('article', null,
            h('time', null, recommendation['Creation Date']),
            h('div', null,
                h('span', null, recommendation['First Name']),
                h('span', null, recommendation['Last Name']),
            ),
            h('div', null, recommendation['Company']),
            h('div', null, recommendation['Job Title']),
            h('div', null, recommendationStatusToIcon(recommendation['Status'])),
            h('div', null, recommendation['Text']),
        )
    },
    ['Member_Follows']: function renderMemberFollows(follow) {
        /*
        Date,Status,FullName
        */
        return h('article', null,
            h('div', { class: 'header' },
                h('time', null, follow.Date),
                h('span', null, followStatusToIcon(follow.Status)),
            ),
            h('a', {
                    href: personSearchLink(follow.FullName),
                    target: '_blank',
            }, follow.FullName),
        )
    },
    
}

async function showFile(name) {
    contents.setText('Loading...')
    const fileContentsArr = await fetchJson(`unzip/${name}.csv`)
    contents.setText(`${fileContentsArr.length} records...`)
    const renderItem = render[name]
    if (typeof renderItem !== 'function') {
        throw new Error(`Cannot render record: ${name}`)
    }
    try {
        for (const item of fileContentsArr) {
            contents.append(renderItem(item))
        }
    } catch (err) {
        console.error(err)
        status.setText(err.message)
    }
}

console.log()

byId('file-list').mapAppend(Object.keys(render), (name) => {
    return h('button').setData('key', name).setText(name).onClick((event) => {
        showFile(event.target.dataset.key).catch(err => status.setText(err.message))
    })
})
