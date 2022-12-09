import { BotDockingMgr } from "./modules/BotDockingMgr";
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

let conf = new JsonConfigFileClass("./config/config.json", "{}");


process.on("uncaughtException", (err, _ori) => {
    logger.error(`程序出现未捕获的异常:`);
    logger.error(`Stack: ${err.stack}`);
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
    let keys = conf.getKeys(), l = keys.length, i = 0;
    // console.log(conf.read())
    while (i < l) {
        let name = keys[i++];
        // console.log(name)
        try {
            let obj = conf.get(name);
            let ws = obj["Websocket"],
                reConnCount = obj["ReConnectCount"],
                reConnTime = obj["ReConnectTime"];
            if (ws.indexOf("ws://") != 0) {
                throw new Error(`Websocket连接必须以 [ws://] 开头!`);
            } else if (typeof (reConnCount) != "number") {
                throw new Error(`ReConnectCount(重连次数)参数必须为数字!`);
            } else if (typeof (reConnTime) != "number") {
                throw new Error(`ReConnectTime(重连时间)参数必须为数字!`);
            }
            await BotDockingMgr._NewBot(name, ws, reConnCount, reConnTime);
        } catch (e) {
            logger.error(`连接 [${name}] 失败!`);
            logger.error((e as Error).stack);
        }
    }
    delayLoadPlugins();
}
load();