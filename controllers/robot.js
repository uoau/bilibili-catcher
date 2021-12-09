const puppeteer = require('puppeteer');
const _ = require('lodash');
const fs = require('fs');
const bilibiliCookie = `rpdid=|(umYRYu))RJ0J'ulm|RY~mJl; LIVE_BUVID=AUTO1115909052673538; blackside_state=1; buivd_fp=5AD8F831-15EC-432E-B6FF-A40645FC693A143104infoc; LIVE_PLAYER_TYPE=1; buvid3=7B16EE7A-3639-4760-9356-1C1DF1ED8B6913412infoc; _uuid=2F212362-4867-937C-C63F-1C3E1166A3AC51481infoc; buvid_fp=7B16EE7A-3639-4760-9356-1C1DF1ED8B6913412infoc; SESSDATA=843e2a83%2C1641457378%2Cb9036%2A71; bili_jct=e6b55cb632dd9b2c964c29a6af6f7aac; DedeUserID=18075322; DedeUserID__ckMd5=8b3df0c87a70a9d3; sid=63yxpo8x; buvid_fp_plain=7B16EE7A-3639-4760-9356-1C1DF1ED8B6913412infoc; bp_t_offset_18075322=592542759128683400; bsource=search_baidu; video_page_version=v_old_home; i-wanna-go-back=1; b_ut=6; fingerprint3=8d38bfdaf13091b786542a1159a6064f; fingerprint=231e2fbe15a66772ce58d6130c6af0c9; bp_video_offset_18075322=598889681409229814; CURRENT_QUALITY=80; b_lsid=7FE8894A_17D8E0503F0; innersign=1; CURRENT_FNVAL=80; fingerprint_s=4e8f16b7eb3eadfe214ac5224ef37b83; CURRENT_BLACKGAP=1; PVID=4`; 
const sleep = (time) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, time);
    })
}
const path = require('path');
// 种子库
class SeedLib {
    constructor(seeds){
        this.seeds = seeds;
    }
    add(seed){
        this.seeds.push(seed);
    }
    getSeed(seed){
        if(!this.seeds.length) return null;
        return this.seeds.splice(0,1)[0];
    }
}
let count = 0;
// 机器人
class Robot {
    constructor(seedLib){
        this.dealing = false;   // 处理中
        this.browser = null;    // 浏览器
        this.seedLib = seedLib; // 载入种子库
        this.browser = null;
        this.logs = [];
        setInterval(() => {
            if(this.dealing) return;
            const seed = this.seedLib.getSeed();
            seed && this.dealSeed(seed);
        }, 3000);
    }
    async dealSeed(seed){
        let log = null;
        try {
            this.dealing = true;
            count ++;
            let { browser } = this;
            if(!browser) {
                this.browser = await puppeteer.launch({
                    headless: false,
                    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // 这里得改为本机的Chrome地址
                    width: 1400,
                    height: 700,
                });
                browser = this.browser;
            }
            // 1、打开页面
            const page = await browser.newPage();
            // 2、注入cookie
            const cookies = bilibiliCookie.split(';');
            for(let i =0; i< cookies.length; i++) {
                const item = cookies[i];
                const [name, value] = item.split('=');
                await page.setCookie({
                    name: name.trim(),
                    value: value.trim(),
                    domain: '.bilibili.com',
                })
            }
            // 3、打开页面
            await page.goto(seed);
            await sleep(3000);
            // 4、获取视频高能坐标
            const { gaonengPoints, videoInfo, videoTitle } = await page.evaluate(async ()=>{
                const videoTitle = document.querySelector('.media-wrapper h1').innerText.replace(/\s/g, '')
                const videoEl = document.querySelector('.bpx-player-video-wrap video');
                videoEl.pause(); // 视频暂停
                const dmBtn = document.querySelector('.bpx-player-dm-root .bui-switch-input');
                dmBtn.click(); // 关闭弹幕
                const { x, y, width, height } = videoEl.getBoundingClientRect(); // 视频宽高
                const timeTotal = videoEl.duration;
                const playBtn =  document.querySelector('.bpx-player-state-wrap'); // 多余元素移除
                playBtn.remove();
                // 获取高能SVG
                const getGaonengPoints = (points) => {
                    let qian = null; // 潜力起始点
                    let prev = null; // 上一点
                    const gaonengPoint = [];
                    for(let i = 0; i< points.length; i++) {
                        let current = points[i];
                        current = [+current[0], 100 - +current[1]];
                        if(!prev) {
                            prev = current;
                            continue;
                        }
                        const [x1, y1] = prev;
                        const [x2, y2] = current;
                        const [x3, y3] = qian || []; // 潜力股坐标
                        k= (y2-y1) / (x2-x1)
                        kqian = qian ? (y1-y3) / (x1-x3) : 0;
                        // 下降
                        if(kqian) console.log(kqian);
                        if(k < 0 && qian) {
                            // 高能点
                            gaonengPoint.push(prev)
                            qian = null;
                            prev = current;
                            continue;
                        }
                        // 发现潜力股
                        if(!qian && k >= 1) {
                            console.log(prev);
                            qian = prev;
                        }else {
                            prev = current;
                        }
                    }
                    return gaonengPoint;
                }
                const svgD = document.querySelector('#bilibili_pbp svg #pbp-curve-path path').getAttribute('d');
                const points = svgD
                    .match(/C[^C]*,[^C]*,[^C]*/g)
                    .map(i => i.match(/C[^C]*,[^C]*,([^C]*)/)[1]
                        .trim()
                        .split(/\s/)
                        .map(j => +j)
                    );
                const gaonengPoints = getGaonengPoints(points);
                return Promise.resolve({
                    videoInfo: {
                        x, y, width, height, timeTotal,
                    },
                    gaonengPoints,
                    videoTitle,
                });
            })
            // 5、计算高能时间
            for(let i = 0; i< gaonengPoints.length; i++) {
                const time = gaonengPoints[i][0] / 1000 * videoInfo.timeTotal;
                await page.evaluate((time)=>{
                    const videoEl = document.querySelector('.bpx-player-video-wrap video');
                    videoEl.currentTime = time; // 设置视频时间
                }, time);
                await sleep(2000);
                await page.screenshot({ 
                    path: path.join(__dirname, `../shots/${videoTitle}-${i+1}.png`),
                    clip: {
                        ...videoInfo,
                    }
                });
                await sleep(1000);
            }
            await page.close();
            log = {
                url: seed,
                state: '成功',
                info: `成功截取${gaonengPoints.length}张图片`,
            }
            this.dealing = false;
        } catch(e) {
            console.log('# 处理失败', e.message);
            log = {
                url: seed,
                state: '失败',
                info: `处理失败`,
            }
        }
        this.logs.push(log);
    }
}

const seeds = ['https://www.bilibili.com/bangumi/play/ep250617?from=search&seid=5378555074974913441&spm_id_from=333.337.0.0' ];
const seedLib = new SeedLib(seeds);
const robot = new Robot(seedLib);

// 新增种子
const addSeed = async (ctx) => {
    const { seeds } = ctx.request.body;
    console.log(seeds);
    robot.seedLib.seeds.push(...seeds);
    ctx.type = "json";
    ctx.body = {
        code: 200,
        data: 'success',
    };
    ctx.status = 200;
};

// 获取机器人信息
const getRobotInfo = async (ctx) => {
    const logs = robot.logs;
    const nowSeeds = robot.seedLib.seeds;
    ctx.type = "json";
    ctx.body = {
        code: 200,
        data: {
            logs,
            nowSeeds,
        },
    };
    ctx.status = 200;
}

module.exports = {
    addSeed,
    getRobotInfo,
}