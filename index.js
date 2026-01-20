import { h, byId } from './node_modules/jj/lib/bundle.js'

async function fetchJson(path) {
    const response = await fetch(path)
    if (!response.ok) {
        throw new Error(`GET ${path} failed: ${response.status} ${response.statusText}`)
    }
    return response.json()
}

const subtext = byId('subtext')
subtext.setText('Loading...')
const shares = await fetchJson('unzip/Shares.csv')
subtext.setText(`${shares.length} itmes.`)

const postsEl = byId('posts')
for (const share of shares) {
    if (share.Visibility !== 'MEMBER_NETWORK') {
        console.log(share)
    }
    /*
    Date: "2018-02-01 15:36:20"
    MediaUrl: "https://media.licdn.com/media-proxy/ext?w=1000&h=1029&f=n&hash=hf0PItQq3AKa%2FS6JpaF6geXOWvY%3D&ora=1%2CaFBCTXdkRmpGL2lvQUFBPQ%2CxAVta5g-0R6plxVXyxEg56uS4B7-6UJDTJfRTGP-Bjr3q52fYXHpedjeY7Ll9yFjEXAF1wRtDrLsFlWCT_XtVM3xJ5wk3A"
    ShareCommentary: "Recently I got an unusual traffic to an old post on Medium. Metrics show that most users come from Google search engine. Then I searched it myself! Apparently if you search \"UX engineer\" this is the top result. It's not like going to the first page of hackernews (that got me 28K traffic in a day) but I get a feeling I might have coined this word! :D #uxengineer\nhttps://lnkd.in/ewQaB6T"
    ShareLink: "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6364853719556853760"
    SharedUrl: "https://medium.com/@alexewerlof/what-is-a-ux-engineer-1286d4b6d0e8"
    Visibility: "MEMBER_NETWORK"
    */
    postsEl.append(
        h('article', null,
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
    )
}

