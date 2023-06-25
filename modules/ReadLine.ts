import { createInterface } from "readline";
import { GlobalEvent, GlobalVar } from "./Global";
import { ConsoleCmd } from "./TMBotCommand";

// let log_ = MainLogger;

export function onReadLineInit() {
    if (typeof (ll) != "undefined") {
        let Stopping = false;
        mc.listen("onConsoleCmd", (cmd) => {
            if (Stopping) {
                if (cmd == "stop") { return false; }
                return true;
            }
            if (cmd.trim() == "stop") {
                Stopping = true;
                (async () => {
                    await GlobalVar.TMBotStop();
                    mc.runcmd("stop");
                })();
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
    let Stopping = false;
    readline.on("SIGINT", async function () {
        if (Stopping) {
            GlobalVar.TMBotStop();
            return;
        }
        GlobalVar.MainLogger.warn("再按一次退出程序!");
        Stopping = true;
        setTimeout(() => { Stopping = false; }, 3000);
    });
    GlobalEvent.onTMBotStop.on(function CloseReadline() {
        readline.close();
    });
    readline.on("line", (input) => {
        ConsoleCmd.CmdSystem._execute(input || "", ConsoleCmd.CmdRunner, ConsoleCmd.CmdOutput, false);
    });
}