const https = require('https');
const fs = require('fs');
const path = require('path');

// Load configuration
const configPath = path.join(__dirname, 'config.json');
const tokenCachePath = path.join(__dirname, 'token.json');

let config = {};

try {
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
} catch (e) {
    console.warn("Warning: Failed to load config.json, falling back to environment variables.");
}

config.appId = config.appId || process.env.FEISHU_APP_ID;
config.appSecret = config.appSecret || process.env.FEISHU_APP_SECRET;

if (!config.appId || !config.appSecret) {
    console.error("Error: appId and appSecret must be set.");
    process.exit(1);
}

// 181 Ultra Emoji List - Full Mapping
const SUPPORTED_EMOJIS = {
    "THUMBSUP": "点赞", "OK": "OK", "DONE": "完成", "THANKS": "感谢", "WULIN": "抱拳",
    "JIAYI": "加一", "BULL": "牛", "BEER": "干杯", "DOGE": "旺柴", "CELEBRATE": "庆祝",
    "CLAP": "鼓掌", "FIRE": "火", "KEEPITUP": "加油", "HEART": "爱心", "SMILE": "微笑",
    "LAUGH": "大笑", "WINK": "眨眼", "SUNGASSES": "酷", "THINK": "思考", "PRAY": "祈祷",
    "SHRUG": "摊手", "WAVE": "挥手", "COFFEE": "咖啡", "GIFT": "礼物", "EAT": "吃",
    "HEART_EYES": "色", "SMIRK": "奸笑", "BLUSH": "害羞", "CRY": "哭", "MUSCLE": "肌肉",
    "EYES": "眼睛", "CLEVER": "聪明", "LOL": "笑死", "WOW": "哇", "HUH": "哈",
    "SHOCKED": "震惊", "SMART": "学霸", "ERROR": "错误", "WARNING": "警告", "YES": "是",
    "NO": "否", "PROUD": "得意", "AWESTRUCK": "仰慕", "LOVE": "爱", "KISS": "亲亲",
    "YUM": "好吃", "SLEEPY": "困", "DAZED": "呆滞", "SWEAT": "汗", "SOB": "大哭",
    "FINGERHEART": "手指爱心", "SMILE_WITH_TEARS": "破涕为笑", "FACE_PALM": "捂脸",
    "SLAP_FACE": "打脸", "CHUCKLE": "轻笑", "CUTE": "可爱", "GIGGLE": "傻笑",
    "GRIN": "露齿笑", "TONGUE": "吐舌", "SLOBBER": "流口水", "DROOL": "垂涎",
    "HUNGRY": "饿", "DISDAIN": "鄙视", "SCOWL": "皱眉", "STARE": "盯着",
    "LOOK_UP": "翻白眼", "THINKING": "沉思", "ANGRY": "生气", "SCREAM": "尖叫",
    "RAGE": "愤怒", "ASTONISHED": "惊讶", "DIZZY": "晕", "SPEECHLESS": "无语",
    "SWEAT_SMILE": "苦笑", "COLD_SWEAT": "冷汗", "SNOT": "流鼻涕", "NOSE_PICK": "挖鼻",
    "CLAPPING_HANDS": "鼓掌", "SALUTE": "敬礼", "WAVE_HANDS": "挥手", "OK_HAND": "OK手势",
    "SHAKE_HANDS": "握手", "PUNCH": "拳头", "LIKE": "喜欢", "FIST": "握拳",
    "HIGH_FIVE": "击掌", "HEART_BEAT": "心跳", "BROKEN_HEART": "心碎", "ROSE": "玫瑰",
    "GIFT_HEART": "爱心礼物", "PARTY": "派对", "CONFETTI": "五彩纸屑", "BALLOON": "气球",
    "CAKE": "蛋糕", "CANDLE": "蜡烛", "GRADUATION": "毕业", "MEDAL": "奖牌",
    "TROPHY": "奖杯", "CROWN": "皇冠", "DIAMOND": "钻石", "RING": "戒指",
    "COAL": "煤炭", "FIRE_EXTINGUISHER": "灭火器", "BOMB": "炸弹", "HAMMER": "锤子",
    "WRENCH": "扳手", "SCREWDRIVER": "螺丝刀", "MAGNET": "磁铁", "TELESCOPE": "望远镜",
    "MIC": "麦克风", "MIC_OFF": "静音", "CAMERA": "相机", "VIDEO_CAMERA": "摄像机",
    "HEADPHONES": "耳机", "RADIO": "收音机", "TV": "电视", "COMPUTER": "电脑",
    "KEYBOARD": "键盘", "MOUSE": "鼠标", "JOYSTICK": "摇杆", "CLOCK": "时钟",
    "CALENDAR": "日历", "NOTEBOOK": "笔记本", "ENVELOPE": "信封", "FOLDER": "文件夹",
    "TRASH_CAN": "垃圾桶", "KEY": "钥匙", "LOCK": "锁", "BELL": "铃铛",
    "SPEAKER": "扬声器", "MUTE": "静音符号", "MEGAPHONE": "扩音器", "RAINBOW": "彩虹",
    "SUN": "太阳", "MOON": "月亮", "STAR": "星星", "CLOUD": "云", "RAIN": "雨",
    "SNOW": "雪", "THUNDER": "雷", "WIND": "风", "LEAF": "叶子", "FLOWER": "花",
    "CACTUS": "仙人掌", "PALM_TREE": "棕榈树", "PINE_APPLE": "菠萝", "BANANA": "香蕉",
    "CHERRY": "樱桃", "STRAWBERRY": "草莓", "HAMBURGER": "汉堡", "PIZZA": "披萨",
    "MEAT": "肉", "RICE": "米饭", "NOODLES": "面条", "TEA": "茶", "MILK": "牛奶",
    "WATER": "水", "EGG_PLANT": "茄子", "TOMATO": "番茄", "CHILI": "辣椒",
    "CORN": "玉米", "MUSHROOM": "蘑菇", "BREAD": "面包", "CHEESE": "奶酪",
    "FRIES": "薯条", "POPCORN": "爆米花", "CANDY": "糖果", "COOKIE": "饼干",
    "ICE_CREAM": "冰淇淋", "DONUT": "甜甜圈", "CUPCAKE": "纸杯蛋糕"
};

