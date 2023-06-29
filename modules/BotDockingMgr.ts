import { OneBotDocking } from "./OneBotDocking";
import { WebsocketClient } from "./WebSocket";

// import { sleep } from "deasync";

let allOneBotDockingInstance = new Map<string, OneBotDocking>();

export class BotDockingMgr {
    protected static _NewBot(name: string, conn: string, reConnectCount: number, reConnectTime: number, conf: { [key: string]: any }) {
        return new Promise<boolean>((resF) => {
            reConnectCount = parseInt(reConnectCount + "");
            reConnectTime = parseInt(reConnectTime + "");
            let wsc = new WebsocketClient(conn);
            let d = new OneBotDocking(name, wsc, conf);
            let logger = d.logger;
            let reConnectC = 0;
            let isFirst = true;
            let lock = true;
            let res = false;
            wsc.events.onStart.on(() => {
                logger.info(`服务器连接成功!`);
                reConnectC = 0;
                isFirst = false; lock = false; res = true;
            });
            wsc.events.onClose.on((_code, _desc) => {
                if (d.isClosing || wsc.isDestroy) { return; }
                if (isFirst) {
                    logger.warn(`首次连接失败!将放弃重连!`);
                    wsc.destroy();
                    lock = false;
                } else {
                    if (reConnectCount != 0) {
                        let time = (reConnectTime > 0 ? reConnectTime : 0);
                        if (reConnectC >= reConnectCount) {
                            logger.warn(`重连次数已耗尽!自动关闭...`);
                            wsc.destroy();
                            return;
                        }
                        logger.warn(`WS连接断开!根据配置文件所述,将在${time}秒后重连!(${(reConnectC + 1)}/${reConnectCount})`);
                        let timeout = (time * 1000) || 1;
                        setTimeout(() => {
                            logger.info("开始重连...");
                            wsc.reConnect();
                        }, timeout);
                        reConnectC += 1;
                    } else {
                        logger.warn(`WS连接断开!根据配置文件所述,将不再重连!`);
                        wsc.destroy();
                    }
                }
            });
            wsc.events.onDestroy.on(() => {
                logger.debug("销毁连接实例: ", name);
                allOneBotDockingInstance.delete(name);
            });
            logger.debug("添加连接实例: ", name);
            allOneBotDockingInstance.set(name, d);
            let sid = setInterval(() => {
                if (!lock) { clearInterval(sid); resF(res); }
            }, 10);
        });
    }
    /**
     * 获取Bot实例
     * @note 请在你正在使用的WS实例销毁时一并结束你的插件的一切工作,例子:
     * @code ```
     * let tmp = BotDockingMgr.getBot("xxx");
     * let sid = setInterval(()=>{},1000);
     * tmp.Client.events.onDestroy.on(()=>{
     *     clearInterval(sid);
     * })
     * ```
     */
    static getBot(name: string) {
        return allOneBotDockingInstance.get(name);
    }
    /**
     * 获取迭代器(包含所有账号)
     * @note 请在你正在使用的WS实例销毁时一并结束你的插件的一切工作,例子:
     * @code ```
     * let tmp = BotDockingMgr.getBot("xxx");
     * let sid = setInterval(()=>{},1000);
     * tmp.Client.events.onDestroy.on(()=>{
     *     clearInterval(sid);
     * })
     * ```
     */
    static getBotMapIters() {
        return allOneBotDockingInstance.entries();
    }
}