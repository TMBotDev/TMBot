import { BotDockingMgr } from "./modules/BotDockingMgr";
import { ErrorPrint } from "./modules/ErrorPrint";
import { PluginPackage } from "./modules/PluginLoader";
import { JsonConfigFileClass } from "./tools/data";
import { Logger } from "./tools/logger";

let Logo = String.raw`
  ________  _______        __ 
 /_  __/  |/  / __ )____  / /_
  / / / /|_/ / __  / __ \/ __/
 / / / /  / / /_/ / /_/ / /_  
/_/ /_/  /_/_____/\____/\__/  
                              
`;

let logger = new Logger("TMBotMain");

export let Version = {

    "version": [1, 0, 7],

    "isBeta": false,
    "isDebug": false
};

let TMBotConfig = new JsonConfigFileClass("./config/config.json", JSON.stringify({
    "RoBot": {
        "Websocket": "ws://127.0.0.1:22",
        "ReConnectCount": 5,
        "ReConnectTime": 4,
        "MsgLog": true,
        "NoticeLog": true,
        "LogFile": "RoBotLog-{Y}-{M}-{D}.log",
        "ChannelSystem": false
    }
}, null, 2));


process.on("uncaughtException", (err, _ori) => {
    logger.error(`程序出现未捕获的异常:`);
    logger.error(`Stack: ${err.stack}`);
    ErrorPrint("TMBot_Unknown_Error", "Unknown", `调用堆栈:
\`\`\`txt
${err.stack}
\`\`\`
`, logger);
});

// process.on("uncaughtExceptionMonitor", (err, _ori) => {
//     logger.error(`程序出现未捕获的异常:`);
//     logger.error(`Stack: ${err.stack}`);
// });

async function delayLoadPlugins() {
    await PluginPackage.LoadAllPackage();
}

async function load() {
    logger.info(Logo);
    logger.info(`正在初始化TMBot...`);
    logger.info(`开始批量连接OneBot...`);
    let keys = TMBotConfig.getKeys(), l = keys.length, i = 0;
    // console.log(conf.read())
    while (i < l) {
        let name = keys[i++];
        // console.log(name)
        try {
            let obj = TMBotConfig.get(name);
            let ws = obj["Websocket"],
                reConnCount = obj["ReConnectCount"],
                reConnTime = obj["ReConnectTime"];
            if (ws.indexOf("ws://") != 0) {
                throw new Error(`Websocket连接必须以 [ws://] 开头!`);
            } else if (typeof (reConnCount) != "number") {
                throw new Error(`ReConnectCount(重连次数)参数必须为数字!`);
            } else if (typeof (reConnTime) != "number") {
                throw new Error(`ReConnectTime(重连时间)参数必须为数字!`);
            } else if (typeof (obj["MsgLog"]) != "boolean") {
                throw new Error(`MsgLog(消息日志开关)参数必须为布尔!`);
            } else if (typeof (obj["NoticeLog"]) != "boolean") {
                throw new Error(`NoticeLog(通知日志开关)参数必须为布尔!`);
            } else if (typeof (obj["LogFile"]) != "string" && obj["LogFile"] != null) {
                throw new Error(`LogFile(日志文件)参数必须为字符串或者null!`);
            } else if (typeof (obj["ChannelSystem"]) != "boolean") {
                throw new Error(`ChannelSystem(频道系统)参数必须为布尔!`);
            }
            await BotDockingMgr._NewBot(name, ws, reConnCount, reConnTime, obj);
        } catch (e) {
            logger.error(`连接 [${name}] 失败!`);
            logger.error((e as Error).stack);
        }
    }
    await delayLoadPlugins();
    logger.info(`TMBot加载完成!Version: ${Version.version.join(".")}${Version.isBeta ? "Beta" : ""}`);
}
load();