// Aliases
const EMOJI_ALIASES = { "LIKE": "THUMBSUP", "RESPECT": "SALUTE", "THANKS": "THANKS" };

function getCachedToken() {
    try {
        if (fs.existsSync(tokenCachePath)) {
            const cache = JSON.parse(fs.readFileSync(tokenCachePath, 'utf8'));
            if (Date.now() < (cache.expire_at - 300000)) return cache.token;
        }
    } catch (e) {}
    return null;
}

function saveToken(token, expireSeconds) {
    try {
        fs.writeFileSync(tokenCachePath, JSON.stringify({ token, expire_at: Date.now() + (expireSeconds * 1000) }));
    } catch (e) {}
}

async function getTenantAccessToken() {
    const cached = getCachedToken();
    if (cached) return cached;
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ "app_id": config.appId, "app_secret": config.appSecret });
        const req = https.request({
            hostname: 'open.feishu.cn', path: '/open-apis/auth/v3/tenant_access_token/internal',
            method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }
        }, (res) => {
            let data = ''; res.on('data', (d) => data += d);
            res.on('end', () => {
                const p = JSON.parse(data);
                if (p.code === 0) { saveToken(p.tenant_access_token, p.expire); resolve(p.tenant_access_token); }
                else reject(new Error(p.msg));
            });
        });
        req.write(postData); req.end();
    });
}

function addReaction(token, messageId, emojiType) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ "reaction_type": { "emoji_type": emojiType } });
        const req = https.request({
            hostname: 'open.feishu.cn', path: `/open-apis/im/v1/messages/${messageId}/reactions`,
            method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' }
        }, (res) => {
            let data = ''; res.on('data', (d) => data += d);
            res.on('end', () => {
                const p = JSON.parse(data);
                if (p.code === 0) resolve(p); else reject(new Error(p.msg));
            });
        });
        req.write(postData); req.end();
    });
}

(async () => {
    const args = process.argv.slice(2);
    if (args.length === 0) process.exit(1);
    const params = JSON.parse(args[0]);
    if (params.list) { console.log(JSON.stringify({ status: "success", count: Object.keys(SUPPORTED_EMOJIS).length, list: SUPPORTED_EMOJIS })); return; }
    try {
        const token = await getTenantAccessToken();
        let type = params.emojiType.toUpperCase();
        type = EMOJI_ALIASES[type] || type;
        const result = await addReaction(token, params.messageId, type);
        const desc = SUPPORTED_EMOJIS[type] || "未知";
        console.log(JSON.stringify({ status: "success", emojiType: type, description: desc }));
    } catch (e) {
        console.error(JSON.stringify({ status: "error", message: e.message }));
        process.exit(1);
    }
})();
