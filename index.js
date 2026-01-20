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

const render = {
    renderEvents(events) {
        function statusToStr(status) {
            switch (status) {
                case 'APPROVED':
                    return '✅'
                case 'RELINQUISHED':
                    return '❌'
                default:
                    return status
            }
        }

        return events.map(event => {
            /*
            {
                "Event Name": "Driving Innovation and growth in a scaling tech company",
                "Event Time": "Jun 16, 2023 10:00 AM - Jun 16, 2023 11:00 AM",
                "Status": "RELINQUISHED",
                "External Url": ""
            }
            */
            const time = h('time', null, event['Event Time'])

            const status = h('span', { title: 'Status' }, statusToStr(event['Status']))

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
        })
    },
    renderShares(shares) {
        return shares.map(share => {
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
        })
    },
    renderComments(comments) {
        return comments.map(comment => {
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
        })
    }
}

async function showFile(name) {
    contents.setText('Loading...')
    const fileContents = await fetchJson(`unzip/${name}.csv`)
    contents.setText('Rendering...')
    const renderFunction = `render${name}`
    try {
        const newChildren = render[renderFunction](fileContents)
        contents.replaceChildren(...newChildren)
    } catch (err) {
        console.error(err)
        status.setText(err.message)
    }
}

queryAll('#file-list button').forEach(btn => {
    btn.onClick(() => {
        showFile(btn.getText()).catch(err => status.setText(err.message))
    })
})

