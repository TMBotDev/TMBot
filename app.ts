// import { sleep } from "deasync";
import { GlobalEvent, GlobalVar } from "./modules/RunTime/Global";
import { BotDockingMgr } from "./modules/BotDockingMgr";
import { ErrorPrint } from "./modules/RunTime/ErrorPrint";
import { PluginPackage } from "./modules/PluginLoader";
import { JsonConfigFileClass } from "./tools/data";
// import { LevelDB } from "./tools/leveldb";
import { Logger } from "./tools/logger";
import { onReadLineInit } from "./modules/ReadLine";
import { OffsetException } from "./modules/RunTime/OffsetException";
import { FileClass } from "./tools/file";

let Logo = String.raw`
  ________  _______        __ 
 /_  __/  |/  / __ )____  / /_
  / / / /|_/ / __  / __ \/ __/
 / / / /  / / /_/ / /_/ / /_  
/_/ /_/  /_/_____/\____/\__/  
                              
`;

let MainLogger = new Logger("TMBot");
let Version = {
    "version": [1, 1, 0] as [number, number, number],
    "isBeta": true,
    "isDebug": false
};
let TMBotConfig = new JsonConfigFileClass("./config/config.json", JSON.stringify({
    "RoBot": {
        "Websocket": "ws://127.0.0.1:22",
        "ReConnectCount": 5,
        "ReConnectTime": 4,
        "GetMsgUseLevelDB": false,
        "InitMsgLog": true,
        "MsgLog": true,
        "NoticeLog": true,
        "LogFile": "RoBotLog-{Y}-{M}-{D}.log",
        "GuildSystem": false
    }
}, null, 2));
GlobalVar.Version = Version;
GlobalVar.MainLogger = MainLogger;
GlobalVar.TMBotConfig = TMBotConfig;

process.on("uncaughtException", (err, _ori) => {
    MainLogger.error(`程序出现未捕获的异常:`);
    if (!(err instanceof Error)) {
        MainLogger.error("未知异常消息: ", err);
        return;
    }
    MainLogger.error(`Stack: ${err.toString()}`);
    if (err.toString().split("\n").length < 2) {
        MainLogger.fatal(`没有找到错误地点!`);
        // GlobalVar.TMBotStop();
        return;
    }
    let off = (!(err instanceof OffsetException)) ? 0 : err.offsetLine;
    let res = GlobalVar.getPluginName(GlobalVar.getErrorFile(err, off));
    if (res.isPlugin) {
        let package_ = PluginPackage.getPackage(res.name);
        let ver = "v0.0.0";
        if (package_) {
            ver = package_.version || ver;
            ver[0].toLowerCase() != "v" ? ver = "v" + ver : "";
        }
        MainLogger.error(`In Plugin: ${res.name}[${ver}]`);
        return;
    }
    ErrorPrint("TMBot_Unknown_Error", "Unknown", `调用堆栈:
\`\`\`txt
${err.stack}
\`\`\`
`, MainLogger);
});

// process.on("uncaughtExceptionMonitor", (err, _ori) => {
//     logger.error(`程序出现未捕获的异常:`);
//     logger.error(`Stack: ${err.stack}`);
// });

function ForEachIter<T, TT, TTT>(iters: Iterator<T, TT, TTT>, fn: (val: T, iters: Iterator<T, TT, TTT>) => void) {
    let iter = iters.next();
    while (!iter.done) {
        fn(iter.value, iters);
        iter = iters.next();
    }
}


async function delayLoadPlugins() {
    await PluginPackage.LoadAllPackage();
}

async function load() {
    if (process.argv.indexOf("-syncVer") != -1) {
        let json = JSON.parse(FileClass.readFrom("./package.json")!);
        json["version"] = Version.version.join(".");
        let str = JSON.stringify(json, null, 2);
        if (FileClass.writeTo("./package.json", str)) {
            MainLogger.warn(`package.json version changed to ${json["version"]}`);
        } else {
            MainLogger.error(`Change package.json Version Fail!`);
        }
        MainLogger.warn(str);
        return;
    }
    if (FileClass.exists("./NO_COLOR")) {
        GlobalVar.LogColor.setLogColor(false);
        MainLogger.info("无颜色模式...");
    }
    MainLogger.info(Logo);
    MainLogger.info(`正在初始化TMBot(v${Version.version.join(".")}${Version.isBeta ? "Beta" : ""})...`);
    MainLogger.info(`开始批量连接OneBot...`);
    let keys = TMBotConfig.getKeys(), l = keys.length, i = 0;
    // console.log(conf.read())
    let startTime = Date.now();
    while (i < l) {
        let name = keys[i++];
        // console.log(name)
        try {
            let obj = TMBotConfig.get(name);
            let ws = obj["Websocket"],
                reConnCount = obj["ReConnectCount"],
                reConnTime = obj["ReConnectTime"];
            if (ws.indexOf("ws://") != 0) {
                throw new TypeError(`Websocket连接必须以 [ws://] 开头!`);
            } else if (typeof (reConnCount) != "number") {
                throw new TypeError(`ReConnectCount(重连次数)参数必须为数字!`);
            } else if (typeof (reConnTime) != "number") {
                throw new TypeError(`ReConnectTime(重连时间)参数必须为数字!`);
            } else if (typeof (obj["GetMsgUseLevelDB"]) != "boolean") {
                throw new TypeError(`GetMsgUseLevelDB(获取消息使用数据库)参数必须为布尔!`);
            } else if (typeof (obj["InitMsgLog"]) != "boolean") {
                throw new TypeError(`InitMsgLog(初始化消息开关)参数必须为布尔!`);
            } else if (typeof (obj["MsgLog"]) != "boolean") {
                throw new TypeError(`MsgLog(消息日志开关)参数必须为布尔!`);
            } else if (typeof (obj["NoticeLog"]) != "boolean") {
                throw new TypeError(`NoticeLog(通知日志开关)参数必须为布尔!`);
            } else if (typeof (obj["LogFile"]) != "string" && obj["LogFile"] != null) {
                throw new TypeError(`LogFile(日志文件)参数必须为字符串或者null!`);
            } else if (typeof (obj["GuildSystem"]) != "boolean") {
                throw new TypeError(`GuildSystem(频道系统)参数必须为布尔!`);
            }
            await class extends BotDockingMgr { static _0xffafdv = (this as any)['\x5f\x4e\x65\x77\x42\x6f\x74'] }['\x5f\x30\x78\x66\x66\x61\x66\x64\x76'](name, ws, reConnCount, reConnTime, obj);
        } catch (e) {
            MainLogger.error(`连接 [${name}] 失败!`);
            MainLogger.error((e as Error).stack);
        }
    }
    await delayLoadPlugins();
    onReadLineInit();
    let allPromise: Promise<any>[] = [];
    ForEachIter(BotDockingMgr.getBotMapIters(), (v) => {
        let bot = v[1];
        allPromise.push(new Promise<void>((res) => {
            let id = bot.events.onInitSuccess.on(() => {
                res();
                bot.events.onInitSuccess.un(id);
            });
        }));
    });
    allPromise.length != 0 && MainLogger.info(`§d--------初始化信息--------`);
    await Promise.all(allPromise);
    GlobalEvent.onTMBotInitd.fire("TMBotProcess_Event_TMBotInitd", null);
    MainLogger.info(`TMBot加载完成! (${((Date.now() - startTime) / 1000).toFixed(2)}s),输入"help"可查看命令列表`);
}

load();

// setTimeout(() => { throw `aaa` }, 3000)