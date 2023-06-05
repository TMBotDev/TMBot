import { createInterface } from "readline";
import { GlobalEvent, GlobalVar } from "./Global";

// let log_ = MainLogger;

export function onReadLineInit() {
    if (typeof (ll) != "undefined") {
        let isStop = false;
        mc.listen("onConsoleCmd", (cmd) => {
            if (isStop) {
                if (cmd != "stop") { return false; }
                return true;
            }
            if (cmd.trim() == "stop") {
                isStop = true;
                let list: Promise<any>[] = [];
                GlobalEvent.onTMBotStop.fire("TMBotProcess_Event_StopRequest", null, (pro) => { list.push(pro); });
                Promise.all(list).then(() => {
                    mc.runcmd("stop");
                    // process.exit(0);
                });
                return false;
            }
            return true;
        });
        return;
    }
    let readline = createInterface({
        "input": process.stdin,
        "output": process.stdout
    });
    let isTrue = false;
    readline.on("SIGINT", async function () {
        if (isTrue) {
            GlobalVar.MainLogger.info("正在请求关闭...");
            readline.close();
            let list: Promise<any>[] = [];
            GlobalEvent.onTMBotStop.fire("TMBotProcess_Event_StopRequest", null, (pro) => { list.push(pro); });
            await Promise.all(list);
            process.exit(0);
        }
        GlobalVar.MainLogger.warn("再按一次退出程序!");
        isTrue = true;
        setTimeout(() => { isTrue = false; }, 3000);
    });
}